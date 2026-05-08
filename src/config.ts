import dotenv from "dotenv";
import { env } from "node:process";

dotenv.config();

export default {
  app: {
    env: env.NODE_ENV,
    port: process.env.PORT,
    corsOrigin:
      env.NODE_ENV === "production"
        ? process.env.CORS_ORIGIN_PROD
        : process.env.CORS_ORIGIN_LOCAL,
  },
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    apiUrl: process.env.WHATSAPP_API_URL,
    apiVersion: process.env.WHATSAPP_API_VERSION,
  },

  google: {
    gemini: {
      apiKey: process.env.GOOGLE_GEMINI_API_KEY,
      model: process.env.GOOGLE_GEMINI_MODEL,
    },
  },
};
