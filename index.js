const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000; 

// O seu número já está configurado aqui!
const numeroDoRobo = '50932074530'; 

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'sessao-nova-2' }),
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
    console.log('\n--- WHATSAPP CARREGADO! ---');
    
    // PLANO B: Já vamos imprimir o código de texto do QR Code por segurança!
    console.log('\n👇 SE O CÓDIGO DE LETRAS/NÚMEROS DER ERRO, USE O PLANO B ABAIXO 👇');
    console.log('Copie o texto a seguir (começa com 1@) e cole no site br.qr-code-generator.com (na aba Texto):');
    console.log(qr);
    console.log('👆 -------------------------------------------------------- 👆\n');

    console.log('Tentando gerar o código de 8 dígitos... Aguarde 10 segundos...');
    
    setTimeout(async () => {
        try {
            const codigo = await client.requestPairingCode(numeroDoRobo);
            console.log('\n=============================================');
            console.log(`🚀 SEU CÓDIGO DO WHATSAPP É: ${codigo}`);
            console.log('=============================================\n');
        } catch (error) {
            console.error('\n❌ ERRO NO CÓDIGO DE LETRAS (O WhatsApp bloqueou o clique automático) ❌');
            console.log('👉 MAS NÃO SE PREOCUPE! Use o "Plano B" que apareceu logo acima!');
            console.log('Copie aquele texto longo, jogue no site br.qr-code-generator.com, e escaneie o QR Code que vai aparecer na tela do seu computador!');
        }
    }, 10000); 
});

client.on('ready', () => {
    console.log('\n🎉 Seu assistente está conectado e pronto para uso!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'oi') {
        message.reply('Olá! Estou rodando perfeitamente! Como posso ajudar?');
    }
});

client.initialize();

app.get('/', (req, res) => {
  res.send('O robô está online e rodando!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
