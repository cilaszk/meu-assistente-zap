const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const express = require("express");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 10000;

let sock;
let botIniciado = false;

// 🔹 SEU NÚMERO JÁ DEFINIDO
const PHONE_NUMBER = "50932074520";
const MENU_LINK = "site disponivel em nosso perfil";

// ===== UTIL =====
const delay = (ms) => new Promise(res => setTimeout(res, ms));

const getTexto = (msg) => {
    return msg.message?.conversation ||
           msg.message?.extendedTextMessage?.text ||
           msg.message?.imageMessage?.caption ||
           "";
};

// ===== BANCO SIMPLES =====
const DB_FILE = "./data/clientes.json";

function carregarDB() {
    if (!fs.existsSync(DB_FILE)) return {};
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function salvarDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getUser(numero) {
    const db = carregarDB();
    return db[numero];
}

function setUser(numero, data) {
    const db = carregarDB();
    db[numero] = { ...(db[numero] || {}), ...data };
    salvarDB(db);
}

// ===== BOT =====
async function iniciarBot() {
    if (botIniciado) return;
    botIniciado = true;

    const { state, saveCreds } = await useMultiFileAuthState('sessao');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Chrome (Linux)", "Chrome", "120.0.0"],
        connectTimeoutMs: 60000
    });

    // 🔐 GERA CÓDIGO AUTOMATICAMENTE
    if (!sock.authState.creds.registered) {
        console.log("🔐 Gerando código para:", PHONE_NUMBER);

        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);

                console.log("\n==============================");
                console.log("👉 CÓDIGO DO WHATSAPP:");
                console.log(code);
                console.log("==============================\n");

                console.log("📱 Vá no WhatsApp > Dispositivos conectados > Inserir código");

            } catch (err) {
                console.log("⏳ Aguardando liberação do WhatsApp...");
            }
        }, 8000);
    }

    sock.ev.on("creds.update", saveCreds);

    // 🔌 CONEXÃO
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ BOT CONECTADO!");
        }

        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== 401;

            botIniciado = false;

            if (shouldReconnect) {
                console.log("🔁 Reconectando...");
                iniciarBot();
            } else {
                console.log("❌ Sessão inválida. Gere novo código.");
            }
        }
    });

    // 💬 MENSAGENS
    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const numero = msg.key.remoteJid;
            const texto = getTexto(msg).toLowerCase();

            let user = getUser(numero);

            if (!user) {
                setUser(numero, { etapa: "inicio" });
                user = { etapa: "inicio" };
            }

            console.log(`📩 ${numero}: ${texto}`);

            switch (user.etapa) {
                case "inicio":
                    await delay(1000);
                    await sock.sendMessage(numero, {
                        text: "👋 Olá! Digite *menu* para ver opções."
                    });
                    setUser(numero, { etapa: "menu" });
                    break;

                case "menu":
                    if (texto.includes("menu")) {
                        await delay(1000);
                        await sock.sendMessage(numero, {
                            text: `📋 Acesse:\n👉 ${MENU_LINK}`
                        });
                    }
                    break;
            }

        } catch (err) {
            console.log("Erro:", err);
        }
    });
}

// ===== SERVER =====
app.get('/', (req, res) => res.send('🤖 Bot Online'));
app.listen(port, () => console.log("🌐 Servidor ativo"));

iniciarBot();
