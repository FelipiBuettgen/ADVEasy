import { Deal, Stage, PipelineMetrics, ChartDataPoint } from '../types';
import { MOCK_DEALS, MOCK_STAGES } from './mockData';
import * as d3 from 'd3';

export class DataService {
  private deals: Deal[];
  private stages: Stage[];

  constructor() {
    this.deals = MOCK_DEALS;
    this.stages = MOCK_STAGES;
  }

  // In a real scenario, this would fetch from the API using the credentials
  async fetchDeals(): Promise<void> {
    // Simulate API delay
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  getPipelineMetrics(): PipelineMetrics[] {
    // Map of Pipeline ID to Name
    const pipelineMap = new Map<number, string>();
    this.stages.forEach(stage => {
        // Clean up pipeline name (remove emojis for cleaner UI if needed)
        const cleanName = stage.pipeline_name.replace(/🔰|🎯|\| AdvEasy/g, '').trim();
        pipelineMap.set(stage.pipeline_id, cleanName);
    });

    const metricsMap = new Map<number, PipelineMetrics>();

    // Initialize metrics based on known pipelines
    pipelineMap.forEach((name, id) => {
      metricsMap.set(id, {
        id,
        name: name.toUpperCase(),
        totalValueWon: 0,
        totalValueLost: 0,
        totalValueOpen: 0,
        countWon: 0,
        countLost: 0,
        countOpen: 0,
        goal: 20000 // Hardcoded goal for demo purposes as per design
      });
    });

    this.deals.forEach(deal => {
      const pipelineId = deal.pipeline_id;
      const metrics = metricsMap.get(pipelineId);
      
      if (metrics) {
        if (deal.status === 'won') {
          metrics.totalValueWon += deal.value;
          metrics.countWon += 1;
        } else if (deal.status === 'lost') {
          metrics.totalValueLost += deal.value;
          metrics.countLost += 1;
        } else if (deal.status === 'open') {
          metrics.totalValueOpen += deal.value;
          metrics.countOpen += 1;
        }
      }
    });

    return Array.from(metricsMap.values());
  }

  getEvolutionChartData(status: 'lost' | 'won'): { data: ChartDataPoint[], totalValue: number, totalCount: number } {
    const relevantDeals = this.deals.filter(d => d.status === status);
    const dateField = status === 'won' ? 'won_time' : 'lost_time';

    const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%SZ");
    const formatDate = d3.timeFormat("%d/%m"); // Format like 07/01

    // Group by day
    const grouped = d3.rollup(
      relevantDeals,
      (v) => ({
        value: d3.sum(v, d => d.value),
        count: v.length
      }),
      (d) => {
        const dateStr = d[dateField as keyof Deal];
        if (!dateStr) return 'Unknown';
        const date = parseDate(dateStr as string);
        return date ? formatDate(date) : 'Unknown';
      }
    );

    // Convert to array and sort
    const data: ChartDataPoint[] = Array.from(grouped, ([date, metrics]) => ({
      date,
      value: metrics.value,
      count: metrics.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate totals
    const totalValue = d3.sum(relevantDeals, d => d.value);
    const totalCount = relevantDeals.length;

    return { data, totalValue, totalCount };
  }
}

export const dataService = new DataService();