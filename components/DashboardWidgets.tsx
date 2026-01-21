import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { KPI, ChartData, FunnelStep, SellerMetric } from '../types';

// --- KPI Card ---
export const KPICard: React.FC<{ kpi: KPI, icon?: React.ReactNode }> = ({ kpi, icon }) => {
  const formatValue = (val: number | string) => {
    if (kpi.type === 'currency' && typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
    return val;
  };

  return (
    <div className="bg-adv-card p-5 rounded-lg border border-gray-800 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center text-gray-400 text-sm font-semibold uppercase tracking-wider">
          {icon && <span className="text-adv-gold">{icon}</span>}
          {kpi.label}
        </div>
      </div>
      
      <div className="text-center py-4">
         {kpi.trend && (
             <div className={`text-xs font-bold mb-1 ${kpi.trend > 0 ? 'text-adv-green' : 'text-adv-red'}`}>
                ▼ {formatValue(kpi.trend < 0 ? kpi.value : 0)} ({kpi.trend}%)
             </div>
         )}
         <div className="text-3xl font-black text-white">{formatValue(kpi.value)}</div>
         {kpi.subValue && <div className="text-xs text-gray-500 mt-1">{kpi.subValue}</div>}
      </div>
    </div>
  );
};

// --- Seller Performance (Horizontal Stacked Bar) ---
export const SellerChart: React.FC<{ data: SellerMetric[], title: string }> = ({ data, title }) => {
  return (
    <div className="bg-adv-card p-5 rounded-lg border border-gray-800 h-full">
      <div className="flex justify-between items-center mb-4">
         <h3 className="text-gray-300 font-semibold text-sm uppercase flex items-center gap-2">
            <span className="w-1 h-4 bg-adv-gold rounded-full"></span>
            {title}
         </h3>
         <span className="text-xs text-gray-500">Este Mês</span>
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} barSize={24}>
            <XAxis type="number" hide />
            <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                width={80} 
                tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 500}} 
            />
            <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '4px', fontSize: '12px'}}
            />
            <Bar dataKey="open" stackId="a" fill="#5b7afb" radius={[4, 0, 0, 4]} name="Aberto" />
            <Bar dataKey="lost" stackId="a" fill="#ff3366" name="Perdido" />
            <Bar dataKey="won" stackId="a" fill="#00d68f" radius={[0, 4, 4, 0]} name="Ganho" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 mt-2 justify-end">
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#5b7afb]"></div><span className="text-[10px] text-gray-400">Aberto</span></div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ff3366]"></div><span className="text-[10px] text-gray-400">Perdido</span></div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00d68f]"></div><span className="text-[10px] text-gray-400">Ganho</span></div>
      </div>
    </div>
  );
};

// --- Donut Chart ---
export const DonutWidget: React.FC<{ data: ChartData[], title: string }> = ({ data, title }) => {
  return (
    <div className="bg-adv-card p-5 rounded-lg border border-gray-800 h-full relative">
       <h3 className="text-gray-300 font-semibold text-sm uppercase flex items-center gap-2 mb-2">
            <span className="w-1 h-4 bg-adv-gold rounded-full"></span>
            {title}
       </h3>
       
       <div className="h-[200px] w-full flex items-center justify-center">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={data}
               innerRadius={50}
               outerRadius={70}
               paddingAngle={2}
               dataKey="value"
               stroke="none"
             >
               {data.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={entry.fill} />
               ))}
             </Pie>
             <Tooltip 
                contentStyle={{backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '4px', fontSize: '12px'}}
                itemStyle={{color: '#fff'}}
             />
             <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconSize={8}
                formatter={(value) => <span className="text-xs text-gray-400 ml-1">{value}</span>}
             />
           </PieChart>
         </ResponsiveContainer>
         
         {/* Center Text Simulation */}
         <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
             <span className="text-xl font-bold text-white">{data.reduce((a, b) => a + b.value, 0)}</span>
             <span className="text-[10px] text-gray-500 block">Total</span>
         </div>
       </div>
    </div>
  );
};

// --- Funnel Chart ---
export const FunnelWidget: React.FC<{ data: FunnelStep[], title: string }> = ({ data, title }) => {
    return (
      <div className="bg-adv-card p-6 rounded-lg border border-gray-800 w-full">
        <div className="flex justify-between mb-6">
            <h3 className="text-gray-300 font-semibold text-sm uppercase flex items-center gap-2">
                <span className="w-1 h-4 bg-adv-gold rounded-full"></span>
                {title}
            </h3>
            <span className="text-xs text-gray-500 font-mono">TAXA DE GANHO GERAL: 18%</span>
        </div>
        
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={140}>
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}} 
                    dy={10}
                />
                <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '4px', fontSize: '12px'}}
                    formatter={(value: number) => [value, 'Negócios']}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={index === data.length - 1 ? '#00d68f' : '#fbbf24'} 
                        />
                    ))}
                </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Conversion Badges Overlay */}
          <div className="absolute top-1/2 left-0 w-full flex justify-between px-[6%] pointer-events-none">
                {data.map((step, idx) => (
                    idx < data.length - 1 && (
                        <div key={idx} className="flex-1 flex justify-end items-center -mr-6 z-10">
                            <div className="bg-[#2d3748] text-white text-[10px] font-bold px-2 py-1 rounded-md border border-gray-600 shadow-xl">
                                {step.conversionRate}%
                            </div>
                            <div className="h-[1px] w-4 bg-gray-600"></div>
                        </div>
                    )
                ))}
          </div>

          {/* Value Labels on top of bars */}
          <div className="absolute top-0 left-0 w-full h-full flex items-end justify-between px-[5%] pointer-events-none pb-8">
                {data.map((step, idx) => (
                    <div key={idx} className="flex-1 text-center mb-[calc(100%-20px)] transform translate-y-[-20px]">
                        <span className="text-white font-bold text-sm block">{step.count}</span>
                    </div>
                ))}
          </div>
        </div>
      </div>
    );
  };
