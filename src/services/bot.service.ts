import { send } from "node:process";
import { ERROR_MESSAGE } from "../utils/consts";
import { ConversationRole, MessageType } from "../utils/enums";
import {
  InteractiveButtonReply,
  InteractiveCatalog,
  InteractiveListReply,
  MessageResponse,
  WhatsappAnswer,
  WhatsappDocument,
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

      logger.info(
        `[BotService] Texto de la Respuesta de Gemini: ${JSON.stringify(whatsappAnswer.principalText)}`,
      );

      return await this.handleMessage(from, phoneNumberId, whatsappAnswer);
    } catch (error) {
      const whatsappAnswer = {
        messageType: MessageType.ERROR,
        principalText: ERROR_MESSAGE,
        options: {},
      };

      logger.error("[BotService] Enviando mensaje de error:", whatsappAnswer);

      return await this.handleMessage(from, phoneNumberId, whatsappAnswer);
    }
  }

  async handleMessage(
    to: string,
    phoneNumberId: string,
    whatsappAnswer: WhatsappAnswer,
  ): Promise<MessageResponse> {
    const { messageType, principalText: message, options } = whatsappAnswer;

    logger.info(
      `[BotService] Preparando para enviar mensaje. Tipo: ${messageType}, Contenido: ${message}, Opciones: ${JSON.stringify(
        options,
      )}`,
    );

    const interactiveButtonReply = options;
    const interactiveListReply = options;
    const interactiveCatalog = options;
    const file = options;

    logger.info(
      `[BotService] interactiveButtonReply: ${JSON.stringify(
        interactiveButtonReply,
      )} - interactiveListReply: ${JSON.stringify(
        interactiveListReply,
      )} - interactiveCatalog: ${JSON.stringify(
        interactiveCatalog,
      )} - file: ${JSON.stringify(file)}`,
    );

    logger.info(
      `[BotService] interactiveListReply: ${JSON.stringify(
        interactiveListReply,
      )}`,
    );

    const whatsappMessage = {
      to,
      phoneNumberId,
      message,
      interactiveButtonReply: options as InteractiveButtonReply,
      interactiveListReply: options as InteractiveListReply,
      interactiveCatalog: options as InteractiveCatalog,
      file: options as WhatsappDocument,
    };

    logger.info(
      `[BotService] Preparando para enviar mensaje. Tipo: ${messageType}, Contenido: ${message}, Opciones: ${JSON.stringify(
        options,
      )}`,
    );

    return await this.whatsappService.sendMessage(whatsappMessage, messageType);
  }
}

export default BotService;
