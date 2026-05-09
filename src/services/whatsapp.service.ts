import config from "../config";
import { HTTP, WHATSAPP } from "../utils/consts";
import { WhatsAppMessage } from "../utils/interfaces";
import logger from "../utils/logger";

const { apiUrl, apiVersion, token } = config.whatsapp;

const { MESSAGING_PRODUCT } = WHATSAPP;
const whatsappURL = `${apiUrl}${apiVersion}`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

class WhatsappService {
  async sendMessage(whatsappMessage: WhatsAppMessage): Promise<any> {
    const { to, phoneNumberId, message } = whatsappMessage;
    const sendTo = to.slice(0, 2) + to.slice(3);

    const body = JSON.stringify({
      messaging_product: MESSAGING_PRODUCT,
      to: sendTo,
      type: "text",
      text: { body: message },
    });

    const response = await fetch(`${whatsappURL}/${phoneNumberId}/messages`, {
      method: HTTP.METHODS.POST,
      headers,
      body,
    }).catch((error) => {
      logger.error(
        `[whatsapp][sendMessage] Error al enviar el mensaje: ${error}`,
      );
      throw error;
    });

    if (!response.ok) {
      const error = await response.text();

      logger.error(
        `[WhatsappService][sendMessage] Error al enviar el mensaje: ${response.status} - ${error}`,
      );

      throw error;
    }

    logger.info(
      `[WhatsappService][sendMessage] Mensaje enviado exitosamente a ${to} con respuesta: ${JSON.stringify(await response.json())}`,
    );

    return response;
  }
}

export default WhatsappService;
