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
  const barStatus = percentage >= 100 ? 'danger' : 'success';
  const textColor = percentage >= 100 ? 'status-danger' : 'status-success';

  return (
    <div className="card pipeline-card">
      <div className="pipeline-header">
      <h3 className="pipeline-title">{metrics.name}</h3>
      <div className="goal-badge">
         <div className="status-dot danger"></div>
         <span>META</span>
      </div>
      </div>

      <div className="pipeline-progress">
      <div className="pipeline-progress-header">
        <span className="pipeline-progress-label">REALIZADO VS META</span>
            <span className={`pipeline-progress-percent ${textColor}`}>{percentage.toFixed(1)}%</span>
      </div>
        
      {/* Progress Bar Container */}
      <div className="progress-track">
        <div 
          className={`progress-bar ${barStatus}`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>

      <div className="pipeline-values">
         <span className="pipeline-total">{formatCurrency(metrics.totalValueWon)}</span>
         <span className="pipeline-goal">Alvo: {formatCurrency(metrics.goal)}</span>
      </div>
      </div>

      <div className="pipeline-list">
        {/* Solicitacoes (Open) */}
      <div className="pipeline-item open">
        <div className="pipeline-item-info">
          <div className="pipeline-item-title">
                    <svg className="icon-sm icon-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>SOLICITAÇÕES</span>
          </div>
          <span className="pipeline-item-sub">{metrics.countOpen} Contratos</span>
        </div>
        <span className="pipeline-item-value">{formatCurrency(metrics.totalValueOpen)}</span>
      </div>

        {/* Cancelados (Lost) */}
        <div className="pipeline-item lost">
          <div className="pipeline-item-info">
            <div className="pipeline-item-title status-danger">
                    <svg className="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>CANCELADOS</span>
            </div>
            <span className="pipeline-item-sub">{metrics.countLost} Contratos</span>
          </div>
          <span className="pipeline-item-value">{formatCurrency(metrics.totalValueLost)}</span>
        </div>

        {/* Recuperado (Won) - In this context, won deals might be considered recovered or successfully closed */}
        <div className="pipeline-item won">
          <div className="pipeline-item-info">
            <div className="pipeline-item-title status-success">
                    <svg className="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>RECUPERADO</span>
            </div>
            <span className="pipeline-item-sub">{metrics.countWon} Contratos</span>
          </div>
          <span className="pipeline-item-value">{formatCurrency(metrics.totalValueWon)}</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineColumn;