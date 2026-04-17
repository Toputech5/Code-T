const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');

const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require('pino');

const {
    default: France_King,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

function removeFile(path) {
    if (!fs.existsSync(path)) return false;
    fs.rmSync(path, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function FLASH_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {
            let sock = France_King({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(
                        state.keys,
                        pino({ level: "fatal" }).child({ level: "fatal" })
                    ),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.ubuntu('Chrome')
            });

            // Pair code request
            if (!sock.authState.creds.registered) {
                await delay(3000);

                num = num.replace(/[^0-9]/g, '');

                const code = await sock.requestPairingCode(num);

                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {

                    await delay(4000);

                    // read session
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    let b64data = Buffer.from(data).toString('base64');

                    let session = await sock.sendMessage(sock.user.id, {
                        text: b64data
                    });

                    // 💎 YOUR NEON MESSAGE
                    let FLASH_MD_TEXT = `╔═⟦ ⚡ 𝐂𝐎𝐃𝐄-𝐓 𝐌𝐃 ⟧═╗
║
║ ✦ 𝐬𝐞𝐬𝐬𝐢𝐨𝐧 𝐫𝐞𝐚𝐝𝐲 📡
║ ✧ 𝐩𝐫𝐢𝐯𝐚𝐭𝐞 𝐮𝐬𝐞 🔐
║
║ ✦ huraaah! 🚀
║ ✧ whatsapp bots unlocked again!! 🚀
║ 𝐜𝐨𝐝𝐞 𝐭 𝐦𝐝 𝐜𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 ✔
║
║ 👨‍💻 dev: 𝐓𝐨𝐩𝐮𝐭𝐞𝐜𝐡
║
╚═⟦ 𝐂𝐎𝐍𝐍𝐄𝐂𝐓 𝐂𝐎𝐃𝐄-𝐓 𝐌𝐃  𝐓𝐎 𝐘𝐎𝐔𝐑 𝐖𝐄𝐁 ⟧═╝`;

                    // 🎥 VIDEO SEND (CATBOX URL)
                    await sock.sendMessage(sock.user.id, {
                        video: { url: "https://files.catbox.moe/e4cps3.mp4" },
                        caption: FLASH_MD_TEXT
                    }, {
                        quoted: session
                    });

                    // close connection after sending
                    setTimeout(() => {
                        sock.ws.close();
                    }, 5000);

                    // cleanup
                    setTimeout(() => {
                        removeFile('./temp/' + id);
                    }, 10000);
                }

                // retry if not success
                else if (
                    connection === "close" &&
                    lastDisconnect?.error?.output?.statusCode !== 401
                ) {
                    await delay(5000);
                    FLASH_MD_PAIR_CODE();
                }
            });

        } catch (err) {
            console.log("service restarted");
            removeFile('./temp/' + id);

            if (!res.headersSent) {
                res.send({ code: "Service is Currently Unavailable" });
            }
        }
    }

    return await FLASH_MD_PAIR_CODE();
});

module.exports = router;
