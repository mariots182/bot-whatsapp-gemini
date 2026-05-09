import { Content, GenerateContentConfig, GoogleGenAI } from "@google/genai";

import { GeminiResponse } from "../utils/interfaces";

import config from "../config";
import logger from "../utils/logger";

const { apiKey, model } = config.google.gemini;

const ai = new GoogleGenAI({ apiKey });

class GeminiService {
  async sendMessageToGemini(message: Content[]): Promise<GeminiResponse> {
    try {
      const config: GenerateContentConfig = {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        systemInstruction: "",
      };
      const contents = message;
      const result = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      logger.info(
        `[GeminiService] Respuesta de Gemini: ${JSON.stringify(result)}`,
      );

      if (!result?.text) {
        throw new Error(
          "[geminiClient][sendMessageToGemini] No se obtuvo respuesta válida de la IA",
        );
      }

      const responseText = result.text;

      return JSON.parse(responseText);
    } catch (error) {
      let errorMessage = "Error desconocido";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      throw new Error(errorMessage);
    }
  }
}

export default GeminiService;
