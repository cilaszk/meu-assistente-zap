const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sessao_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // SEU NÚMERO JÁ CONFIGURADO
    const phoneNumber = "50932074530";

    if (!sock.authState.creds.registered) {
        console.log(`\nSolicitando código para: ${phoneNumber}`);
        await delay(5000); // Espera 5 segundos para o servidor estabilizar
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n=============================================');
            console.log(`🚀 SEU CÓDIGO DO WHATSAPP É: ${code}`);
            console.log('=============================================\n');
        } catch (err) {
            console.error("Erro ao pedir código. Verifique se o número está correto.");
        }
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "close") {
            console.log("Conexão fechada. Reiniciando...");
            iniciarBot();
        } else if (connection === "open") {
            console.log("\n🎉 SUCESSO! Bot conectado e pronto!");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === "notify") {
            const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
            if (texto?.toLowerCase() === "oi") {
                await sock.sendMessage(msg.key.remoteJid, { text: "Olá! Agora estou rodando na versão ultra leve!" });
            }
        }
    });
}

iniciarBot();

app.get('/', (req, res) => res.send('Bot Online!'));
app.listen(port, () => console.log(`Servidor na porta ${port}`));
