import React from 'react';
import { PipelineMetrics } from '../types';

interface PipelineColumnProps {
  metrics: PipelineMetrics;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({ metrics }) => {
  const percentage = Math.min(100, Math.round((metrics.totalValueWon / metrics.goal) * 100));
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Determine bar color based on percentage (visual cue from image)
  const barColor = percentage >= 100 ? 'bg-adv-red' : 'bg-adv-green';
  const textColor = percentage >= 100 ? 'text-adv-red' : 'text-adv-green';

  return (
    <div className="bg-adv-card rounded-xl p-6 border border-gray-800 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-white italic uppercase tracking-wider">{metrics.name}</h3>
        <div className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded-full border border-gray-700">
           <div className="w-2 h-2 rounded-full bg-adv-red shadow-[0_0_5px_#ff3366]"></div>
           <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">META</span>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">REALIZADO VS META</span>
            <span className={`text-sm font-bold ${textColor}`}>{percentage.toFixed(1)}%</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="h-2 w-full bg-gray-800 rounded-full mb-3 overflow-hidden">
            <div 
                className={`h-full rounded-full ${barColor}`} 
                style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
        </div>

        <div className="flex justify-between items-end">
             <span className="text-xl font-bold text-white">{formatCurrency(metrics.totalValueWon)}</span>
             <span className="text-xs text-gray-500">Alvo: {formatCurrency(metrics.goal)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        {/* Solicitacoes (Open) */}
        <div className="bg-[#1f2228] p-3 rounded-lg border border-gray-800 flex justify-between items-center group hover:border-adv-gold transition-colors">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-adv-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-400 uppercase">SOLICITAÇÕES</span>
                </div>
                <span className="text-xs text-gray-600 block pl-6">{metrics.countOpen} Contratos</span>
            </div>
            <span className="text-white font-bold">{formatCurrency(metrics.totalValueOpen)}</span>
        </div>

        {/* Cancelados (Lost) */}
        <div className="bg-[#2a1a1f] p-3 rounded-lg border border-red-900/30 flex justify-between items-center group hover:border-adv-red transition-colors">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-adv-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-bold text-adv-red uppercase">CANCELADOS</span>
                </div>
                <span className="text-xs text-red-900/60 block pl-6">{metrics.countLost} Contratos</span>
            </div>
            <span className="text-white font-bold">{formatCurrency(metrics.totalValueLost)}</span>
        </div>

        {/* Recuperado (Won) - In this context, won deals might be considered recovered or successfully closed */}
        <div className="bg-[#112320] p-3 rounded-lg border border-green-900/30 flex justify-between items-center group hover:border-adv-green transition-colors">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-adv-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs font-bold text-adv-green uppercase">RECUPERADO</span>
                </div>
                <span className="text-xs text-green-900/60 block pl-6">{metrics.countWon} Contratos</span>
            </div>
            <span className="text-white font-bold">{formatCurrency(metrics.totalValueWon)}</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineColumn;