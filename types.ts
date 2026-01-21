export interface Deal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: 'open' | 'won' | 'lost' | 'deleted';
  pipeline_id: number;
  stage_id: number;
  add_time: string;
  won_time: string | null;
  lost_time: string | null;
  close_time: string | null;
  owner_id: number;
  lost_reason: string | null;
}

export interface Stage {
  id: number;
  name: string;
  pipeline_id: number;
  pipeline_name: string;
}

export interface PipelineMetrics {
  id: number;
  name: string;
  totalValueWon: number;
  totalValueLost: number;
  totalValueOpen: number;
  countWon: number;
  countLost: number;
  countOpen: number;
  goal: number; // Mocked goal for visualization
}

export interface ChartDataPoint {
  date: string;
  value: number;
  count: number;
}