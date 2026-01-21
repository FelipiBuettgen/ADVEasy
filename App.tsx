import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Logo from './components/Logo';
import EvolutionChart from './components/EvolutionChart';
import PipelineColumn from './components/PipelineColumn';
import { dataService } from './services/dataService';
import { PipelineMetrics, ChartDataPoint } from './types';

const App: React.FC = () => {
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineMetrics[]>([]);
  const [lostEvolution, setLostEvolution] = useState<{ data: ChartDataPoint[], totalValue: number, totalCount: number } | null>(null);
  const [wonEvolution, setWonEvolution] = useState<{ data: ChartDataPoint[], totalValue: number, totalCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await dataService.fetchDeals(); // Simulate API call
        
        const metrics = dataService.getPipelineMetrics();
        const lost = dataService.getEvolutionChartData('lost');
        const won = dataService.getEvolutionChartData('won');

        setPipelineMetrics(metrics);
        setLostEvolution(lost);
        setWonEvolution(won);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-adv-dark flex items-center justify-center">
        <div className="text-adv-gold text-xl animate-pulse">Carregando Dashboard ADVeasy...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-adv-dark p-6 md:p-10 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10">
           <Logo />
        </header>

        {/* Top Section: Charts */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
           {lostEvolution && (
             <EvolutionChart 
                title="EVOLUÇÃO DE CANCELAMENTOS"
                subtitle="Valores perdidos dia a dia"
                totalValue={lostEvolution.totalValue}
                totalCount={lostEvolution.totalCount}
                data={lostEvolution.data}
                color="#ff3366"
                icon={
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                }
             />
           )}
           {wonEvolution && (
             <EvolutionChart 
                title="EVOLUÇÃO DE RECUPERAÇÃO"
                subtitle="Valores recuperados dia a dia"
                totalValue={wonEvolution.totalValue}
                totalCount={wonEvolution.totalCount}
                data={wonEvolution.data}
                color="#00d68f"
                icon={
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                }
             />
           )}
        </section>

        {/* Bottom Section: Pipeline Columns */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {pipelineMetrics.map(metric => (
                <PipelineColumn key={metric.id} metrics={metric} />
            ))}
        </section>
      </div>
    </div>
  );
};

export default App;