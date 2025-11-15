
import { GoogleGenAI } from "@google/genai";

export const getFinancialTip = async (): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      // Return a default tip if API key is not set
      return "Sentiasa berdisiplin dalam membuat bayaran bulanan anda. Ia adalah kunci kejayaan sistem kutu.";
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, encouraging financial tip in Malay for a member of a community savings group ('kutu'). The tip should be about financial discipline or smart use of the payout. Keep it under 150 characters. The tone should be positive and supportive.`
    });
    
    return response.text;
  } catch (error) {
    console.error("Error fetching financial tip:", error);
    return "Gunakan wang kutu anda dengan bijak. Rancang perbelanjaan anda untuk faedah jangka panjang.";
  }
};
