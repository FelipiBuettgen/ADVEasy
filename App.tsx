import React, { useEffect, useState } from 'react';
import Logo from './components/Logo';
import { 
    KPICard, 
    SellerChart, 
    DonutWidget, 
    FunnelWidget 
} from './components/DashboardWidgets';
import EvolutionChart from './components/EvolutionChart';
import PipelineColumn from './components/PipelineColumn';
import { dataService } from './services/dataService';
import { KPI, ChartData, FunnelStep, SellerMetric, ChartDataPoint, PipelineMetrics } from './types';

const YEARS = [2023, 2024, 2025, 2026];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'legacy'>('dashboard');
  
  // State for Month and Year selection
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(9); // Default to October (index 9)
  
  // Dashboard Data
  const [kpis, setKPIs] = useState<{ totalValue: KPI, count: KPI } | null>(null);
  const [sellerCreated, setSellerCreated] = useState<SellerMetric[]>([]);
  const [sellerClosed, setSellerClosed] = useState<SellerMetric[]>([]);
  const [planData, setPlanData] = useState<ChartData[]>([]);
  const [sourceData, setSourceData] = useState<ChartData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  
  // Legacy Data
  const [evolutionWon, setEvolutionWon] = useState<{ totalValue: number, totalCount: number, data: ChartDataPoint[] } | null>(null);
  const [evolutionLost, setEvolutionLost] = useState<{ totalValue: number, totalCount: number, data: ChartDataPoint[] } | null>(null);
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineMetrics | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Compute the YYYY-MM string for the service
  const currentMonthString = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true); 
      try {
        await dataService.fetchDeals();
        
        // Load New Dashboard Data (Filtered by Selected Month)
        setKPIs(dataService.getKPIs(currentMonthString));
        setSellerCreated(dataService.getSellerCreated(currentMonthString));
        setSellerClosed(dataService.getSellerClosed(currentMonthString));
        setPlanData(dataService.getPlanDistribution(currentMonthString));
        setSourceData(dataService.getSourceDistribution(currentMonthString));
        setFunnelData(dataService.getSalesFunnel(currentMonthString));

        // Load Legacy Data (Filtered by Selected Month)
        setEvolutionWon(dataService.getEvolutionData('won', currentMonthString));
        setEvolutionLost(dataService.getEvolutionData('lost', currentMonthString));
        setPipelineMetrics(dataService.getPipelineMetrics(currentMonthString));

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentMonthString]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-adv-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-adv-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-400 font-light tracking-widest text-sm">CARREGANDO DADOS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-adv-dark text-white font-sans selection:bg-adv-gold selection:text-black">
      {/* Top Navigation / Logo Area */}
      <div className="border-b border-gray-800 bg-[#0f1115]/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-[1920px] mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-8">
                 <Logo />
                 
                 <div className="flex gap-2">
                    {/* Month Selector */}
                    <div className="relative">
                        <select 
                        value={selectedMonthIndex} 
                        onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                        className="bg-[#181b21] border border-gray-700 text-white text-xs font-semibold rounded-md pl-3 pr-8 py-2 focus:outline-none focus:border-adv-gold focus:ring-1 focus:ring-adv-gold appearance-none cursor-pointer uppercase tracking-wider hover:bg-[#22262e] transition-colors"
                        >
                            {MONTHS.map((m, index) => (
                                <option key={index} value={index}>{m}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    {/* Year Selector */}
                    <div className="relative">
                        <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-[#181b21] border border-gray-700 text-white text-xs font-semibold rounded-md pl-3 pr-8 py-2 focus:outline-none focus:border-adv-gold focus:ring-1 focus:ring-adv-gold appearance-none cursor-pointer uppercase tracking-wider hover:bg-[#22262e] transition-colors"
                        >
                            {YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                 </div>
             </div>
             
             {/* Tabs */}
             <div className="flex bg-[#181b21] rounded-lg p-1 border border-gray-800">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                    activeTab === 'dashboard' 
                      ? 'bg-adv-gold text-black shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('legacy')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                    activeTab === 'legacy' 
                      ? 'bg-adv-gold text-black shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Análise Detalhada
                </button>
             </div>
          </div>
      </div>

      <div className="max-w-[1920px] mx-auto p-6 space-y-6">
        
        {/* === TAB 1: NEW DASHBOARD === */}
        {activeTab === 'dashboard' && (
          <>
            {/* Row 1: KPIs & Seller Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:h-[180px]">
              {kpis && (
                  <KPICard 
                      kpi={kpis.totalValue} 
                      icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                  />
              )}
              
              {kpis && (
                  <KPICard 
                      kpi={kpis.count} 
                      icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
                  />
              )}

              {/* Created in Month */}
              <SellerChart data={sellerCreated} title="Criados (Neste Mês)" />
              
              {/* Closed in Month (Effective) */}
              <SellerChart data={sellerClosed} title="Efetivos (Neste Mês)" />
            </div>

            {/* Row 2: Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:h-[260px]">
                <DonutWidget data={planData} title="Distribuição de Planos" />
                <DonutWidget data={sourceData} title="Canais de Origem" />
                 <SellerChart data={sellerCreated} title="Performance por Vendedor" />
            </div>

            {/* Row 3: Funnel */}
            <div className="grid grid-cols-1 gap-6">
                <FunnelWidget data={funnelData} title="Funil de Vendas" />
            </div>
            
            {/* Footer info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                <div className="bg-adv-card p-4 rounded border border-gray-800 flex items-center gap-4">
                    <div className="bg-red-900/20 p-2 rounded text-adv-red">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-gray-400 text-xs uppercase font-bold">Contrato sem produto vinculado</h4>
                        <p className="text-2xl font-bold text-white">0 <span className="text-xs font-normal text-gray-500">Negócios</span></p>
                    </div>
                </div>
            </div>
          </>
        )}

        {/* === TAB 2: LEGACY CHARTS === */}
        {activeTab === 'legacy' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
                {evolutionWon && (
                  <EvolutionChart 
                    title="EVOLUÇÃO - RECUPERADO" 
                    subtitle={`Performance diária: ${MONTHS[selectedMonthIndex]} ${selectedYear}`}
                    totalValue={evolutionWon.totalValue}
                    totalCount={evolutionWon.totalCount}
                    data={evolutionWon.data}
                    color="#00d68f" // Green
                    icon={<svg className="w-5 h-5 text-adv-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                  />
                )}
                
                {evolutionLost && (
                  <EvolutionChart 
                    title="EVOLUÇÃO - CANCELADO" 
                    subtitle={`Performance diária: ${MONTHS[selectedMonthIndex]} ${selectedYear}`}
                    totalValue={evolutionLost.totalValue}
                    totalCount={evolutionLost.totalCount}
                    data={evolutionLost.data}
                    color="#ff3366" // Red
                    icon={<svg className="w-5 h-5 text-adv-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                  />
                )}
             </div>

             <div className="lg:col-span-1 h-full">
                {pipelineMetrics && (
                   <div className="h-full">
                     <PipelineColumn metrics={pipelineMetrics} />
                   </div>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;