import { Sparkles, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAiFinance } from '../../../../../hooks/useAiFinance'; // Nuestro Controlador

interface AllInOneIATabProps {
  currentPositions: any[]; // Recibimos las posiciones desde Inversion.tsx
}

export const AllInOneIATab = ({ currentPositions }: AllInOneIATabProps) => {
  // Instanciamos el controlador
  const { isAnalyzing, portfolioRisk, error, analyzeMyPortfolio } = useAiFinance();

  return (
    <div className="bg-[#151515] border border-[#10b981]/30 rounded-xl p-8 shadow-sm relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981] opacity-5 blur-[100px] pointer-events-none"></div>

      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h3 className="text-white font-bold text-xl flex items-center gap-2">
            <Sparkles className="text-[#10b981]" size={24} /> 
            Agente Financiero IA
          </h3>
          <p className="text-gray-400 text-sm mt-1">Análisis algorítmico y rebalanceo de tu cartera.</p>
        </div>
        <button 
          onClick={() => analyzeMyPortfolio(currentPositions)}
          disabled={isAnalyzing || currentPositions.length === 0}
          className="bg-gradient-to-r from-[#10b981] to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          {isAnalyzing ? (
            <><div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin"></div> Procesando...</>
          ) : (
            'Analizar Cartera'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm flex items-center gap-2 mb-6">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {!portfolioRisk && !isAnalyzing && !error && (
        <div className="text-center py-12 border border-dashed border-[#2d2d2d] rounded-xl text-gray-500 italic">
          Haz clic en "Analizar Cartera" para generar un diagnóstico de tu nivel de riesgo y diversificación.
        </div>
      )}

      {portfolioRisk && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Card: Nivel de Riesgo */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><ShieldCheck size={20} /></div>
              <h4 className="font-bold text-gray-200">Perfil de Riesgo Detectado</h4>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{portfolioRisk.riskLevel}</p>
            <p className="text-xs text-gray-500">Score de diversificación: {portfolioRisk.diversificationScore}/100</p>
            <div className="w-full bg-[#2d2d2d] h-2 mt-4 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: `${portfolioRisk.diversificationScore}%` }}></div>
            </div>
          </div>

          {/* Card: Macro */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><TrendingUp size={20} /></div>
              <h4 className="font-bold text-gray-200">Perspectiva Macro</h4>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {portfolioRisk.macroOutlook}
            </p>
          </div>

          {/* Card: Recomendaciones */}
          <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl p-5 md:col-span-2">
            <h4 className="font-bold text-gray-200 mb-4">Recomendaciones del Agente</h4>
            <ul className="space-y-3">
              {portfolioRisk.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-300 bg-[#252525] p-3 rounded-lg">
                  <span className="text-[#10b981] mt-0.5">✓</span> {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div> 
  );
};
