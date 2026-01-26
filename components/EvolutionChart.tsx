import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../types';

interface EvolutionChartProps {
  title: string;
  subtitle: string;
  totalValue: number;
  totalCount: number;
  data: ChartDataPoint[];
  color: string;
  icon: React.ReactNode;
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ 
  title, subtitle, totalValue, totalCount, data, color, icon 
}) => {
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Generate a unique ID for the gradient definition
  const gradientId = `gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="card evolution-card">
      <div className="evolution-header">
        <div className="evolution-info">
          <div className="icon-box">
            {icon}
          </div>
          <div>
            <h3 className="evolution-title">{title}</h3>
            <p className="evolution-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="evolution-totals">
            <p className="evolution-totals-label">
                {title.includes('CANCEL') ? 'TOTAL CANCELADO' : 'TOTAL RECUPERADO'}
            </p>
            <p className={`evolution-totals-value ${color === '#ff3366' ? 'status-danger' : 'status-success'}`}>
                {formatCurrency(totalValue)}
            </p>
            <p className="evolution-totals-count">{totalCount} CONTRATOS</p>
        </div>
      </div>

      <div className="evolution-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
            <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#666', fontSize: 11, fontWeight: 500}} 
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#666', fontSize: 11}}
                tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
            />
            <Tooltip 
                contentStyle={{backgroundColor: '#181b21', border: '1px solid #333', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'}}
                itemStyle={{color: '#fff', fontWeight: 600}}
                cursor={{stroke: '#444', strokeWidth: 1, strokeDasharray: '4 4'}}
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                labelStyle={{color: '#9ca3af', marginBottom: '0.5rem', fontSize: '12px'}}
            />
            <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#${gradientId})`} 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvolutionChart;