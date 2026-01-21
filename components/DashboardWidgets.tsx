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
    <div className="bg-adv-card p-5 rounded-lg border border-gray-800 h-full flex flex-col justify-between transition-all duration-300 hover:border-adv-gold hover:shadow-lg group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 items-center text-gray-400 text-sm font-bold uppercase tracking-wider group-hover:text-adv-gold transition-colors">
          {icon && <span className="text-adv-gold">{icon}</span>}
          {kpi.label}
        </div>
      </div>
      
      <div className="text-center py-4">
         {kpi.trend !== undefined && (
             <div className={`text-xs font-bold mb-2 flex justify-center items-center gap-1 ${kpi.trend > 0 ? 'text-adv-green' : 'text-adv-red'}`}>
                <span>{kpi.trend > 0 ? '▲' : '▼'}</span>
                {kpi.trend}%
             </div>
         )}
         <div className="text-3xl font-black text-white tracking-tight">{formatValue(kpi.value)}</div>
         {kpi.subValue && <div className="text-xs text-gray-500 mt-2 font-medium">{kpi.subValue}</div>}
      </div>
    </div>
  );
};

// --- Seller Performance (Horizontal Stacked Bar) ---
export const SellerChart: React.FC<{ data: SellerMetric[], title: string }> = ({ data, title }) => {
  return (
    <div className="bg-adv-card p-5 rounded-lg border border-gray-800 h-full flex flex-col transition-all duration-300 hover:border-adv-gold">
      <div className="flex justify-between items-center mb-4 shrink-0">
         <h3 className="text-gray-300 font-bold text-xs uppercase flex items-center gap-2">
            <span className="w-1 h-3 bg-adv-gold rounded-full"></span>
            {title}
         </h3>
         <span className="text-[10px] text-gray-500 font-semibold bg-gray-800 px-2 py-0.5 rounded">ESTE MÊS</span>
      </div>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} barSize={16} margin={{ left: 10, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                width={90} 
                tick={{fill: '#9ca3af', fontSize: 11, fontWeight: 600}} 
            />
            <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{backgroundColor: '#181b21', border: '1px solid #333', borderRadius: '4px', fontSize: '12px', color: '#fff'}}
            />
            <Bar dataKey="open" stackId="a" fill="#5b7afb" radius={[2, 0, 0, 2]} name="Aberto" />
            <Bar dataKey="lost" stackId="a" fill="#ff3366" name="Perdido" />
            <Bar dataKey="won" stackId="a" fill="#00d68f" radius={[0, 2, 2, 0]} name="Ganho" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 mt-2 justify-end shrink-0">
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5b7afb]"></div><span className="text-[10px] text-gray-400 font-medium">Aberto</span></div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ff3366]"></div><span className="text-[10px] text-gray-400 font-medium">Perdido</span></div>
         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00d68f]"></div><span className="text-[10px] text-gray-400 font-medium">Ganho</span></div>
      </div>
    </div>
  );
};

// --- Donut Chart ---
export const DonutWidget: React.FC<{ data: ChartData[], title: string }> = ({ data, title }) => {
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="bg-adv-card p-5 rounded-lg border border-gray-800 h-full relative flex flex-col transition-all duration-300 hover:border-adv-gold">
       <h3 className="text-gray-300 font-bold text-xs uppercase flex items-center gap-2 mb-2 shrink-0">
            <span className="w-1 h-3 bg-adv-gold rounded-full"></span>
            {title}
       </h3>
       
       <div className="flex-grow min-h-0 relative">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={data}
               innerRadius={60}
               outerRadius={80}
               paddingAngle={4}
               dataKey="value"
               stroke="none"
               cornerRadius={4}
             >
               {data.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={entry.fill} />
               ))}
             </Pie>
             <Tooltip 
                contentStyle={{backgroundColor: '#181b21', border: '1px solid #333', borderRadius: '4px', fontSize: '12px', color: '#fff'}}
                itemStyle={{color: '#fff'}}
             />
             <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconSize={8}
                wrapperStyle={{fontSize: '11px', fontWeight: 500}}
             />
           </PieChart>
         </ResponsiveContainer>
         
         {/* Center Text */}
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
             <span className="text-2xl font-black text-white tracking-tight block">{total}</span>
             <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total</span>
         </div>
       </div>
    </div>
  );
};

// --- Funnel Chart ---
export const FunnelWidget: React.FC<{ data: FunnelStep[], title: string }> = ({ data, title }) => {
    return (
      <div className="bg-adv-card p-6 rounded-lg border border-gray-800 w-full transition-all duration-300 hover:border-adv-gold">
        <div className="flex justify-between mb-6">
            <h3 className="text-gray-300 font-bold text-xs uppercase flex items-center gap-2">
                <span className="w-1 h-3 bg-adv-gold rounded-full"></span>
                {title}
            </h3>
        </div>
        
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={100}>
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 700}} 
                    dy={10}
                />
                <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{backgroundColor: '#181b21', border: '1px solid #333', borderRadius: '4px', fontSize: '12px', color: '#fff'}}
                    formatter={(value: number) => [value, 'Negócios']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={index === data.length - 1 ? '#00d68f' : '#C5A059'} 
                            fillOpacity={index === data.length - 1 ? 1 : 0.8}
                        />
                    ))}
                </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Conversion Badges Overlay */}
          <div className="absolute top-1/2 left-0 w-full flex justify-between px-[6%] pointer-events-none">
                {data.map((step, idx) => (
                    idx < data.length - 1 && (
                        <div key={idx} className="flex-1 flex justify-end items-center -mr-8 z-10">
                            <div className="bg-[#1f2937] text-white text-[10px] font-bold px-2 py-1 rounded border border-gray-700 shadow-xl">
                                {step.conversionRate}%
                            </div>
                        </div>
                    )
                ))}
          </div>

          {/* Value Labels on top of bars */}
          <div className="absolute top-0 left-0 w-full h-full flex items-end justify-between px-[5%] pointer-events-none pb-10">
                {data.map((step, idx) => (
                    <div key={idx} className="flex-1 text-center mb-[calc(100%-20px)] transform translate-y-[-24px]">
                        <span className="text-white font-black text-sm block drop-shadow-md">{step.count}</span>
                    </div>
                ))}
          </div>
        </div>
      </div>
    );
  };