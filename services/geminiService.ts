
import { GoogleGenAI } from "@google/genai";

export const getFinancialTip = async (language: 'en' | 'bm'): Promise<string> => {
  const defaultTips = {
    en: "Always be disciplined in making your monthly payments. It's the key to the success of the 'kutu' system.",
    bm: "Sentiasa berdisiplin dalam membuat bayaran bulanan anda. Ia adalah kunci kejayaan sistem kutu."
  };

  try {
    if (!process.env.API_KEY) {
      return defaultTips[language];
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = language === 'bm'
      ? `Generate a short, encouraging financial tip in Malay for a member of a community savings group ('kutu'). The tip should be about financial discipline or smart use of the payout. Keep it under 150 characters. The tone should be positive and supportive.`
      : `Generate a short, encouraging financial tip in English for a member of a community savings group ('kutu'). The tip should be about financial discipline or smart use of the payout. Keep it under 150 characters. The tone should be positive and supportive.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error fetching financial tip:", error);
    const fallbackTips = {
      en: "Use your 'kutu' money wisely. Plan your expenses for long-term benefits.",
      bm: "Gunakan wang kutu anda dengan bijak. Rancang perbelanjaan anda untuk faedah jangka panjang."
    };
    return fallbackTips[language];
  }
};
