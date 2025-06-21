const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { Boom } = require('@hapi/boom');

const admins = require('./adminList');
const signature = `༄༒𓂆𝐂𝐑𝐘𝐗𝐄𝐍²¹⁰⁹𓂆༒༄`;
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function connectBot() {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    // !cryxen
    if (body.startsWith('!cryxen')) {
      await sock.sendMessage(from, { text: `🔰 Présent chef ! ${signature}` }, { quoted: msg });
    }

    // !kick
    if (body.startsWith('!kick') && admins.includes(senderNumber)) {
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentioned) {
        await sock.groupParticipantsUpdate(from, mentioned, 'remove');
        await sock.sendMessage(from, { text: `🚫 Membre expulsé. ${signature}` });
      }
    }

    // !warn
    if (body.startsWith('!warn') && admins.includes(senderNumber)) {
      const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
      if (mentioned) {
        await sock.sendMessage(from, { text: `⚠️ Avertissement envoyé ! ${signature}` });
      }
    }

    // !all
    if (body.startsWith('!all') && admins.includes(senderNumber)) {
      const metadata = await sock.groupMetadata(from);
      const mentions = metadata.participants.map(p => p.id);
      await sock.sendMessage(from, {
        text: `📢 Message à tout le monde ${signature}`,
        mentions
      });
    }

    // !snipe
    if (body.startsWith('!snipe')) {
      await sock.sendMessage(from, { text: `🕵️ Fonction snipe en construction. ${signature}` });
    }

    // Anti-insultes
    const insultes = ['con', 'merde', 'putain'];
    if (insultes.some(insulte => body.toLowerCase().includes(insulte))) {
      await sock.sendMessage(from, { text: `🚫 Merci de rester poli ${signature}` }, { quoted: msg });
    }

    // Stickers
    if (msg.message.stickerMessage) {
      await sock.sendMessage(from, { text: `😄 Beau sticker ! ${signature}` });
    }
  });
}

connectBot();
