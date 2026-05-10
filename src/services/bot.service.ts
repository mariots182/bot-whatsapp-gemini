import { Content } from "@google/genai";
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

  async processUserMessage(
    whatsappMessageDetails: WhatsAppMessageDetails,
  ): Promise<MessageResponse> {
    const { from, phoneNumberId, text } = whatsappMessageDetails;

    try {
      const conversation = await this.handleConversation(from, text);

      const { whatsappAnswer } = conversation;

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

  async handleConversation(
    waId: string,
    userMessage: string,
  ): Promise<GeminiResponse> {
    const redisKey = `chat:${waId}`;

    logger.info(
      `[BotService] Obteniendo historial de conversación para waId: ${waId} con clave Redis: ${redisKey}`,
    );

    const rawHistory = await redisClient.get(redisKey);

    logger.info(
      `[BotService] Historial obtenido de Redis para waId: ${waId}: ${rawHistory}`,
    );

    let history = rawHistory ? JSON.parse(rawHistory) : [];

    logger.info(
      `[BotService] Historial parseado para waId: ${waId}: ${JSON.stringify(
        history,
      )}`,
    );

    history.push({
      role: ConversationRole.USER,
      parts: [{ text: userMessage }],
    });

    const geminiService = new GeminiService();

    const response = await geminiService.sendMessageToGemini(history);

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

export default BotService;
