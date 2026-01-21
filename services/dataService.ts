import { Deal, Stage, KPI, ChartData, FunnelStep, SellerMetric, ChartDataPoint, PipelineMetrics } from '../types';
import * as d3 from 'd3';

// --- CONFIGURAÇÃO ---
// Para funcionar localmente ou na Vercel, precisamos do Token.
// Na Vercel: Adicione VITE_PIPEDRIVE_TOKEN nas Variáveis de Ambiente.
const API_TOKEN = (import.meta as any).env?.VITE_PIPEDRIVE_TOKEN || ''; 

// Usamos o proxy configurado no vercel.json (/api/pipe) para evitar erro de CORS
const BASE_URL = '/api/pipe'; 

// IDs DE CAMPOS PERSONALIZADOS (Você deve alterar estes valores pelos Keys do seu Pipedrive)
// Para descobrir as keys, acesse https://seu-dominio.pipedrive.com/settings/fields
const CUSTOM_FIELDS = {
    SOURCE: 'source_field_key', // Ex: '49348d8d8...'
    PLAN: 'plan_field_key'      // Se houver um campo específico para plano
};

export class DataService {
  private deals: Deal[] = [];
  private stages: Stage[] = [];

  constructor() {
    // Inicialmente vazio, aguardando fetch
  }

  // Busca Estágios e Negócios
  async fetchDeals(): Promise<void> {
    if (!API_TOKEN) {
        console.warn("VITE_PIPEDRIVE_TOKEN não encontrado. Configure nas variáveis de ambiente.");
        return;
    }

    try {
        // 1. Buscar Estágios do Pipeline
        await this.fetchStages();

        // 2. Buscar Negócios (Com paginação para pegar todos)
        let allDeals: any[] = [];
        let start = 0;
        const limit = 500; // Máximo permitido pelo Pipedrive
        let hasMore = true;

        while (hasMore) {
            // status=all_not_deleted garante que peguemos ganhos, perdidos e abertos
            const response = await fetch(`${BASE_URL}/deals?api_token=${API_TOKEN}&limit=${limit}&start=${start}&status=all_not_deleted`);
            
            if (!response.ok) throw new Error(`Erro API Pipedrive: ${response.statusText}`);
            
            const json = await response.json();
            
            if (json.data) {
                allDeals = [...allDeals, ...json.data];
                
                // Verifica paginação
                if (json.additional_data && json.additional_data.pagination && json.additional_data.pagination.more_items_in_collection) {
                    start = json.additional_data.pagination.next_start;
                } else {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
        }

        // 3. Mapear resposta do Pipedrive para nosso tipo Deal
        this.deals = allDeals.map((d: any) => {
            return {
                id: d.id,
                title: d.title,
                value: d.value || 0,
                currency: d.currency,
                status: d.status, // open, won, lost, deleted
                pipeline_id: d.pipeline_id,
                stage_id: d.stage_id,
                add_time: d.add_time,
                won_time: d.won_time,
                lost_time: d.lost_time,
                close_time: d.close_time,
                owner_id: d.user_id?.id,
                owner_name: d.user_id?.name || 'Sem Dono',
                lost_reason: d.lost_reason,
                
                // Mapeamento de Campos
                products_count: d.products_count || 0, 
                // Tenta pegar do campo customizado, senão usa um fallback (ex: org_name ou 'Indefinido')
                source: d[CUSTOM_FIELDS.SOURCE] || 'Outros' 
            };
        });

        console.log(`Carregados ${this.deals.length} negócios e ${this.stages.length} estágios.`);

    } catch (error) {
        console.error("Erro ao buscar dados do Pipedrive:", error);
    }
  }

  private async fetchStages(): Promise<void> {
      try {
        const response = await fetch(`${BASE_URL}/stages?api_token=${API_TOKEN}`);
        const json = await response.json();
        if (json.data) {
            this.stages = json.data.map((s: any) => ({
                id: s.id,
                name: s.name,
                pipeline_id: s.pipeline_id,
                pipeline_name: s.pipeline_name,
                order_nr: s.order_nr
            }));
        }
      } catch (e) {
          console.error("Erro ao buscar estágios", e);
      }
  }

  // --- MÉTODOS DE FILTRO E CÁLCULO (Lógica Mantida, apenas consome this.deals real) ---

  private filterByMonth(deals: Deal[], month: string, dateField: keyof Deal = 'won_time'): Deal[] {
    return deals.filter(d => {
      const date = d[dateField] as string | null;
      return date && date.startsWith(month);
    });
  }

  private getPreviousMonth(month: string): string {
    const [y, m] = month.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1 - 1, 1)); // Subtract 1 month
    return date.toISOString().slice(0, 7);
  }

  // 1. KPIs
  getKPIs(month: string): { totalValue: KPI, count: KPI } {
    const currentWon = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const prevMonth = this.getPreviousMonth(month);
    const prevWon = this.filterByMonth(this.deals.filter(d => d.status === 'won'), prevMonth, 'won_time');

    const totalValue = d3.sum(currentWon, d => d.value);
    const prevTotalValue = d3.sum(prevWon, d => d.value);
    
    const count = currentWon.length;
    const prevCount = prevWon.length;

    const calcTrend = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Number(((curr - prev) / prev * 100).toFixed(2));
    };

    return {
      totalValue: {
        label: 'Valor Assinaturas',
        value: totalValue,
        type: 'currency',
        subValue: 'Product TCV (BRL)',
        trend: calcTrend(totalValue, prevTotalValue)
      },
      count: {
        label: 'Contratos',
        value: count,
        type: 'number',
        subValue: 'Número de negócios',
        trend: calcTrend(count, prevCount)
      }
    };
  }

  // 2. Plan Distribution
  getPlanDistribution(month: string): ChartData[] {
    const relevantDeals = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const map = new Map<string, number>();
    
    relevantDeals.forEach(deal => {
      // Tenta inferir o plano pelo products_count se não houver campo customizado
      const planName = deal.products_count === 1 ? 'AdvEasy | Mensal' : 
                       deal.products_count === 2 ? 'AdvEasy | Trimestral' : 
                       deal.products_count >= 3 ? 'AdvEasy | Anual' : 'Avulso';
      map.set(planName, (map.get(planName) || 0) + 1);
    });

    const data: ChartData[] = [];
    const colors = ['#5b7afb', '#C5A059', '#00d68f', '#ff3366'];
    let i = 0;
    
    map.forEach((value, key) => {
      data.push({ name: key, value, fill: colors[i % colors.length] });
      i++;
    });

    return data;
  }

  // 3. Source Distribution
  getSourceDistribution(month: string): ChartData[] {
    const relevantDeals = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const map = new Map<string, number>();
    
    relevantDeals.forEach(deal => {
      const source = deal.source || 'Desconhecido';
      map.set(source, (map.get(source) || 0) + 1);
    });

    const data: ChartData[] = [];
    const colors = ['#C5A059', '#2d3748', '#a0aec0', '#5b7afb']; 
    let i = 0;

    map.forEach((value, key) => {
      data.push({ name: key, value, fill: colors[i % colors.length] });
      i++;
    });

    return data;
  }

  // 4. Seller Metrics - Helper
  private aggregateSellerMetrics(deals: Deal[]): SellerMetric[] {
    const map = new Map<string, SellerMetric>();
    deals.forEach(d => {
         const name = d.owner_name;
         if (!map.has(name)) map.set(name, { name, won: 0, lost: 0, open: 0, total: 0 });
         const m = map.get(name)!;
         m.total++;
         if (d.status === 'won') m.won++;
         else if (d.status === 'lost') m.lost++;
         else m.open++; 
    });
    return Array.from(map.values()).sort((a,b) => b.total - a.total);
  }

  // 4a. Seller Created 
  getSellerCreated(month: string): SellerMetric[] {
    const deals = this.filterByMonth(this.deals, month, 'add_time');
    return this.aggregateSellerMetrics(deals);
  }

  // 4b. Seller Closed
  getSellerClosed(month: string): SellerMetric[] {
    const won = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const lost = this.filterByMonth(this.deals.filter(d => d.status === 'lost'), month, 'lost_time');
    return this.aggregateSellerMetrics([...won, ...lost]);
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
    
    // Calcula conversão visual simples
    funnel.forEach((step, index) => {
        if (index > 0 && funnel[index-1].count > 0) {
             step.conversionRate = Math.round((step.count / funnel[index-1].count) * 100);
        } else if (index === 0) {
            step.conversionRate = 100;
        }
    });

    return funnel;
  }

  // Evolution Data (Daily)
  getEvolutionData(status: 'won' | 'lost', monthStr: string): { totalValue: number, totalCount: number, data: ChartDataPoint[] } {
    const dateField = status === 'won' ? 'won_time' : 'lost_time';
    
    const dealsInSelectedMonth = this.filterByMonth(this.deals.filter(d => d.status === status), monthStr, dateField);
    
    const totalValue = d3.sum(dealsInSelectedMonth, d => d.value);
    const totalCount = dealsInSelectedMonth.length;

    const data: ChartDataPoint[] = [];
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    for(let i = 1; i <= daysInMonth; i++) {
        const dayString = i.toString().padStart(2, '0');
        const currentCheckDate = `${monthStr}-${dayString}`;
        
        const dailyDeals = dealsInSelectedMonth.filter(d => {
            const dateVal = d[dateField];
            return dateVal && dateVal.startsWith(currentCheckDate);
        });

        data.push({
            date: dayString, 
            value: d3.sum(dailyDeals, item => item.value)
        });
    }

    return { totalValue, totalCount, data };
  }

  getPipelineMetrics(month: string): PipelineMetrics {
    const won = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const lost = this.filterByMonth(this.deals.filter(d => d.status === 'lost'), month, 'lost_time');
    const open = this.deals.filter(d => d.status === 'open');

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