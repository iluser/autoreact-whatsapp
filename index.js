const sessionName = "sesi";
// const owner = ["628XXX"]; // Place using your phone number with coutry code

const {
    default: ChatbotConnect,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const chalk = require("chalk");
const figlet = require("figlet");

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

const emoticons = ['😺', '🔥', '❤️‍🔥', '❤️‍🩹', '💛', '🙀', '🫠', '👀', '💕', '💖', '💘', '💞', '💓', '💗'];

async function Bot_Starting() {
    const { state, saveCreds } = await useMultiFileAuthState(`./${sessionName ? sessionName : "session"}`);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
    console.log(
        color(
        figlet.textSync("AutoReact WhatsApp", {
            font: "Standard",
            horizontalLayout: "default",
            vertivalLayout: "default",
            whitespaceBreak: false,
        }),
        "green"
        )
    );

    const client = ChatbotConnect({
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: ["Dev by ILWAN", "Safari", "5.1.7"],
        auth: state,
        generateHighQualityLinkPreview: true,
        patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(
            message.buttonsMessage
            || message.templateMessage
            || message.listMessage
        );
        if (requiresPatch) {
            message = {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadataVersion: 2,
                            deviceListMetadata: {},
                        },
                        ...message,
                    },
                },
            };
        }
        return message;
        },
    });

    store.bind(client.ev);

    client.ev.on("messages.upsert", async (chatUpdate) => {
        try {
        mek = chatUpdate.messages[0];
        if (!mek.message) return;
        mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
        if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            // await new Promise(resolve => setTimeout(resolve, 3000));
            await client.readMessages([mek.key]);
            try {
            const randomEmoticon = emoticons[Math.floor(Math.random() * emoticons.length)];
            if (mek.key.remoteJid === 'status@broadcast') {
                await client.sendMessage(mek.key.remoteJid,
                { react: { key: mek.key, text: randomEmoticon } },
                { statusJidList: [mek.key.participant, client.user.id] });
            }
            } catch (error) {
            return;
            }
        }
        if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;
        if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;        
        } catch (err) {
        console.log(err);
        }
    });

    // Handle error
    const unhandledRejections = new Map();
    process.on("unhandledRejection", (reason, promise) => {
        unhandledRejections.set(promise, reason);
        console.log("Unhandled Rejection at:", promise, "reason:", reason);
    });
    process.on("rejectionHandled", (promise) => {
        unhandledRejections.delete(promise);
    });
    process.on("Something went wrong", function (err) {
        console.log("Caught exception: ", err);
    });   

    client.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.badSession) {
                console.log(`Bad Session File, Please Delete Session and Scan Again`);
                process.exit();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log("Connection closed, reconnecting....");
                Bot_Starting();
            } else if (reason === DisconnectReason.connectionLost) {
                console.log("Connection Lost from Server, reconnecting...");
                Bot_Starting();
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
                process.exit();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(`Device Logged Out, Please Delete Folder Session and Scan Again.`);
                process.exit();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log("Restart Required, Restarting...");
                Bot_Starting();
            } else if (reason === DisconnectReason.timedOut) {
                console.log("Connection TimedOut, Reconnecting...");
                Bot_Starting();
            } else {
                console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
                Bot_Starting();
            }
        } else if (connection === "open") {
            console.log(color("System has been started!", "green"));
            // client.sendMessage(owner + "@s.whatsapp.net", { text: `System has been started` });
        }
        // console.log('Connected...', update)
    });
    client.ev.on("creds.update", saveCreds);
    return client;
}
Bot_Starting();
