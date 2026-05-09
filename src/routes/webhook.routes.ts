import { Router } from "express";
import {
  webhookMessageController,
  webhookMessageTestController,
  webhookVerifyController,
} from "../controllers/webhook.controller";
import { parseMessageMiddleware } from "../middleware/parseMessage.middleware";
import { handleMessageMiddleware } from "../middleware/handleMessage.middleware";

const router = Router();

router.get("/webhook", webhookVerifyController);
router.post(
  "/webhook",
  handleMessageMiddleware,
  parseMessageMiddleware,
  webhookMessageController,
);

router.post(
  "/webhook/test",
  handleMessageMiddleware,
  parseMessageMiddleware,
  webhookMessageTestController,
);

export default router;
