import BotService from "../../services/bot.service";
import logger from "../../utils/logger";

export class BotHandler {
  private botService: BotService;

  constructor() {
    this.botService = new BotService();
  }

  async process(from: string, phoneNumberId: string) {
    try {
      logger.info(`[BotHandler] Procesando conversación para ${from}`);

      await this.botService.executeConversation(from, phoneNumberId);

      return { success: true };
    } catch (error) {
      logger.error(`[BotHandler] Error procesando ${from}: ${error}`);
      throw error;
    }
  }
}
