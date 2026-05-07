import { Router } from "express";
import {
  webhookMessageController,
  webhookVerifyController,
} from "../controllers/webhook.controller";

const router = Router();

router.get("/webhook", webhookVerifyController);
router.post("/webhook", webhookMessageController);

export default router;
