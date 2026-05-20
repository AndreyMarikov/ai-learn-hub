import { GoogleGenAI } from "@google/genai";

if (!process.env.AI_INTEGRATIONS_GEMINI_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_GEMINI_API_KEY must be set. Add it to .env.local for local development.",
  );
}

const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || undefined;

export const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  ...(baseUrl
    ? {
        httpOptions: {
          apiVersion: "",
          baseUrl,
        },
      }
    : {}),
});
