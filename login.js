const {
  makeWALegacySocket,
  useSingleFileLegacyAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const { state, saveState } = useSingleFileLegacyAuthState('./session.json');

async function start() {
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWALegacySocket({
    auth: state,
    version,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') {
      console.log('Login berhasil!');
    } else if (connection === 'close') {
      console.log('Terputus...');
    }
  });
}

start();