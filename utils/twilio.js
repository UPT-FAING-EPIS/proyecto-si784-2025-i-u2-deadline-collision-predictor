const twilio = require('twilio');

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Sandbox de Twilio

const client = twilio(accountSid, authToken);

async function enviarWhatsApp(to, mensaje) {
  return client.messages.create({
    body: mensaje,
    from: fromNumber,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  });
}

module.exports = { enviarWhatsApp }; 