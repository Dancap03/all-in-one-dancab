import { useState } from 'react';
import { aiFinanceService } from '../../infrastructure/services/AiFinanceService';
import { AiPortfolioRisk } from '../../domain/models/AiAnalysis';

export const useAiFinance = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [portfolioRisk, setPortfolioRisk] = useState<AiPortfolioRisk | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeMyPortfolio = async (positions: any[]) => {
    if (!positions || positions.length === 0) {
      setError("No hay posiciones para analizar.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      // El controlador delega el trabajo complejo al servicio de infraestructura
      const result = await aiFinanceService.analyzePortfolio(positions);
      setPortfolioRisk(result);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el motor de IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    portfolioRisk,
    error,
    analyzeMyPortfolio
  };
};
