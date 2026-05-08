import dotenv from "dotenv";
import { ENV } from "./utils/consts";
dotenv.config();

const { PRODUCTION } = ENV;

const {
  NODE_ENV,
  PORT,
  CORS_ORIGIN_PROD,
  CORS_ORIGIN_LOCAL,
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_API_URL,
  WHATSAPP_API_VERSION,
  GOOGLE_GEMINI_API_KEY,
  GOOGLE_GEMINI_MODEL,
} = process.env;

export default {
  app: {
    env: NODE_ENV,
    port: PORT,
    corsOrigin: NODE_ENV === PRODUCTION ? CORS_ORIGIN_PROD : CORS_ORIGIN_LOCAL,
  },
  whatsapp: {
    token: WHATSAPP_TOKEN,
    phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
    apiUrl: WHATSAPP_API_URL,
    apiVersion: WHATSAPP_API_VERSION,
  },

  google: {
    gemini: {
      apiKey: GOOGLE_GEMINI_API_KEY,
      model: GOOGLE_GEMINI_MODEL,
    },
  },
};
