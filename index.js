const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const express = require("express");

const app = express();
const port = process.env.PORT || 10000;

// Variáveis de controle
let sock;
let botIniciado = false;

// Delay (anti-spam básico)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Função para pegar texto de qualquer tipo de mensagem
const getTexto = (msg) => {
    return msg.message?.conversation ||
           msg.message?.extendedTextMessage?.text ||
           msg.message?.imageMessage?.caption ||
           "";
};

async function iniciarBot() {
    if (botIniciado) return;
    botIniciado = true;

    const { state, saveCreds } = await useMultiFileAuthState('sessao');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Chrome (Linux)", "Chrome", "120.0.0"],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
    });

    const phoneNumber = process.env.PHONE_NUMBER;

    // 🔐 Gerar código de pareamento
    if (!sock.authState.creds.registered) {
        console.log("🔐 Gerando código de pareamento...");

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log("\n==============================");
                console.log("👉 SEU CÓDIGO:", code);
                console.log("==============================\n");
            } catch (err) {
                console.log("⏳ Aguardando liberação do WhatsApp...");
            }
        }, 8000);
    }

    // Salvar sessão
    sock.ev.on("creds.update", saveCreds);

    // 🔌 Conexão
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "connecting") {
            console.log("⏳ Conectando...");
        }

        if (connection === "open") {
            console.log("✅ Bot conectado com sucesso!");
        }

        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== 401;

            console.log("❌ Conexão fechada.");

            botIniciado = false;

            if (shouldReconnect) {
                console.log("🔁 Reconectando...");
                iniciarBot();
            } else {
                console.log("🚫 Sessão inválida. Gere um novo código.");
            }
        }
    });

    // 💬 Mensagens
    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const msg = messages[0];

            if (!msg.message || msg.key.fromMe) return;

            const texto = getTexto(msg).toLowerCase();
            const numero = msg.key.remoteJid;

            console.log(`📩 Mensagem de ${numero}: ${texto}`);

            // 🔹 Respostas básicas (você pode expandir)
            if (texto === "oi" || texto === "ola") {
                await delay(1000);
                await sock.sendMessage(numero, {
                    text: "👋 Olá! Estou online.\nDigite *menu* para ver as opções."
                });
            }

            else if (texto === "menu") {
                await delay(1000);
                await sock.sendMessage(numero, {
                    text: "📋 Aqui está o cardápio:\n👉 site disponivel em nosso perfil"
                });
            }

        } catch (err) {
            console.log("Erro ao processar mensagem:", err);
        }
    });
}

// 🌐 Servidor (Render precisa disso)
app.get('/', (req, res) => res.send('🤖 Bot Online'));
app.listen(port, () => console.log(`🌐 Servidor rodando na porta ${port}`));

// 🚀 Iniciar bot
iniciarBot();
