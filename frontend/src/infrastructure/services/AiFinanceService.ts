import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../firebase/config';
import { AiAssetAnalysis, AiPortfolioRisk } from '../../domain/models/AiAnalysis';

// Programación Orientada a Objetos: Clase dedicada al Agente Financiero IA
class AiFinanceService {
  private aiClient: any;
  private modelName = 'gemini-1.5-flash';

  constructor() {
    if (GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
  }

  // Método 1: Analizar un activo individual (Conexión a Internet)
  async analyzeAsset(assetName: string): Promise<AiAssetAnalysis> {
    if (!this.aiClient) throw new Error("API Key no configurada");

    const prompt = `Eres un analista financiero. Analiza: "${assetName}". 
    Devuelve precio en EUROS (convierte si es necesario). 
    Devuelve ÚNICAMENTE un JSON con: name, ticker, currentPrice (número), currency ("EUR"), assetClass, region, country, sector, dividendYield, nextDividendDate.`;

    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.1 }
    });

    return this.parseJsonResponse<AiAssetAnalysis>(response.text);
  }

  // Método 2: Analizar riesgo de cartera completa (Escalabilidad futura)
  async analyzePortfolio(positions: any[]): Promise<AiPortfolioRisk> {
    if (!this.aiClient) throw new Error("API Key no configurada");
    
    const prompt = `Analiza esta cartera: ${JSON.stringify(positions)}. 
    Devuelve SOLO un JSON con: riskLevel ("Bajo", "Moderado", "Alto"), diversificationScore (0-100), recommendations (array de strings), macroOutlook (string corto).`;

    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: { temperature: 0.4 }
    });

    return this.parseJsonResponse<AiPortfolioRisk>(response.text);
  }

  // Utilidad privada de la clase para limpiar Markdown de las respuestas
  private parseJsonResponse<T>(text: string = "{}"): T {
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText) as T;
  }
}

// Exportamos una única instancia (Patrón Singleton)
export const aiFinanceService = new AiFinanceService();
