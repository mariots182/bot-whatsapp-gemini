import botService from "../../services/bot.service";
import logger from "../../utils/logger";

export class BotHandler {
  async process(whatsappPhone: string, phoneNumberId: string) {
    try {
      logger.info(`[BotHandler] Procesando conversación para ${whatsappPhone}`);

      await botService.executeConversation(whatsappPhone, phoneNumberId);

      return { success: true };
    } catch (error) {
      logger.error(`[BotHandler] Error procesando ${whatsappPhone}: ${error}`);
      throw error;
    }
  }
}
