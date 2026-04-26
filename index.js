const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000; 

const numeroDoRobo = '50932074530'; 

// Configuração extremamente estável para o Render
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'sessao-definitiva-absoluta' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote'
        ],
        timeout: 90000 
    }
});

let tentativasQr = 0;

client.on('qr', async (qr) => {
    tentativasQr++;
    
    console.log('\n=======================================================');
    console.log('✅ WHATSAPP CARREGADO! ESCOLHA SUA FORMA DE CONECTAR:');
    console.log('=======================================================\n');

    // OPÇÃO 1: QR CODE DIRETO NO NAVEGADOR
    // Isso cria um link mágico que transforma o texto em imagem na hora!
    const qrCodeLink = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`;
    console.log('📷 OPÇÃO 1 (QR CODE RÁPIDO):');
    console.log('Clique ou copie o link abaixo no seu navegador, a imagem do QR vai abrir, aí é só escanear:');
    console.log(qrCodeLink);
    console.log('\n-------------------------------------------------------\n');

    // OPÇÃO 2: CÓDIGO DE NÚMEROS (Tenta apenas na primeira vez)
    if (tentativasQr === 1) {
        console.log('🔢 OPÇÃO 2 (CÓDIGO DE NÚMEROS):');
        console.log(`Tentando gerar o código para o número ${numeroDoRobo}... Aguarde 10 segundos...`);
        
        setTimeout(async () => {
            try {
                const codigo = await client.requestPairingCode(numeroDoRobo);
                console.log('\n🚀 SEU CÓDIGO DO WHATSAPP É:', codigo, '🚀\n');
            } catch (error) {
                console.log('\n❌ O WhatsApp bloqueou o código de números desta vez.');
                console.log('👉 Não se preocupe! Use o link do QR Code (OPÇÃO 1) que está logo acima!\n');
            }
        }, 10000);
    }
});

client.on('authenticated', () => {
    console.log('\n✅ Autenticação aceita pelo WhatsApp! Carregando sistema...');
});

client.on('ready', () => {
    console.log('\n🎉 SUCESSO DEFINITIVO! O robô está conectado e pronto para uso!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'oi') {
        message.reply('Olá! Estou rodando na minha versão definitiva!');
    }
});

client.initialize().catch(err => {
    console.error('❌ Erro interno:', err);
});

app.get('/', (req, res) => {
  res.send('O robô está online (Versão Definitiva)!');
});

app.listen(port, () => {
  console.log(`🌐 Servidor rodando na porta ${port}`);
});
