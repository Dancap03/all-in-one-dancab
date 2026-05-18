import * as functions from "firebase-functions/v2";
import { GoogleGenerativeAI } from "@google/genai";

const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeAsset = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const { assetName } = request.data;
  if (!assetName) {
    throw new functions.https.HttpsError("invalid-argument", "Falta el nombre o ticker.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Eres un analista financiero experto. Analiza el siguiente activo financiero: "${assetName}".
      
      REGLA DE ORO DE CONVERSIÓN:
      El usuario opera desde Europa utilizando el broker Trade Republic. Por tanto, TODOS los precios que devuelvas 
      deben estar OBLIGATORIAMENTE en EUROS (EUR). 
      Si el activo es americano (ej. Apple, Intel) y cotiza en USD en el NASDAQ/NYSE, busca su cotización actual en 
      mercados europeos (como Tradegate, Lang & Schwarz o Xetra) en EUROS. Si no encuentras la cotización directa en EUR, 
      busca el precio en USD, busca el tipo de cambio USD a EUR en tiempo real, y haz la conversión matemática antes de responder.
      
      Busca información en tiempo real y devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
      {
        "name": "Nombre completo de la empresa o ETF",
        "ticker": "Ticker oficial de bolsa (ej. AAPL, VUSA.AS)",
        "currentPrice": número con el precio actual ESTRICTAMENTE EN EUROS (usa punto para decimales, haz la conversión obligatoria),
        "currency": "EUR",
        "assetClass": "Acción, ETF, Criptomoneda, o Bono",
        "region": "Norteamérica, Europa, Mercados Emergentes, Global, o Cripto",
        "country": "País principal",
        "sector": "Sector principal",
        "dividendYield": "Porcentaje de dividendo anual o '0%'",
        "nextDividendDate": "Fecha estimada del próximo dividendo o 'N/A'",
        "topHoldings": [{"company": "Apple", "weightPerc": 5.2}] // (Llénalo solo si es un ETF. Si es una acción, devuelve un array vacío [])
      }`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Temperatura baja para que sea muy preciso con las matemáticas y no invente
      }
    });

    const aiText = response.text || "{}";
    const jsonString = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error IA:", error);
    throw new functions.https.HttpsError("internal", "Error al procesar el activo con IA.");
  }
});
