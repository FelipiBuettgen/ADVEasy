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
    <div className="card card-hover kpi-card">
      <div className="kpi-header">
        <div className="kpi-label">
          {icon && <span className="kpi-icon">{icon}</span>}
          {kpi.label}
        </div>
      </div>
      
      <div className="kpi-body">
         {kpi.trend !== undefined && (
             <div className={`kpi-trend ${kpi.trend > 0 ? 'status-success' : 'status-danger'}`}>
                <span>{kpi.trend > 0 ? '▲' : '▼'}</span>
                {kpi.trend}%
             </div>
         )}
         <div className="kpi-value">{formatValue(kpi.value)}</div>
         {kpi.subValue && <div className="kpi-subvalue">{kpi.subValue}</div>}
      </div>
    </div>
  );
};

// --- Seller Performance (Horizontal Stacked Bar) ---
export const SellerChart: React.FC<{ data: SellerMetric[], title: string }> = ({ data, title }) => {
  return (
   <div className="card card-hover seller-card">
    <div className="card-header">
      <h3 className="section-title">
        <span className="section-title-bar"></span>
        {title}
      </h3>
      <span className="badge-muted">ESTE MÊS</span>
    </div>
    <div className="chart-body">
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
      <div className="legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: '#5b7afb' }}></div><span>Aberto</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#ff3366' }}></div><span>Perdido</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#00d68f' }}></div><span>Ganho</span></div>
      </div>
    </div>
  );
};

// --- Donut Chart ---
export const DonutWidget: React.FC<{ data: ChartData[], title: string }> = ({ data, title }) => {
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div className="card card-hover donut-card">
       <h3 className="section-title">
            <span className="section-title-bar"></span>
            {title}
       </h3>
       
       <div className="donut-chart">
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
         <div className="donut-center">
             <span className="donut-total">{total}</span>
             <span className="donut-label">Total</span>
         </div>
       </div>
    </div>
  );
};

// --- Funnel Chart ---
export const FunnelWidget: React.FC<{ data: FunnelStep[], title: string }> = ({ data, title }) => {
    return (
      <div className="card card-hover funnel-card">
        <div className="card-header">
            <h3 className="section-title">
                <span className="section-title-bar"></span>
                {title}
            </h3>
        </div>
        
        <div className="funnel-chart">
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
            <div className="funnel-badges">
                {data.map((step, idx) => (
                    idx < data.length - 1 && (
                  <div key={idx} className="funnel-badge">
                    <div className="funnel-badge-label">
                                {step.conversionRate}%
                            </div>
                        </div>
                    )
                ))}
          </div>

          {/* Value Labels on top of bars */}
            <div className="funnel-values">
                {data.map((step, idx) => (
                <div key={idx} className="funnel-value">
                  <span>{step.count}</span>
                    </div>
                ))}
          </div>
        </div>
      </div>
    );
  };