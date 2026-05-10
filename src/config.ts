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
  WHATSAPP_API_URL,
  WHATSAPP_API_VERSION,
  GOOGLE_GEMINI_API_KEY,
  GOOGLE_GEMINI_MODEL,
  GOOGLE_GEOLOCATION_API_KEY,
  GOOGLE_GEOLOCATION_API_URL,
  REDIS_URL,
} = process.env;

export default {
  app: {
    env: NODE_ENV,
    port: PORT,
    corsOrigin: NODE_ENV === PRODUCTION ? CORS_ORIGIN_PROD : CORS_ORIGIN_LOCAL,
  },
  whatsapp: {
    token: WHATSAPP_TOKEN,
    apiUrl: WHATSAPP_API_URL,
    apiVersion: WHATSAPP_API_VERSION,
  },

  google: {
    gemini: {
      apiKey: GOOGLE_GEMINI_API_KEY,
      model: GOOGLE_GEMINI_MODEL || "gemini-2.0-flash",
    },
    geolocation: {
      apiKey: GOOGLE_GEOLOCATION_API_KEY,
      geocodingURL: GOOGLE_GEOLOCATION_API_URL,
    },
  },

  redis: {
    url: REDIS_URL,
  },
};
