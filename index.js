const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");

const app = express();
const port = process.env.PORT || 10000;

async function iniciarBot() {
    // NOME NOVO PARA ZERAR TUDO: 'sessao_limpa_total'
    const { state, saveCreds } = await useMultiFileAuthState('sessao_limpa_total');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "error" }),
        printQRInTerminal: false,
        browser: ["Chrome (Linux)", "Chrome", "110.0.0"], // Browser mais comum para evitar bloqueio
        connectTimeoutMs: 60000, // Dá 1 minuto para o Render não desistir
        defaultQueryTimeoutMs: 0,
    });

    const phoneNumber = "50932074530";

    if (!sock.authState.creds.registered) {
        console.log("-----------------------------------------");
        console.log("🛠️  PREPARANDO CONEXÃO PARA: " + phoneNumber);
        console.log("-----------------------------------------");

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log("\n✅ SEU CÓDIGO APARECEU!");
                console.log("**************************");
                console.log("👉  " + code + "  👈");
                console.log("**************************\n");
            } catch (err) {
                console.log("Aguarde... o WhatsApp está processando.");
            }
        }, 10000); // Espera 10 segundos antes de pedir o código
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "connecting") {
            console.log("⏳ Iniciando aperto de mão com o WhatsApp...");
        }

        if (connection === "open") {
            console.log("\n🎉 CONECTADO! Agora a rodinha no celular vai parar.");
            console.log("O robô está pronto para receber mensagens.");
        } 
        
        if (connection === "close") {
            console.log("Conexão fechada. Tentando manter a sessão...");
            iniciarBot();
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message) {
            const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (texto?.toLowerCase() === "oi") {
                await sock.sendMessage(msg.key.remoteJid, { text: "Estou online e funcionando!" });
            }
        }
    });
}

iniciarBot();

app.get('/', (req, res) => res.send('Sistema Online'));
app.listen(port, () => console.log('Monitor de atividade ativo.'));
