import { Content, GenerateContentConfig, GoogleGenAI } from "@google/genai";

import { GeminiResponse } from "../utils/interfaces";

import config from "../config";
import { HTTP } from "../utils/consts";

const { apiKey, model } = config.google.gemini;

const ai = new GoogleGenAI({ apiKey });

class GeminiService {
  async sendMessageToGemini(message: Content[]): Promise<GeminiResponse> {
    try {
      const config: GenerateContentConfig = {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        systemInstruction: "",
      };
      const contents = message;
      const result = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      if (!result?.text) {
        throw new Error(
          "[geminiClient][sendMessageToGemini] No se obtuvo respuesta válida de la IA",
        );
      }

      const responseText = result.text;

      return JSON.parse(responseText);
    } catch (error) {
      const { STATUS_CODES } = HTTP;
      const { INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, BAD_REQUEST } =
        STATUS_CODES;

      let errorMessage = "Error desconocido";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      const isRetryableError =
        errorMessage.includes(INTERNAL_SERVER_ERROR.toString()) ||
        errorMessage.includes(SERVICE_UNAVAILABLE.toString()) ||
        errorMessage.includes(BAD_REQUEST.toString());

      if (isRetryableError) {
        throw new Error(errorMessage);
      }
      throw new Error(errorMessage);
    }
  }
}

export default GeminiService;
