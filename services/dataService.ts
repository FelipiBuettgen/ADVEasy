import { Deal, Stage, KPI, ChartData, FunnelStep, SellerMetric, ChartDataPoint, PipelineMetrics } from '../types';
import * as d3 from 'd3';

// --- CONFIGURAÇÃO ---
// Token atualizado para V2 conforme solicitado
const API_TOKEN = (import.meta as any).env?.VITE_PIPEDRIVE_TOKEN || '1fc6fffd00cbb8c53be5778629b176c6d3eced91'; 

// Proxy configurado no vercel.json (Prod) e vite.config.ts (Dev)
// Mapeia para https://api.pipedrive.com/api/v2
const BASE_URL = 'https://api.pipedrive.com/api/v2'; 

// IDs DE CAMPOS PERSONALIZADOS
const CUSTOM_FIELDS = {
    SOURCE: 'source_field_key', 
    PLAN: 'plan_field_key'      
};

export class DataService {
  private deals: Deal[] = [];
  private stages: Stage[] = [];

  constructor() {
    // Inicialmente vazio
  }

  /**
   * Helper para realizar fetch seguro, tratando erros de JSON/HTML e Status.
   */
  private async safeFetch(url: string): Promise<any> {
    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
        throw new Error(`Erro API Pipedrive (${response.status}): ${text}`);
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        if (text.trim().startsWith('<')) {
            throw new Error(`Erro de Proxy: A resposta foi HTML (provavelmente index.html) em vez de JSON. URL: ${url}`);
        }
        throw new Error(`Falha ao processar JSON: ${(e as Error).message}. Snippet: ${text.substring(0, 50)}...`);
    }
  }

  // Busca Estágios e Negócios
  async fetchDeals(): Promise<void> {
    if (!API_TOKEN) {
        console.error("Token do Pipedrive não encontrado.");
        return;
    }

    try {
        // 1. Buscar Estágios do Pipeline
        await this.fetchStages();

        // 2. Buscar Negócios (Paginação via CURSOR para API v2)
        let allDeals: any[] = [];
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
            // Monta a URL com cursor se existir
            const queryParams = new URLSearchParams({
                api_token: API_TOKEN,
                limit: '500',
            });

            if (cursor) {
                queryParams.append('cursor', cursor);
            }

            const url = `${BASE_URL}/deals?${queryParams.toString()}`;
            
            const json = await this.safeFetch(url);
            
            if (json.data && Array.isArray(json.data)) {
                allDeals = [...allDeals, ...json.data];
                
                // Lógica de paginação V2 (Cursor)
                // A API v2 geralmente retorna next_cursor em additional_data ou meta
                const nextCursor = json.additional_data?.next_cursor || json.meta?.next_cursor;
                
                if (nextCursor) {
                    cursor = nextCursor;
                } else {
                    hasMore = false;
                }
            } else {
                hasMore = false;
            }
        }

        console.log(`Dados brutos carregados (V2): ${allDeals.length} negócios.`);

        // 3. Mapear resposta do Pipedrive para nosso tipo Deal
        this.deals = allDeals.map((d: any) => {
            return {
                id: d.id,
                // V2 pode retornar 'name' em vez de 'title' dependendo do endpoint
                title: d.title || d.name || 'Sem Título',
                value: d.value || 0,
                currency: d.currency || 'BRL',
                // Fallback de status baseado em flags se status não vier explícito
                status: d.status || (d.active_flag ? 'open' : 'closed'), 
                pipeline_id: d.pipeline_id,
                stage_id: d.stage_id,
                add_time: d.add_time,
                won_time: d.won_time,
                lost_time: d.lost_time,
                close_time: d.close_time,
                owner_id: d.user_id?.id || d.user_id, // Pode vir como objeto ou ID
                owner_name: d.user_id?.name || d.owner_name || 'Sem Dono',
                lost_reason: d.lost_reason,
                
                products_count: d.products_count || 0, 
                source: d[CUSTOM_FIELDS.SOURCE] || 'Outros' 
            };
        });

    } catch (error) {
        console.error("Erro fatal ao buscar dados do Pipedrive (V2):", error);
    }
  }

  private async fetchStages(): Promise<void> {
      try {
        const url = `${BASE_URL}/stages?api_token=${API_TOKEN}`;
        const json = await this.safeFetch(url);
        
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

  // --- FILTROS E ANALYTICS ---

  private filterByMonth(deals: Deal[], month: string, dateField: keyof Deal = 'won_time'): Deal[] {
    return deals.filter(d => {
      const date = d[dateField] as string | null;
      return date && date.startsWith(month);
    });
  }

  private getPreviousMonth(month: string): string {
    const [y, m] = month.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1 - 1, 1)); 
    return date.toISOString().slice(0, 7);
  }

  // 1. KPIs Principais
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
        subValue: 'Receita Recorrente (Won)',
        trend: calcTrend(totalValue, prevTotalValue)
      },
      count: {
        label: 'Contratos',
        value: count,
        type: 'number',
        subValue: 'Novos clientes',
        trend: calcTrend(count, prevCount)
      }
    };
  }

  // 2. Distribuição de Planos
  getPlanDistribution(month: string): ChartData[] {
    const relevantDeals = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const map = new Map<string, number>();
    
    relevantDeals.forEach(deal => {
      let planName = 'Padrão';
      const titleLower = deal.title.toLowerCase();
      if (titleLower.includes('anual')) planName = 'Anual';
      else if (titleLower.includes('trimestral')) planName = 'Trimestral';
      else if (titleLower.includes('mensal')) planName = 'Mensal';
      else if (deal.products_count && deal.products_count > 1) planName = 'Multi-Produto';

      map.set(planName, (map.get(planName) || 0) + 1);
    });

    const data: ChartData[] = [];
    const colors = ['#C5A059', '#00d68f', '#5b7afb', '#ff3366', '#a0aec0'];
    let i = 0;
    
    map.forEach((value, key) => {
      data.push({ name: key, value, fill: colors[i % colors.length] });
      i++;
    });

    return data;
  }

  // 3. Canais de Origem
  getSourceDistribution(month: string): ChartData[] {
    const relevantDeals = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const map = new Map<string, number>();
    
    relevantDeals.forEach(deal => {
      const source = deal.source && deal.source !== 'Outros' ? deal.source : 'Não definido';
      map.set(source, (map.get(source) || 0) + 1);
    });

    const data: ChartData[] = [];
    const colors = ['#2d3748', '#C5A059', '#718096', '#4a5568']; 
    let i = 0;

    map.forEach((value, key) => {
      data.push({ name: key, value, fill: colors[i % colors.length] });
      i++;
    });

    return data;
  }

  // 4. Métricas por Vendedor
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

  getSellerCreated(month: string): SellerMetric[] {
    const deals = this.filterByMonth(this.deals, month, 'add_time');
    return this.aggregateSellerMetrics(deals);
  }

  getSellerClosed(month: string): SellerMetric[] {
    const won = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const lost = this.filterByMonth(this.deals.filter(d => d.status === 'lost'), month, 'lost_time');
    return this.aggregateSellerMetrics([...won, ...lost]);
  }

  // 5. Funil de Vendas
  getSalesFunnel(month: string): FunnelStep[] {
    const sortedStages = [...this.stages].sort((a, b) => (a.order_nr || 0) - (b.order_nr || 0));
    const funnelMap = new Map<number, FunnelStep>(); 

    sortedStages.forEach(stage => {
        funnelMap.set(stage.id, {
            name: stage.name,
            count: 0,
            value: 0,
            conversionRate: 0
        });
    });
    
    const wonInMonth = this.filterByMonth(this.deals.filter(d => d.status === 'won'), month, 'won_time');
    const lostInMonth = this.filterByMonth(this.deals.filter(d => d.status === 'lost'), month, 'lost_time');
    const allOpen = this.deals.filter(d => d.status === 'open');

    const relevantDeals = [...wonInMonth, ...lostInMonth, ...allOpen];

    relevantDeals.forEach(deal => {
      const step = funnelMap.get(deal.stage_id);
      if (step) {
        step.count += 1;
        step.value += deal.value;
      }
    });
    
    const funnel = Array.from(funnelMap.values());

    funnel.forEach((step, index) => {
        if (index > 0 && funnel[index-1].count > 0) {
             step.conversionRate = Math.round((step.count / funnel[index-1].count) * 100);
        } else if (index === 0) {
            step.conversionRate = 100;
        }
        if (step.conversionRate > 100) step.conversionRate = 100;
    });

    return funnel.filter(f => f.count > 0 || f.name.includes('Proposta') || f.name.includes('Negociação'));
  }

  // Gráfico de Área
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

  // Métricas Consolidadas
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