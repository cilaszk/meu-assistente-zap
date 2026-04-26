const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000; 

// 🚨 MUDE AQUI: Coloque o número do WhatsApp do seu robô
const numeroDoRobo = '50932074530'; 

const client = new Client({
    // O pulo do gato: dar um nome novo para a sessão ignora qualquer erro antigo!
    authStrategy: new LocalAuth({ clientId: 'sessao-zerada-1' }),
    puppeteer: {
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', async (qr) => {
    console.log('\n--- WHATSAPP CARREGANDO... AGUARDE 15 SEGUNDOS ---');
    console.log('Limpando rastros antigos e preparando a tela...');
    
    // Aumentamos o freio para 15 segundos para garantir 100% de carregamento
    setTimeout(async () => {
        try {
            const codigo = await client.requestPairingCode(numeroDoRobo);
            console.log('\n=============================================');
            console.log(`🚀 SEU CÓDIGO DO WHATSAPP É: ${codigo}`);
            console.log('=============================================\n');
            console.log('Agora sim! Digite esse código naquela opção que você achou no celular.');
        } catch (error) {
            console.error('\nErro ao gerar o código:', error);
            console.log('Verifique se o número foi digitado corretamente na linha 8!');
        }
    }, 15000); 
});

client.on('ready', () => {
    console.log('\n🎉 Seu assistente está conectado e pronto para uso!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'oi') {
        message.reply('Olá! Estou rodando perfeitamente de uma sessão novinha em folha! Como posso ajudar?');
    }
});

client.initialize();

app.get('/', (req, res) => {
  res.send('O robô está online e a sessão foi resetada!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
