import { Router } from "express";
import { parseMessageMiddleware } from "../middleware/parseMessage.middleware";
import {
  messageController,
  messageTestController,
  verifyController,
} from "../controllers/webhook.controller";

const router = Router();

router.get("/webhook", verifyController);
router.post("/webhook", parseMessageMiddleware, messageController);

router.post("/webhook/test", parseMessageMiddleware, messageTestController);

export default router;
