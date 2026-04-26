const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");

const app = express();
const port = process.env.PORT || 10000;

async function iniciarBot() {
    // Cria a pasta de sessão automaticamente para não perder a conexão
    const { state, saveCreds } = await useMultiFileAuthState('sessao_permanente');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // Seu número de telefone
    const phoneNumber = "50932074530";

    // Só pede o código se ainda não estiver conectado
    if (!sock.authState.creds.registered) {
        console.log(`\nSincronizando com o número: ${phoneNumber}`);
        
        // Aguarda o servidor respirar antes de gerar o código
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log('\n=============================================');
                console.log(`🚀 SEU CÓDIGO É: ${code}`);
                console.log('=============================================\n');
            } catch (err) {
                console.log("Aguardando sistema liberar o código...");
            }
        }, 10000);
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "open") {
            console.log("\n🎉 CONECTADO COM SUCESSO!");
        } else if (connection === "close") {
            iniciarBot(); // Reinicia se cair
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message) {
            const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (texto?.toLowerCase() === "oi") {
                await sock.sendMessage(msg.key.remoteJid, { text: "Opa! Estou funcionando perfeitamente agora!" });
            }
        }
    });
}

iniciarBot();

app.get('/', (req, res) => res.send('Bot Ativo!'));
app.listen(port, () => console.log(`Monitor porta ${port}`));
