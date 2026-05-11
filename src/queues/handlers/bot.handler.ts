import botService from "../../services/bot.service";
import logger from "../../utils/logger";

export class BotHandler {
  async process(from: string, phoneNumberId: string) {
    try {
      logger.info(`[BotHandler] Procesando conversación para ${from}`);

      await botService.executeConversation(from, phoneNumberId);

      return { success: true };
    } catch (error) {
      logger.error(`[BotHandler] Error procesando ${from}: ${error}`);
      throw error;
    }
  }
}
