import { ERROR_MESSAGE } from "../utils/consts";
import { ConversationRole, MessageType } from "../utils/enums";
import {
  MessageResponse,
  WhatsappAnswer,
  WhatsAppMessageDetails,
} from "../utils/interfaces";
import GeminiService from "./gemini.service";
import WhatsappService from "./whatsapp.service";

class BotService {
  private whatsappService: WhatsappService;
  private geminiService: GeminiService;

  // constructor(whatsappService: WhatsappService, geminiService: GeminiService) {

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

      const geminiResponse =
        await this.geminiService.sendMessageToGemini(userMessage);

      const { whatsappAnswer } = geminiResponse;

      return await this.HandleMessage(from, phoneNumberId, whatsappAnswer);
    } catch (error) {
      const whatsappAnswer: WhatsappAnswer = {
        messageType: MessageType.ERROR,
        principalText: ERROR_MESSAGE,
        options: {},
      };

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

    switch (messageType) {
      case MessageType.TEXT:
        return await sendMessage({
          to,
          phoneNumberId,
          message,
        });

      case MessageType.ERROR:
        return await sendMessage({
          to,
          phoneNumberId,
          message: ERROR_MESSAGE,
        });

      default:
        throw new Error(`Unsupported message type: ${messageType}`);
    }
  }
}

export default BotService;
