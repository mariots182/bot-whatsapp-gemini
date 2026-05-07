import { Request, Response } from "express";
import config from "../config";
import { WHATSAPP } from "../utils/consts";

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

export const webhookMessageController = (req: Request, res: Response) => {
  console.log("Received webhook message:", req.body);
  res.sendStatus(200);
};
