import fs from "fs";

import { Content, GoogleGenAI } from "@google/genai";

import { GeminiResponse } from "../utils/interfaces";

import config from "../config";
import logger from "../utils/logger";

const { apiKey, model } = config.google.gemini;

const ai = new GoogleGenAI({ apiKey });

class GeminiService {
  private systemInstruction: string;

  constructor() {
    const promptPath = config.prompts.path;
    this.systemInstruction = fs.readFileSync(promptPath, "utf-8");
  }

  async sendMessageToGemini(contents: Content[]): Promise<GeminiResponse> {
    try {
      logger.info(
        `[GeminiService][sendMessageToGemini] Enviando mensaje a Gemini con contenido: ${JSON.stringify(
          contents,
        )}`,
      );

      const config = {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        systemInstruction: this.systemInstruction,
      };

      const result = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      logger.info(
        `[GeminiService][sendMessageToGemini] Respuesta de Gemini: ${JSON.stringify(result.candidates?.[0]?.content?.parts?.[0]?.text)}`,
      );

      if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error(
          "[GeminiService][sendMessageToGemini] No se obtuvo respuesta válida de la IA",
        );
      }

      const geminiResponse = JSON.parse(
        result.candidates[0].content.parts[0].text,
      );

      return geminiResponse;
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
