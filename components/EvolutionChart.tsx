import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

  return (
    <div className="bg-adv-card rounded-xl p-6 w-full shadow-lg border border-gray-800">
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4">
          <div className="p-3 bg-gray-800 rounded-lg h-fit">
            {icon}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg italic uppercase">{title}</h3>
            <p className="text-gray-400 text-sm">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
            <p className="text-gray-400 text-xs uppercase font-semibold">{title.includes('CANCEL') ? 'TOTAL CANCELADO' : 'TOTAL RECUPERADO'}</p>
            <p className={`text-xl font-bold ${color === '#ff3366' ? 'text-adv-red' : 'text-adv-green'}`}>
                {formatCurrency(totalValue)}
            </p>
            <p className="text-gray-500 text-xs">{totalCount} CONTRATOS</p>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#666', fontSize: 10}} 
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#666', fontSize: 10}}
                tickFormatter={(value) => `R$ ${value >= 1000 ? value/1000 + 'k' : value}`}
            />
            <Tooltip 
                contentStyle={{backgroundColor: '#1f1f1f', border: 'none', borderRadius: '8px'}}
                itemStyle={{color: '#fff'}}
                cursor={{fill: 'transparent'}}
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvolutionChart;