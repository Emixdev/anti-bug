const {
  default: makeWASocket,
  useSingleFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const fs = require('fs');

const { state, saveState } = useSingleFileAuthState('./session.json');

function isVirtex(text) {
  return (
    text.length > 7000 || /(‮|​|⁦|⁩)/.test(text)
  );
}

async function startBot() {
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const msgContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    if (isVirtex(msgContent)) {
      console.log(`Virtex terdeteksi dari ${from}, menghapus...`);
      await sock.sendMessage(from, { text: 'Pesan berbahaya terdeteksi dan telah dihapus otomatis.' });
      await sock.sendMessage(from, { delete: msg.key });
    }

    if (msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.documentMessage) {
      const mediaSize = msg.message?.imageMessage?.fileLength || msg.message?.videoMessage?.fileLength || msg.message?.documentMessage?.fileLength;
      if (mediaSize > 5000000) {
        console.log(`Media mencurigakan dari ${from}, menghapus...`);
        await sock.sendMessage(from, { text: 'Media terlalu besar dan dianggap mencurigakan. Dihapus otomatis.' });
        await sock.sendMessage(from, { delete: msg.key });
      }
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Koneksi terputus. Reconnect:', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('Bot sudah online dan siap melindungi WA kamu!');
    }
  });
}

startBot();