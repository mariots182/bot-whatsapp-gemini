import { Request, response, Response } from "express";
import config from "../config";
import { WHATSAPP } from "../utils/consts";
import BotService from "../services/bot.service";
import WhatsappService from "../services/whatsapp.service";
import GeminiService from "../services/gemini.service";

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
      console.log("Webhook verified successfully");

      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
};

export const webhookMessageController = async (req: Request, res: Response) => {
  console.log("Received webhook message:", req.body);
  try {
    const botService = new BotService();

    const message = (req as any).message;

    if (!message) return;

    const { messageDetails } = message;

    await botService.processUserMessage(messageDetails);
  } catch (error) {
    console.error("[BotController] Error en el mensaje:", error);
  }
};

export const webhookMessageTestController = async (
  req: Request,
  res: Response,
) => {
  console.log("Received webhook test message:", req.body);

  try {
    const botService = new BotService();

    const message = (req as any).message;

    if (!message) return;

    const { messageDetails } = message;

    await botService.processUserMessage(messageDetails);
  } catch (error) {
    console.error("[BotController] Error en el mensaje:", error);
  }
};
