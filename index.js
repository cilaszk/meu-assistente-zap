const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000; 

// O seu número está de volta aqui!
const numeroDoRobo = '50932074530'; 

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'sessao-com-numero' }),
    puppeteer: {
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    }
});

client.on('qr', async (qr) => {
    console.log('\n--- WHATSAPP CARREGADO! ---');
    
    // PLANO B IMPRESSO PRIMEIRO POR SEGURANÇA
    console.log('\n=========================================================');
    console.log('👇 SE O CÓDIGO DE NÚMEROS DER ERRO (t: t), USE O TEXTO ABAIXO 👇');
    console.log('=========================================================\n');
    console.log(qr);
    console.log('\n=========================================================');
    console.log('👆 COPIE O TEXTO ACIMA E COLE NO SITE br.qr-code-generator.com 👆');
    console.log('=========================================================\n');

    console.log(`Tentando gerar o código de 8 dígitos para o número ${numeroDoRobo}... Aguarde 12 segundos...`);
    
    setTimeout(async () => {
        try {
            const codigo = await client.requestPairingCode(numeroDoRobo);
            console.log('\n=============================================');
            console.log(`🚀 SEU CÓDIGO DO WHATSAPP É: ${codigo}`);
            console.log('=============================================\n');
        } catch (error) {
            console.error('\n❌ ERRO NO CÓDIGO DE LETRAS (O WhatsApp bloqueou a geração e deu o erro t:t) ❌');
            console.log('👉 O erro não é sua culpa! Use o TEXTO que apareceu logo acima e cole no site br.qr-code-generator.com para gerar o QR Code!');
        }
    }, 12000); 
});

client.on('ready', () => {
    console.log('\n🎉 SUCESSO! Seu assistente está conectado e pronto para uso!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'oi') {
        message.reply('Olá! Estou rodando perfeitamente! Como posso ajudar?');
    }
});

client.initialize();

app.get('/', (req, res) => {
  res.send('O robô está online!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
