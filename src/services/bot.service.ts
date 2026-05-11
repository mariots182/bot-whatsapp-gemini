import { ERROR_MESSAGE } from "../utils/consts";
import { ConversationRole, MessageType } from "../utils/enums";
import {
  GeminiResponse,
  InteractiveButtonReply,
  InteractiveCatalog,
  InteractiveListReply,
  MessageResponse,
  WhatsappAnswer,
  WhatsappDocument,
  WhatsAppMessageDetails,
} from "../utils/interfaces";
import logger from "../utils/logger";
import redisClient from "../utils/redis";
import GeminiService from "./gemini.service";
import WhatsappService from "./whatsapp.service";

class BotService {
  private whatsappService: WhatsappService;
  private geminiService: GeminiService;

  constructor() {
    this.whatsappService = new WhatsappService();
    this.geminiService = new GeminiService();
  }

  async executeConversation(waId: string, phoneNumberId: string) {
    const bufferKey = `buffer:${waId}`;

    try {
      const fullMessage = await redisClient.get(bufferKey);

      await redisClient.del(bufferKey);

      if (!fullMessage) return;

      logger.info(
        `[BotService][executeConversation] Procesando ráfaga completa: "${fullMessage}"`,
      );

      const conversation = await this.handleConversation(waId, fullMessage);

      const { whatsappAnswer } = conversation;

      await this.handleMessageResponse(waId, phoneNumberId, whatsappAnswer);
    } catch (error) {
      logger.error(
        `[BotService][executeConversation] Error en el flujo principal: ${error}`,
      );

      const errorAnswer = {
        messageType: MessageType.ERROR,
        principalText: ERROR_MESSAGE,
        options: {},
      };
      await this.handleMessageResponse(waId, phoneNumberId, errorAnswer);
    }
  }

  async handleBufferingMessage(
    whatsappMessageDetails: WhatsAppMessageDetails,
  ): Promise<void> {
    try {
      logger.info(
        `[BotService][handleBufferingMessage] Iniciando el buffering de mensaje: ${JSON.stringify(whatsappMessageDetails)}`,
      );

      const { from, text } = whatsappMessageDetails;
      const bufferKey = `buffer:${from}`;

      const currentBuffer = await redisClient.get(bufferKey);

      const newBuffer = currentBuffer ? `${currentBuffer} ${text}` : text;

      logger.info(
        `[BotService][handleBufferingMessage] Nuevo buffer: ${JSON.stringify(newBuffer)}`,
      );

      await redisClient.set(bufferKey, newBuffer, { EX: 60 });
    } catch (error) {
      logger.error(`[BotService][handle] Error en el buffering: ${error}`);
    }
  }

  private async handleMessageResponse(
    to: string,
    phoneNumberId: string,
    whatsappAnswer: WhatsappAnswer,
  ): Promise<MessageResponse> {
    const { messageType, principalText: message, options } = whatsappAnswer;

    logger.info(
      `[BotService][handleMessageResponse] Preparando para enviar mensaje. Tipo: ${messageType}, Contenido: ${message}, Opciones: ${JSON.stringify(
        options,
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

    return await this.whatsappService.sendMessage(whatsappMessage, messageType);
  }

  private async handleConversation(
    waId: string,
    userMessage: string,
  ): Promise<GeminiResponse> {
    const redisKey = `chat:${waId}`;

    const rawHistory = await redisClient.get(redisKey);

    let history = rawHistory ? JSON.parse(rawHistory) : [];

    logger.info(
      `[BotService][handleConversation] Historial parseado para waId: ${waId}: ${JSON.stringify(
        history,
      )}`,
    );

    history.push({
      role: ConversationRole.USER,
      parts: [{ text: userMessage }],
    });

    const response = await this.geminiService.sendMessageToGemini(history);

    history.push({
      role: ConversationRole.MODEL,
      parts: [{ text: JSON.stringify(response) }],
    });

    const trimmedHistory = history.slice(-10);

    await redisClient.set(redisKey, JSON.stringify(trimmedHistory), {
      EX: 86400,
    });

    return response;
  }
}

export { BotService };
// ... lo más importante es exportar una INSTANCIA ÚNICA
const botService = new BotService();
export default botService;
