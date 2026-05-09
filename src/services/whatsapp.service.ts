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

  handleBodyMessage = (
    whatsappMessage: WhatsAppMessage,
    messageType: MessageType,
  ) => {
    try {
      const { to, message, interactiveButtonReply, file } = whatsappMessage;
      const sendTo = to.slice(0, 2) + to.slice(3);

      let body;

      switch (messageType) {
        case MessageType.TEXT:
          body = JSON.stringify({
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "text",
            text: { body: message },
          });

          break;

        case MessageType.REQUEST_LOCATION:
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

        case MessageType.BUTTONS_REPLY:
          if (!interactiveButtonReply || !interactiveButtonReply) {
            logger.error(
              `[whatsapp][sendInteractiveReplyButtonMessage] Información del botón interactivo no válida: ${JSON.stringify(
                interactiveButtonReply,
              )}`,
            );
            return;
          }

          const { headerText, bodyText, footerText, buttons } =
            interactiveButtonReply;

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
              body: {
                text: bodyText,
              },
              footer: {
                text: footerText,
              },
              action: {
                buttons,
              },
            },
          });

        case MessageType.LIST_INTERACTIVE:
          body = JSON.stringify({
            recipient_type: RECIPIENT_TYPE,
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "interactive",
            interactive: {
              type: "list",
              body: {
                text: "string",
              },
              header: {
                type: "text",
                text: "string",
              },
              footer: {
                text: "string",
              },
              action: {
                button: "string",
              },
            },
          });

        case MessageType.CATALOG:
          body = JSON.stringify({
            recipient_type: RECIPIENT_TYPE,
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "template",
            template: {
              name: "company_catalog_items",
              language: {
                code: "MEX",
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: "100",
                    },
                    {
                      type: "text",
                      text: "400",
                    },
                    {
                      type: "text",
                      text: "3",
                    },
                  ],
                },
                {
                  type: "button",
                  sub_type: "CATALOG",
                  index: 0,
                  parameters: [
                    {
                      type: "action",
                      action: {
                        thumbnail_product_retailer_id: "2lc20305pt",
                      },
                    },
                  ],
                },
              ],
            },
          });

        case MessageType.FILE:
          body = JSON.stringify({
            recipient_type: RECIPIENT_TYPE,
            messaging_product: MESSAGING_PRODUCT,
            to: sendTo,
            type: "document",
            // document: {
            //   link: "https://restaurantlosarcos.com/files/menus_sucursales/san-jeronimo-espanol.pdf",
            //   filename: "san-jeronimo-espanol.pdf",
            // },
            document: file,
          });

        default:
          logger.warn(
            `[WhatsappService][handleBodyMessage] Tipo de mensaje no manejado: ${messageType}. Enviando como texto simple.`,
          );
      }

      return body;
    } catch (error) {}
  };
}

export default WhatsappService;
