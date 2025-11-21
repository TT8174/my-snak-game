import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateGameOverMessage = async (score: number): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `I just played Snake and scored ${score} points. Give me a very short, witty, sarcastic, or encouraging single-sentence comment about my performance. If the score is low, roast me gently.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "Game Over!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Game Over! (AI offline)";
  }
};