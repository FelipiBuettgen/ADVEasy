import { Deal, Stage, KPI, ChartData, FunnelStep, SellerMetric, ChartDataPoint, PipelineMetrics } from '../types';
import { MOCK_DEALS, MOCK_STAGES } from './mockData';
import * as d3 from 'd3';

export class DataService {
  private deals: Deal[];
  private stages: Stage[];

  constructor() {
    this.deals = MOCK_DEALS;
    this.stages = MOCK_STAGES;
  }

  async fetchDeals(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 800));
  }

  private filterByMonth(deals: Deal[], month: string, dateField: keyof Deal = 'won_time'): Deal[] {
    return deals.filter(d => {
      const date = d[dateField] as string | null;
      return date && date.startsWith(month);
    });
  }

  // 1. KPIs
  getKPIs(month: string): { totalValue: KPI, count: KPI } {
    // Filter won deals in the selected month
    const wonDeals = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    
    const totalValue = d3.sum(wonDeals, d => d.value);
    const count = wonDeals.length;

    return {
      totalValue: {
        label: 'Valor Assinaturas',
        value: totalValue,
        type: 'currency',
        subValue: 'Product TCV (BRL)',
        trend: -27.61 // Mock trend
      },
      count: {
        label: 'Contratos',
        value: count,
        type: 'number',
        subValue: 'Número de negócios',
        trend: -33.33 // Mock trend
      }
    };
  }

  // 2. Plan Distribution (Pie Chart)
  getPlanDistribution(month: string): ChartData[] {
    // Show distribution for deals won in that month, or open if no won date? 
    // Usually distribution is shown for Closed deals in that period or Open pipeline.
    // Let's use Won deals for the selected month to be consistent with KPIs
    const relevantDeals = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');

    const map = new Map<string, number>();
    relevantDeals.forEach(deal => {
      const planName = deal.products_count === 1 ? 'AdvEasy | Mensal' : 
                       deal.products_count === 2 ? 'AdvEasy | Trimestral' : 'AdvEasy | Anual';
      map.set(planName, (map.get(planName) || 0) + 1);
    });

    // If empty, add some placeholders or return empty
    if (relevantDeals.length === 0) return [];

    const data: ChartData[] = [];
    const colors = ['#5b7afb', '#EAB308', '#00d68f', '#ff3366'];
    let i = 0;
    
    map.forEach((value, key) => {
      data.push({ name: key, value, fill: colors[i % colors.length] });
      i++;
    });

    return data;
  }

  // 3. Source Distribution (Pie Chart)
  getSourceDistribution(month: string): ChartData[] {
    const relevantDeals = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');

    const map = new Map<string, number>();
    relevantDeals.forEach(deal => {
      const source = deal.source || 'Sem valor';
      map.set(source, (map.get(source) || 0) + 1);
    });

    const data: ChartData[] = [];
    const colors = ['#C5A059', '#1f2937', '#9ca3af', '#5b7afb']; 
    let i = 0;

    map.forEach((value, key) => {
      data.push({ name: key, value, fill: colors[i % colors.length] });
      i++;
    });

    return data;
  }

  // 4. Seller Performance (Stacked Bar)
  getSellerPerformance(month: string): SellerMetric[] {
    const map = new Map<string, SellerMetric>();

    // For Seller Performance, we usually look at:
    // Won: In selected month
    // Lost: In selected month
    // Open: Currently Open (snapshot) - filtering open by month usually implies "created in month", 
    // but sellers manage a pipe. Let's include All Open + Won/Lost in month.
    
    const wonInMonth = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const lostInMonth = this.filterByMonth(this.deals.filter(d => d.status === 'lost'), month, 'lost_time');
    const allOpen = this.deals.filter(d => d.status === 'open');

    const processDeal = (deal: Deal, type: 'won' | 'lost' | 'open') => {
        const name = deal.owner_name;
        if (!map.has(name)) {
            map.set(name, { name, won: 0, lost: 0, open: 0, total: 0 });
        }
        const metrics = map.get(name)!;
        metrics.total += 1;
        if (type === 'won') metrics.won += 1;
        else if (type === 'lost') metrics.lost += 1;
        else metrics.open += 1;
    };

    wonInMonth.forEach(d => processDeal(d, 'won'));
    lostInMonth.forEach(d => processDeal(d, 'lost'));
    allOpen.forEach(d => processDeal(d, 'open'));

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  // 5. Sales Funnel
  getSalesFunnel(month: string): FunnelStep[] {
    const sortedStages = [...this.stages].sort((a, b) => (a.order_nr || 0) - (b.order_nr || 0));
    
    const funnel: FunnelStep[] = sortedStages.map(stage => ({
      name: stage.name,
      count: 0,
      value: 0,
      conversionRate: 0
    }));

    // Funnel usually represents the CURRENT snapshot of the pipeline, 
    // regardless of the month selected (unless it's "Deals created in month X").
    // However, to make the dashboard responsive to the filter, let's show:
    // Open Deals (All) + Won/Lost (In Month) distributed by stage.
    // NOTE: Pipedrive stages for Won/Lost are specific. 
    // We'll map them based on their current stage_id.

    const wonInMonth = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const lostInMonth = this.filterByMonth(this.deals.filter(d => d.status === 'lost'), month, 'lost_time');
    const allOpen = this.deals.filter(d => d.status === 'open');

    const relevantDeals = [...wonInMonth, ...lostInMonth, ...allOpen];

    relevantDeals.forEach(deal => {
      const stageIndex = sortedStages.findIndex(s => s.id === deal.stage_id);
      if (stageIndex >= 0) {
        funnel[stageIndex].count += 1;
        funnel[stageIndex].value += deal.value;
      }
    });
    
    funnel.forEach((step, index) => {
        if (index < funnel.length - 1) {
            // Mock conversion rate
            step.conversionRate = Math.floor(Math.random() * (90 - 40) + 40);
        }
    });

    return funnel;
  }

  // --- LEGACY / OLD CHART DATA METHODS ---

  getEvolutionData(status: 'won' | 'lost', endMonth: string): { totalValue: number, totalCount: number, data: ChartDataPoint[] } {
    // 1. Calculate Total for the specific selected month (Single Value Display)
    const dateField = status === 'won' ? 'won_time' : 'lost_time';
    const dealsInSelectedMonth = this.filterByMonth(this.deals.filter(d => d.status === status), endMonth, dateField);
    
    const totalValue = d3.sum(dealsInSelectedMonth, d => d.value);
    const totalCount = dealsInSelectedMonth.length;

    // 2. Generate Data for Chart (Last 6 months relative to endMonth)
    // We need 6 months ending at endMonth.
    const data: ChartDataPoint[] = [];
    const endDate = new Date(endMonth + '-01'); // append day to make it parseable
    // Fix: Date parsing might depend on timezone, using UTC to be safe
    const [y, m] = endMonth.split('-').map(Number);
    const end = new Date(Date.UTC(y, m - 1, 1));

    for(let i=5; i>=0; i--) {
        const d = new Date(end);
        d.setUTCMonth(d.getUTCMonth() - i);
        
        const key = d.toISOString().substring(0, 7); // YYYY-MM
        const label = `${d.getUTCMonth() + 1}/${d.getUTCFullYear().toString().substring(2)}`;
        
        // Find deals in this month
        const deals = this.deals.filter(deal => {
            const dealDate = deal[dateField];
            return dealDate && dealDate.startsWith(key) && deal.status === status;
        });

        data.push({
            date: label,
            value: d3.sum(deals, item => item.value)
        });
    }

    return { totalValue, totalCount, data };
  }

  getPipelineMetrics(month: string): PipelineMetrics {
    const won = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const lost = this.filterByMonth(this.deals.filter(d => d.status === 'lost'), month, 'lost_time');
    const open = this.deals.filter(d => d.status === 'open'); // All Open

    return {
        name: 'Sales | AdvEasy',
        goal: 150000, 
        totalValueWon: d3.sum(won, d => d.value),
        countWon: won.length,
        totalValueLost: d3.sum(lost, d => d.value),
        countLost: lost.length,
        totalValueOpen: d3.sum(open, d => d.value),
        countOpen: open.length
    };
  }
}

export const dataService = new DataService();