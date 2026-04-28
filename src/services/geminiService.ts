import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function categorizeService(description: string) {
  const categories = [
    "home_repair",
    "cleaning",
    "automotive",
    "tech",
    "education",
    "beauty",
    "creative"
  ];

  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Categorize this service request into one of these: ${categories.join(", ")}. Description: "${description}"`,
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

      const result = JSON.parse(response.text);

      // Ensure the category is one of the allowed ones
      if (!categories.includes(result.category)) {
        result.category = "General";
      }

      return result;
    } catch (error) {
      lastError = error;
      console.warn(`Gemini Categorization Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);

      if (attempt < maxRetries) {
        // Wait a bit before retrying (simple exponential backoff or just a delay)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.error("Gemini Categorization failed after all attempts:", lastError);
  return {
    category: "General",
    refined_title: description.slice(0, 50),
    error: lastError instanceof Error ? lastError.message : "Categorization failed"
  };
}
