import { Request, Response } from "express";
import config from "../../config";
import { WHATSAPP } from "../../utils/consts";
import logger from "../../utils/logger";
import { messageQueue } from "../../queues/message.queue";
import { Queues } from "../../utils/enums";
import botService from "../../services/bot.service";

export const verifyController = (req: Request, res: Response) => {
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

export const messageController = async (req: Request, res: Response) => {
  logger.info(
    `[WebhookController] Received webhook message: ${JSON.stringify(req.body)}`,
  );

  res.sendStatus(200);

  try {
    const message = (req as any).message;

    if (!message) return;

    const { messageDetails } = message;
    const { whatsappPhone, phoneNumberId } = messageDetails;
    logger.info(
      `[WebhookController] Detalles del mensaje: ${JSON.stringify(messageDetails)}`,
    );

    await botService.handleBufferingMessage(messageDetails);

    await messageQueue.add(
      Queues.MESSAGES,
      {
        whatsappPhone,
        phoneNumberId,
      },
      { delay: 4000, jobId: `burst-${whatsappPhone}` },
    );
  } catch (error) {
    logger.error(`[BotController] Error en el mensaje: ${error}`);
  }
};

export const messageTestController = async (req: Request, res: Response) => {
  logger.info(
    `[WebhookController] Received webhook test message: ${JSON.stringify(req.body)}`,
  );
  res.sendStatus(200);

  try {
    const message = (req as any).message;

    if (!message) return;

    const { messageDetails } = message;
    const { whatsappPhone, phoneNumberId } = messageDetails;
    logger.info(
      `[WebhookController] Detalles del mensaje: ${JSON.stringify(messageDetails)}`,
    );

    await botService.handleBufferingMessage(messageDetails);

    await messageQueue.add(
      Queues.MESSAGES,
      {
        whatsappPhone,
        phoneNumberId,
      },
      { delay: 4000, jobId: `debounce-${whatsappPhone}` },
    );
  } catch (error) {
    logger.error(`[BotController] Error en el mensaje: ${error}`);
  }
};
