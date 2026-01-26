import { Deal, Stage, KPI, ChartData, FunnelStep, SellerMetric, ChartDataPoint, PipelineMetrics, Activity } from '../types';
import * as d3 from 'd3';

// --- CONFIGURAÇÃO ---
const API_TOKEN = (import.meta as any).env?.VITE_PIPEDRIVE_TOKEN || '1fc6fffd00cbb8c53be5778629b176c6d3eced91'; 


const BASE_URL = 'https://api.pipedrive.com/api'; 

// IDs DE CAMPOS PERSONALIZADOS
const CUSTOM_FIELDS = {
    SOURCE: 'source_field_key', 
    PLAN: 'plan_field_key'      
};

export class DataService {
  private deals: Deal[] = [];
  private stages: Stage[] = [];
  private activities: Activity[] = [];
  // Cache para armazenar ID -> Nome do usuário
  private usersCache: Map<number, string> = new Map();
  private isDealsLoaded = false;
  private isActivitiesLoaded = false;

  constructor() {
    // Inicialmente vazio
  }

  /**
   * Helper para formatar nome curto (Ex: "João Silva" -> "João S.")
   */
  private shortenName(name: string): string {
    if (!name) return 'N/A';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    // Retorna Primeiro Nome + Inicial do último sobrenome maiúscula
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${parts[0]} ${lastInitial}.`;
  }

  /**
   * Helper para realizar fetch seguro
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

  // --- 1. BUSCA DE USUÁRIOS (V1) ---
  private async fetchUsers(): Promise<void> {
    // Se já tiver cache, não busca novamente
    if (this.usersCache.size > 0) return;

    try {
        console.log("Buscando usuários (V1)...");
        const url = `${BASE_URL}/v1/users?api_token=${API_TOKEN}`;
        const json = await this.safeFetch(url);

        if (json.data && Array.isArray(json.data)) {
            json.data.forEach((u: any) => {
                // Armazena já o nome encurtado no cache
                this.usersCache.set(u.id, this.shortenName(u.name));
            });
            console.log(`Usuários carregados: ${this.usersCache.size}`);
        }
    } catch (e) {
        console.error("Erro ao buscar usuários:", e);
        // Não lançar erro para não bloquear o restante, mas logar
    }
  }

  // --- 2. BUSCA DE ESTÁGIOS (V1) ---
  private async fetchStages(): Promise<void> {
      if (this.stages.length > 0) return;

      try {
        // Stages geralmente ficam na v1
        const url = `${BASE_URL}/v1/stages?api_token=${API_TOKEN}`;
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

  // --- 3. BUSCA DE NEGÓCIOS (V2) ---
  async fetchDeals(): Promise<void> {
    if (!API_TOKEN) {
        console.error("Token do Pipedrive não encontrado.");
        return;
    }

    // Se já carregou, não busca de novo (Cache em memória)
    if (this.isDealsLoaded) return;

    try {
        // Carrega dependências (Usuários e Estágios) antes dos Negócios
      await Promise.all([this.fetchUsers(), this.fetchStages()]);

        let allDeals: any[] = [];
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
            const queryParams = new URLSearchParams({
                api_token: API_TOKEN,
                limit: '500',
              pipeline_id: '5'
            });

            if (cursor) {
                queryParams.append('cursor', cursor);
            }

            // Endpoint V2
            const url = `${BASE_URL}/v2/deals?${queryParams.toString()}`;
            
            const json = await this.safeFetch(url);
            
            if (json.data && Array.isArray(json.data)) {
                allDeals = [...allDeals, ...json.data];
                
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

        this.deals = allDeals.map((d: any) => {
            // Resolver ID e Nome do Dono
            // Na v2, user_id pode vir apenas como ID (int) ou objeto dependendo do endpoint.
            const userId = (typeof d.user_id === 'object' && d.user_id !== null) ? d.user_id.id : d.user_id;
            
            // Tenta pegar do cache (encurtado), senão pega do deal, senão fallback
            let ownerName = this.usersCache.get(d.owner_id);
            if (!ownerName) {
                ownerName = d.owner_name ? this.shortenName(d.owner_name) : 'Sem Dono';
            }

            return {
                id: d.id,
                title: d.title || d.name || 'Sem Título',
                value: d.value || 0,
                currency: d.currency || 'BRL',
                status: d.status || (d.active_flag ? 'open' : 'closed'), 
                pipeline_id: d.pipeline_id,
                stage_id: d.stage_id,
                add_time: d.add_time,
                stage_change_time: d.stage_change_time || null,
                won_time: d.won_time,
                lost_time: d.lost_time,
                close_time: d.close_time,
                owner_id: userId,
                owner_name: ownerName, 
                lost_reason: d.lost_reason,
                products_count: d.products_count || 0, 
                source: d[CUSTOM_FIELDS.SOURCE] || 'Outros',
                plan: d[CUSTOM_FIELDS.PLAN] || null
            };
        });

        this.isDealsLoaded = true;

    } catch (error) {
        console.error("Erro fatal ao buscar dados do Pipedrive (V2):", error);
    }
  }

  async refreshDeals(): Promise<void> {
    this.isDealsLoaded = false;
    this.deals = [];
    await this.fetchDeals();
  }

    // --- 4. BUSCA DE ATIVIDADES (V2) ---
    async fetchActivities(): Promise<void> {
      // Lógica removida do SaaS. Mantém vazio por enquanto.
      if (this.isActivitiesLoaded) return;
      this.activities = [];
      this.isActivitiesLoaded = true;
    }

  // --- FILTROS E ANALYTICS (Inalterados) ---

  private filterByMonth(deals: Deal[], month: string, dateField: keyof Deal = 'won_time'): Deal[] {
    return deals.filter(d => {
      const date = d[dateField] as string | null;
      return date && date.startsWith(month);
    });
  }

  getDeals(): Deal[] {
    return this.deals;
  }

  getActivities(): Activity[] {
    return this.activities;
  }

  getStages(): Stage[] {
    return this.stages;
  }

  private getPreviousMonth(month: string): string {
    const [y, m] = month.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1 - 1, 1)); 
    return date.toISOString().slice(0, 7);
  }

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

  getSalesFunnel(month: string): FunnelStep[] {
    const targetPipelineId = 5;
    const targetPipelineName = '🎯CS | AdvEasy';
    const sortedStages = this.stages
      .filter(
        (stage) =>
          stage.pipeline_id === targetPipelineId || stage.pipeline_name === targetPipelineName
      )
      .sort((a, b) => (a.order_nr || 0) - (b.order_nr || 0));
    const funnelMap = new Map<number, FunnelStep>(); 

    sortedStages.forEach(stage => {
        funnelMap.set(stage.id, {
            name: stage.name,
            count: 0,
            value: 0,
            conversionRate: 0
        });
    });
    
    const dealsInPipeline = this.deals.filter(
      (deal) => deal.pipeline_id === targetPipelineId
    );
    const wonInMonth = this.filterByMonth(dealsInPipeline.filter(d => d.status === 'won'), month, 'won_time');
    const lostInMonth = this.filterByMonth(dealsInPipeline.filter(d => d.status === 'lost'), month, 'lost_time');
    const allOpen = dealsInPipeline.filter(d => d.status === 'open');

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