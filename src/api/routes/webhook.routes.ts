import { Router } from "express";
import {
  webhookMessageController,
  webhookMessageTestController,
  webhookVerifyController,
} from "../controllers/webhook.controller";
import { parseMessageMiddleware } from "../middleware/parseMessage.middleware";

const router = Router();

router.get("/webhook", webhookVerifyController);
router.post("/webhook", parseMessageMiddleware, webhookMessageController);

router.post(
  "/webhook/test",
  parseMessageMiddleware,
  webhookMessageTestController,
);

export default router;
