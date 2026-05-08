import config from "../config";
import { WHATSAPP } from "../utils/consts";
import { WhatsAppMessage } from "../utils/interfaces";

const { MESSAGING_PRODUCT } = WHATSAPP;
const whatsappURL = `${config.whatsapp.apiUrl}${config.whatsapp.apiVersion}`;
const whatsappHeaders = {
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
};

export const sendMessage = async (whatsappMessage: WhatsAppMessage) => {
  const { to, phoneNumberId, message } = whatsappMessage;
  const sendTo = to.slice(0, 2) + to.slice(3);

  const response = await fetch(`${whatsappURL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: whatsappHeaders,
    body: JSON.stringify({
      messaging_product: MESSAGING_PRODUCT,
      to: sendTo,
      type: "text",
      text: { body: message },
    }),
  }).catch((error) => {
    console.error(
      `[whatsapp][sendMessage] Error al enviar el mensaje: ${error}`,
    );
    throw error;
  });

  if (!response.ok) {
    const error = await response.text();

    console.error(
      `[WhatsappService][sendMessage] Error al enviar el mensaje: ${response.status} - ${error}`,
    );

    throw error;
  }
};
