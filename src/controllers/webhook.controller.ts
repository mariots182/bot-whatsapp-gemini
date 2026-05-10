import { Request, response, Response } from "express";
import config from "../config";
import { WHATSAPP } from "../utils/consts";
import BotService from "../services/bot.service";
import logger from "../utils/logger";

export const webhookVerifyController = (req: Request, res: Response) => {
  const TOKEN = config.whatsapp.token;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (!mode || !token) {
    return res.sendStatus(400);
  }

  if (mode && token) {
    if (mode === WHATSAPP.SUBSCRIBE && token === TOKEN) {
      logger.info("Webhook verified successfully");

      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
};

export const webhookMessageController = async (req: Request, res: Response) => {
  logger.info(
    `[WebhookController] Received webhook message: ${JSON.stringify(req.body)}`,
  );

  res.sendStatus(200);

  try {
    const botService = new BotService();

    const message = (req as any).message;

    if (!message) return;

    const { messageDetails } = message;

    logger.info(
      `[WebhookController] Detalles del mensaje: ${JSON.stringify(messageDetails)}`,
    );

    return await botService.processUserMessage(messageDetails);
  } catch (error) {
    logger.error(
      `[BotController] Error en el mensaje: ${JSON.stringify(error)}`,
    );
  }
};

export const webhookMessageTestController = async (
  req: Request,
  res: Response,
) => {
  logger.info(
    `[WebhookController] Received webhook test message: ${JSON.stringify(req.body)}`,
  );

  res.sendStatus(200);

  try {
    const botService = new BotService();

    const message = (req as any).message;

    if (!message) return;

    const { messageDetails } = message;

    return await botService.processUserMessage(messageDetails);
  } catch (error) {
    logger.error(
      `[BotController] Error en el mensaje: ${JSON.stringify(error)}`,
    );
  }
};
