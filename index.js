const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000; 

// O seu número já está aqui!
const numeroDoRobo = '50932074530'; 

const client = new Client({
    // Sessão nova para evitar qualquer erro passado
    authStrategy: new LocalAuth({ clientId: 'sessao-somente-codigo' }),
    puppeteer: {
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ],
        // Dando mais tempo para o navegador invisível não dar timeout
        timeout: 60000 
    }
});

// Trava de segurança para não pedir o código duas vezes e bugar
let codigoJaFoiPedido = false;

client.on('qr', async () => {
    if (codigoJaFoiPedido) return; 
    codigoJaFoiPedido = true;

    console.log('\n✅ WhatsApp Web carregado em segundo plano!');
    console.log('⏳ O servidor do Render é um pouco lento... Aguardando 20 segundos para estabilizar a página...');
    
    // Esperando 20 segundos exatos para o WhatsApp respirar
    setTimeout(async () => {
        console.log('\n⚙️ Solicitando o código de emparelhamento para o WhatsApp...');
        try {
            const codigo = await client.requestPairingCode(numeroDoRobo);
            console.log('\n=============================================');
            console.log(`🚀 SEU CÓDIGO DO WHATSAPP É: ${codigo}`);
            console.log('=============================================\n');
            console.log('👉 VAI LÁ! Digite esse código de letras/números no seu celular agora!');
        } catch (error) {
            console.error('\n❌ Erro ao gerar o código:', error.message);
            console.log('O WhatsApp ainda está bloqueando. Tente reiniciar o servidor (Deploy) no Render.');
        }
    }, 20000); 
});

client.on('ready', () => {
    console.log('\n🎉 SUCESSO ABSOLUTO! Seu assistente está conectado e pronto!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'oi') {
        message.reply('Olá! Sobrevivi aos testes e me conectei por código! Como posso ajudar?');
    }
});

client.initialize();

app.get('/', (req, res) => {
  res.send('O robô está online e rodando firme!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
