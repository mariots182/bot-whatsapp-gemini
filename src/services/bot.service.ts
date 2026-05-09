import { ERROR_MESSAGE } from "../utils/consts";
import { ConversationRole, MessageType } from "../utils/enums";
import {
  MessageResponse,
  WhatsappAnswer,
  WhatsAppMessageDetails,
} from "../utils/interfaces";
import logger from "../utils/logger";
import GeminiService from "./gemini.service";
import WhatsappService from "./whatsapp.service";

class BotService {
  private whatsappService: WhatsappService;
  private geminiService: GeminiService;

  constructor() {
    this.whatsappService = new WhatsappService();
    this.geminiService = new GeminiService();
  }

  async processUserMessage(
    whatsappMessageDetails: WhatsAppMessageDetails,
  ): Promise<MessageResponse> {
    const { from, phoneNumberId, text } = whatsappMessageDetails;

    try {
      const userMessage = [
        {
          role: ConversationRole.USER,
          parts: [{ text }],
        },
      ];

      logger.info(
        `[BotService] Enviando mensaje a Gemini: ${JSON.stringify(userMessage)}`,
      );

      const geminiResponse =
        await this.geminiService.sendMessageToGemini(userMessage);

      const { whatsappAnswer } = geminiResponse;

      logger.info(
        `[BotService] Respuesta de Gemini: ${JSON.stringify(whatsappAnswer)}`,
      );

      return await this.HandleMessage(from, phoneNumberId, whatsappAnswer);
    } catch (error) {
      const whatsappAnswer: WhatsappAnswer = {
        messageType: MessageType.ERROR,
        principalText: ERROR_MESSAGE,
        options: {},
      };

      logger.error("[BotService] Enviando mensaje de error:", whatsappAnswer);
      return await this.HandleMessage(from, phoneNumberId, whatsappAnswer);
    }
  }

  async HandleMessage(
    to: string,
    phoneNumberId: string,
    whatsappAnswer: WhatsappAnswer,
  ): Promise<MessageResponse> {
    const { messageType, principalText: message, options } = whatsappAnswer;
    const { sendMessage } = this.whatsappService;
    const interactiveButtonReply = options.button_reply;
    const interactiveListReply = options.interactive_list;
    const file = {
      link: options.file!.link,
      filename: options.file!.filename,
    };

    if (messageType === MessageType.ERROR) {
      logger.error("[BotService] Enviando mensaje de error:", whatsappAnswer);
      whatsappAnswer.principalText = ERROR_MESSAGE;
    }

    const whatsappMessage = {
      to,
      phoneNumberId,
      message,
      interactiveButtonReply,
      interactiveListReply,
      file,
    };

    logger.info(
      `[BotService] Preparando para enviar mensaje. Tipo: ${messageType}, Contenido: ${message}, Opciones: ${JSON.stringify(
        options,
      )}`,
    );

    return await sendMessage(whatsappMessage, messageType);
  }
}

export default BotService;
