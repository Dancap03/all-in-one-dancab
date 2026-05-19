// Modelo de datos estricto para el análisis financiero
export interface AiAssetAnalysis {
  name: string;
  ticker: string;
  currentPrice: number;
  currency: string;
  assetClass: string;
  region: string;
  country: string;
  sector: string;
  dividendYield: string;
  nextDividendDate: string;
}

export interface AiPortfolioRisk {
  riskLevel: 'Bajo' | 'Moderado' | 'Alto';
  diversificationScore: number;
  recommendations: string[];
  macroOutlook: string;
}
