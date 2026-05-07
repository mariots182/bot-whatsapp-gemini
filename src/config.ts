import dotenv from "dotenv";

dotenv.config();

export default {
  port: process.env.PORT,

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
