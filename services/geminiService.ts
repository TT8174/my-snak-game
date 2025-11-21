import { GoogleGenAI } from "@google/genai";

export const generateGameOverMessage = async (score: number): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    const prompt = `I just played a classic Snake game and scored ${score} points. Give me a very short, witty, sarcastic, or encouraging single-sentence comment about my performance. If the score is low (under 50), roast me gently. If high (over 200), praise me.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "Game Over!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Game Over!";
  }
};