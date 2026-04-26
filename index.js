const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion, disconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");

const app = express();
const port = process.env.PORT || 10000;

// Variável para impedir o flood de códigos
let jaSolicitouCodigo = false;

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sessao_final');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "error" }), // Deixa o log limpo
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    const phoneNumber = "50932074530";

    // Solicita o código apenas SE não estiver conectado e SE ainda não pediu nesta rodada
    if (!sock.authState.creds.registered && !jaSolicitouCodigo) {
        jaSolicitouCodigo = true;
        console.log(`\n[SISTEMA] Iniciando pedido de código para: ${phoneNumber}`);
        
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log('\n=============================================');
                console.log(`🚀 SEU CÓDIGO É: ${code}`);
                console.log('=============================================\n');
                console.log('👉 Digite este código AGORA no seu celular.');
            } catch (err) {
                console.log("[ERRO] WhatsApp recusou o pedido. Reiniciando em 30s...");
                jaSolicitouCodigo = false;
            }
        }, 15000); // Espera 15 segundos para o servidor estabilizar
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "open") {
            console.log("\n✅ CONECTADO! O robô está ativo.");
            jaSolicitouCodigo = false;
        } 
        
        if (connection === "close") {
            const deveriaReiniciar = lastDisconnect?.error?.output?.statusCode !== disconnectReason.loggedOut;
            if (deveriaReiniciar) {
                console.log("[AVISO] Conexão caiu, tentando reconectar...");
                iniciarBot();
            }
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message) {
            const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if (texto?.toLowerCase() === "oi") {
                await sock.sendMessage(msg.key.remoteJid, { text: "Estou funcionando!" });
            }
        }
    });
}

iniciarBot();

app.get('/', (req, res) => res.send('Robô Ativo e Estável!'));
app.listen(port, () => console.log(`Monitorando porta ${port}`));
