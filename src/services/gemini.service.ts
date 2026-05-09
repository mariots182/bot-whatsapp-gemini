import fs from "fs";
import path from "path";

import { Content, GoogleGenAI } from "@google/genai";

import { GeminiResponse } from "../utils/interfaces";

import config from "../config";
import logger from "../utils/logger";

const { apiKey, model } = config.google.gemini;

const ai = new GoogleGenAI({ apiKey });

class GeminiService {
  async sendMessageToGemini(contents: Content[]): Promise<GeminiResponse> {
    try {
      const promptPath = path.join(__dirname, "../../PROMPT.md");

      const systemInstruction = fs.readFileSync(promptPath, "utf-8");

      logger.info(
        `[GeminiService] Enviando mensaje a Gemini con contenido: ${JSON.stringify(
          contents,
        )} y systemInstruction: ${systemInstruction}`,
      );

      const config = {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        systemInstruction,
      };

      const result = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      logger.info(
        `[GeminiService] Respuesta de Gemini: ${JSON.stringify(result.candidates?.[0]?.content?.parts?.[0]?.text)}`,
      );

      if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error(
          "[geminiClient][sendMessageToGemini] No se obtuvo respuesta válida de la IA",
        );
      }

      const whatsappAnswer = {
        whatsappAnswer: JSON.parse(result.candidates[0].content.parts[0].text),
      };

      return whatsappAnswer;
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
