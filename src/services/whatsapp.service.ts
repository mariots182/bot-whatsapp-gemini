import config from "../config";
import { HTTP, WHATSAPP } from "../utils/consts";
import { MessageType } from "../utils/enums";
import { WhatsAppMessage } from "../utils/interfaces";
import logger from "../utils/logger";

const { apiUrl, apiVersion, token } = config.whatsapp;

const { MESSAGING_PRODUCT, RECIPIENT_TYPE } = WHATSAPP;
const whatsappURL = `${apiUrl}${apiVersion}`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
const { POST } = HTTP.METHODS;

class WhatsappService {
  async sendMessage(
    whatsappMessage: WhatsAppMessage,
    messageType: MessageType,
  ): Promise<any> {
    const { phoneNumberId, to } = whatsappMessage;

    const body = this.handleBodyMessage(whatsappMessage, messageType);

    logger.info(
      `[WhatsappService][sendMessage] Enviando mensaje a ${to} con body: ${body}`,
    );

    const response = await fetch(`${whatsappURL}/${phoneNumberId}/messages`, {
      method: POST,
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

  private handleBodyMessage(
    whatsappMessage: WhatsAppMessage,
    messageType: MessageType,
  ) {
    try {
      const {
        to,
        message,
        interactiveButtonReply,
        interactiveListReply,
        interactiveCatalog,
        file,
      } = whatsappMessage;
      const sendTo = this.formatPhoneNumberForWhatsapp(to);

      let body;

      switch (messageType) {
        case MessageType.TEXT:
          logger.info(
            `[WhatsappService][handleBodyMessage][TEXT] Preparando mensaje de texto simple. message: ${message}`,
          );
          body = JSON.stringify({
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "text",
            text: { body: message },
          });

          break;

        case MessageType.REQUEST_LOCATION:
          logger.info(
            `[WhatsappService][handleBodyMessage][REQUEST_LOCATION] Preparando mensaje de solicitud de ubicación. message: ${message}`,
          );

          body = JSON.stringify({
            recipient_type: "individual",
            messaging_product: "whatsapp",
            to: sendTo,
            type: "interactive",
            interactive: {
              type: "location_request_message",
              body: {
                text: message,
              },
              action: {
                name: "send_location",
              },
            },
          });

          break;

        case MessageType.BUTTONS_REPLY:
          logger.info(
            `[WhatsappService][handleBodyMessage][BUTTONS_REPLY] Preparando mensaje de botón interactivo. interactiveButtonReply: ${JSON.stringify(
              interactiveButtonReply,
            )}`,
          );

          if (!interactiveButtonReply) {
            logger.error(
              `[WhatsappService][handleBodyMessage][BUTTONS_REPLY] Información del botón interactivo no válida: ${JSON.stringify(
                interactiveButtonReply,
              )}`,
            );
            throw new Error("Información del botón interactivo no válida");
          }

          const { headerText, bodyText, footerText, buttons } =
            interactiveButtonReply;

          logger.info(
            `[WhatsappService][handleBodyMessage][BUTTONS_REPLY] headerText: ${headerText}, bodyText: ${bodyText}, footerText: ${footerText}, buttons: ${JSON.stringify(
              buttons,
            )}`,
          );

          body = JSON.stringify({
            recipient_type: RECIPIENT_TYPE,
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "interactive",
            interactive: {
              type: "button",
              header: {
                type: "text",
                text: headerText,
              },
              body: { text: bodyText },
              footer: { text: footerText },
              action: {
                buttons,
              },
            },
          });

          logger.info(
            `[WhatsappService][handleBodyMessage][BUTTONS_REPLY] Mensaje de botón interactivo preparado: ${body}`,
          );

          break;

        case MessageType.LIST_INTERACTIVE:
          logger.info(
            `[WhatsappService][handleBodyMessage][LIST_INTERACTIVE] Preparando mensaje de lista interactiva. interactiveListReply: ${JSON.stringify(
              interactiveListReply,
            )}`,
          );
          body = JSON.stringify({
            recipient_type: RECIPIENT_TYPE,
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "interactive",
            interactive: interactiveListReply,
          });

          logger.info(
            `[WhatsappService][handleBodyMessage][LIST_INTERACTIVE] Mensaje de lista interactiva preparado: ${body}`,
          );

          break;

        case MessageType.CATALOG:
          logger.info(
            `[WhatsappService][handleBodyMessage][CATALOG] Preparando mensaje de catálogo interactivo. interactiveCatalog: ${JSON.stringify(
              interactiveCatalog,
            )}`,
          );
          body = JSON.stringify({
            recipient_type: RECIPIENT_TYPE,
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "template",
            template: interactiveCatalog,
          });

          logger.info(
            `[WhatsappService][handleBodyMessage][CATALOG] Mensaje de catálogo interactivo preparado: ${body}`,
          );

          break;

        case MessageType.FILE:
          logger.info(
            `[WhatsappService][handleBodyMessage][FILE] Preparando mensaje de archivo. file: ${JSON.stringify(
              file,
            )}`,
          );
          body = JSON.stringify({
            recipient_type: RECIPIENT_TYPE,
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "document",

            document: file,
          });

          logger.info(
            `[WhatsappService][handleBodyMessage][FILE] Mensaje de archivo preparado: ${body}`,
          );

          break;

        default:
          logger.warn(
            `[WhatsappService][handleBodyMessage] Tipo de mensaje no manejado: ${messageType}. Enviando como texto simple.`,
          );
      }

      logger.info(
        `[WhatsappService][handleBodyMessage] Body del mensaje preparado: ${body}`,
      );

      return body;
    } catch (error) {}
  }
  private formatPhoneNumberForWhatsapp(phoneNumber: string): string {
    return phoneNumber.slice(0, 2) + phoneNumber.slice(3);
  }
}

export default WhatsappService;
