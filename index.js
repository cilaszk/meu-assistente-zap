const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000; 

const numeroDoRobo = '50932074530'; 

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'sessao-blindada' }),
    puppeteer: {
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--single-process', // Ajuda o Render a não travar a página
            '--disable-extensions' // Evita detecções desnecessárias
        ],
        timeout: 60000 
    }
});

let codigoJaFoiPedido = false;

client.on('qr', async () => {
    if (codigoJaFoiPedido) return; 
    codigoJaFoiPedido = true;

    console.log('\n✅ WhatsApp Web carregou a tela inicial!');
    console.log('⏳ Segurando a ansiedade por 15 segundos para evitar que o WhatsApp recarregue a página...');
    
    setTimeout(async () => {
        try {
            console.log('\n⚙️ Pedindo o código de emparelhamento...');
            const codigo = await client.requestPairingCode(numeroDoRobo);
            console.log('\n=============================================');
            console.log(`🚀 SEU CÓDIGO DO WHATSAPP É: ${codigo}`);
            console.log('=============================================\n');
            console.log('👉 VAI LÁ! Digite esse código no seu celular!');
        } catch (error) {
            console.error('\n❌ O WhatsApp tentou bloquear a geração:', error.message);
            console.log('Se o servidor não caiu, tente reiniciar no Render (Manual Deploy).');
        }
    }, 15000); 
});

client.on('ready', () => {
    console.log('\n🎉 SUCESSO! Robô conectado por código!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'oi') {
        message.reply('Olá! Sobrevivi aos bloqueios e estou online! Como posso ajudar?');
    }
});

// O ".catch" impede que o erro "Execution context was destroyed" desligue o seu servidor!
client.initialize().catch(err => {
    console.error('Erro interno do navegador invisível:', err);
});

app.get('/', (req, res) => {
  res.send('Servidor blindado rodando!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
