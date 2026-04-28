import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function categorizeService(description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize this service request into one of these: Plumbing, Electricity, Cleaning, IT Support, Gardening, Delivery, Teaching, Beauty, Construction. Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            refined_title: { type: Type.STRING, description: "A more professional and concise title for the request" }
          },
          required: ["category", "refined_title"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    return { category: "General", refined_title: description.slice(0, 50) };
  }
}
