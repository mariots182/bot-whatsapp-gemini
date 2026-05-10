import { Router } from "express";
import webhookRoutes from "./webhook.routes";

const router = Router();

router.use("/api", webhookRoutes);

router.get("/test", (req, res) => {
  res.send("Bot de WhatsApp con Gemini API");
});

export default router;
