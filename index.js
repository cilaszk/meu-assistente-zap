const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000; 

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async () => {
    // Coloque o seu número com DDD aqui no lugar dos números 9! Ex: 5545...
    const meuNumero = "50932074530"; 
    const codigo = await client.requestPairingCode(meuNumero);
    console.log(`\n\n=== SEU CÓDIGO DO WHATSAPP É: ${codigo} ===\n\n`);
});

client.on('ready', () => {
    console.log('Seu assistente está conectado e pronto para uso!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'oi') {
        message.reply('Olá! Estou rodando direto do Render! Como posso ajudar?');
    }
});

client.initialize();

app.get('/', (req, res) => {
  res.send('O robô está online e funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
