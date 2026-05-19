import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../firebase/config';
import { AiAssetAnalysis, AiPortfolioRisk } from '../../domain/models/AiAnalysis';

class AiFinanceService {
  private aiClient: any;
  private modelName = 'gemini-2.0-flash';
  
  constructor() {
    if (GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
  }

  // NUEVO MÉTODO: Buscador autocompletado para el modal
  async searchAssetList(query: string): Promise<any[]> {
    if (!this.aiClient) throw new Error("API Key no configurada");
    
    const prompt = `Busca el activo financiero: "${query}".
    Devuelve una lista con las 4 mejores coincidencias reales (acciones, ETFs o criptos).
    Devuelve ÚNICAMENTE un array JSON válido con esta estructura exacta:
    [
      {
        "ticker": "INTC",
        "name": "Intel Corporation",
        "price": 30.50,
        "currency": "EUR"
      }
    ]
    OBLIGATORIO: Los precios DEBEN estar convertidos a EUROS (EUR) buscando el tipo de cambio actual si es necesario.`;

    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.1 }
    });

    return this.parseJsonResponse<any[]>(response.text);
  }

  async analyzeAsset(assetName: string): Promise<AiAssetAnalysis> {
    if (!this.aiClient) throw new Error("API Key no configurada");
    const prompt = `Eres un analista financiero. Analiza: "${assetName}". Devuelve precio en EUROS. Devuelve ÚNICAMENTE un JSON con: name, ticker, currentPrice (número), currency ("EUR"), assetClass, region, country, sector, dividendYield, nextDividendDate.`;
    const response = await this.aiClient.models.generateContent({
      model: this.modelName, contents: prompt, config: { tools: [{ googleSearch: {} }], temperature: 0.1 }
    });
    return this.parseJsonResponse<AiAssetAnalysis>(response.text);
  }

  async analyzePortfolio(positions: any[]): Promise<AiPortfolioRisk> {
    if (!this.aiClient) throw new Error("API Key no configurada");
    const prompt = `Analiza esta cartera: ${JSON.stringify(positions)}. Devuelve SOLO un JSON con: riskLevel ("Bajo", "Moderado", "Alto"), diversificationScore (0-100), recommendations (array de strings), macroOutlook (string corto).`;
    const response = await this.aiClient.models.generateContent({
      model: this.modelName, contents: prompt, config: { temperature: 0.4 }
    });
    return this.parseJsonResponse<AiPortfolioRisk>(response.text);
  }

  private parseJsonResponse<T>(text: string = "{}"): T {
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText) as T;
  }
}

export const aiFinanceService = new AiFinanceService();
