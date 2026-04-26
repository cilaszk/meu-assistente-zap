const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 3000; 

// 🚨 MUDE AQUI: Coloque o número do WhatsApp do seu robô entre as aspas!
// Formato: DDI (55 para Brasil) + DDD + Número. Tudo junto, sem espaços.
// Exemplo: '5511988887777'
const numeroDoRobo = '50932074530'; 

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    console.log('\n--- GERANDO CÓDIGO DE EMPARELHAMENTO ---');
    try {
        const codigo = await client.requestPairingCode(numeroDoRobo);
        console.log('\n=============================================');
        console.log(`🚀 SEU CÓDIGO DO WHATSAPP É: ${codigo}`);
        console.log('=============================================\n');
        console.log('1. Abra o WhatsApp no celular do robô');
        console.log('2. Vá em Aparelhos Conectados > Conectar um aparelho');
        console.log('3. Toque em "Conectar com número de telefone em vez disso" (na parte de baixo da tela)');
        console.log('4. Digite o código acima!');
    } catch (error) {
        console.error('Erro ao gerar o código:', error);
    }
});

client.on('ready', () => {
    console.log('\n🎉 Seu assistente está conectado e pronto para uso!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'oi') {
        message.reply('Olá! Estou rodando perfeitamente! Conectado via código de emparelhamento. Como posso ajudar?');
    }
});

client.initialize();

app.get('/', (req, res) => {
  res.send('O robô está online e funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
