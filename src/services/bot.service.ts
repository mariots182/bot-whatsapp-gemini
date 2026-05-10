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
  private static timers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.whatsappService = new WhatsappService();
    this.geminiService = new GeminiService();
  }

  async processUserMessage(
    whatsappMessageDetails: WhatsAppMessageDetails,
  ): Promise<void> {
    const { from, phoneNumberId, text } = whatsappMessageDetails;

    const bufferKey = `buffer:${from}`;

    try {
      const currentBuffer = await redisClient.get(bufferKey);

      const newBuffer = currentBuffer ? `${currentBuffer} ${text}` : text;

      await redisClient.set(bufferKey, newBuffer, { EX: 60 });

      if (BotService.timers.has(from)) {
        clearTimeout(BotService.timers.get(from)!);

        logger.info(`[BotService] Reiniciando timer para ${from}`);
      }

      const timeout = setTimeout(async () => {
        await this.executeConversation(from, phoneNumberId);
      }, 4000);

      BotService.timers.set(from, timeout);
    } catch (error) {
      logger.error(`[BotService] Error en el buffering: ${error}`);
    }
  }

  private async executeConversation(waId: string, phoneNumberId: string) {
    const bufferKey = `buffer:${waId}`;

    try {
      const fullMessage = await redisClient.get(bufferKey);

      await redisClient.del(bufferKey);

      BotService.timers.delete(waId);

      if (!fullMessage) return;

      logger.info(`[BotService] Procesando ráfaga completa: "${fullMessage}"`);

      const conversation = await this.handleConversation(waId, fullMessage);

      const { whatsappAnswer } = conversation;

      await this.handleMessage(waId, phoneNumberId, whatsappAnswer);
    } catch (error) {
      logger.error(`[BotService] Error en el flujo principal: ${error}`);

      const errorAnswer = {
        messageType: MessageType.ERROR,
        principalText: ERROR_MESSAGE,
        options: {},
      };
      await this.handleMessage(waId, phoneNumberId, errorAnswer);
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

export default BotService;
