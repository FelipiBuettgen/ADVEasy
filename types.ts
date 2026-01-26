export interface Deal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: 'open' | 'won' | 'lost' | 'deleted';
  pipeline_id: number;
  stage_id: number;
  add_time: string;
  stage_change_time?: string | null;
  cancel_date?: string | null;
  won_time: string | null;
  lost_time: string | null;
  close_time: string | null;
  owner_id: number;
  owner_name: string; // Added owner name for grouping
  lost_reason: string | null;
  products_count?: number; // Mocked field for "Planos"
  source?: string; // Mocked field for "Canais"
  plan?: string; // Custom field for plan
}

export interface Activity {
  id: number;
  subject: string;
  type: string;
  due_date: string | null;
  due_time?: string | null;
  done: boolean;
  add_time?: string | null;
  update_time?: string | null;
  owner_id?: number | null;
  deal_id?: number | null;
  person_id?: number | null;
  org_id?: number | null;
  note?: string | null;
}

export interface Stage {
  id: number;
  name: string;
  pipeline_id: number;
  pipeline_name: string;
  order_nr?: number;
}

export interface KPI {
  label: string;
  value: number | string;
  subValue?: string;
  trend?: number; // percentage
  trendLabel?: string;
  type: 'currency' | 'number';
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
  [key: string]: any;
}

export interface FunnelStep {
  name: string;
  count: number;
  value: number;
  conversionRate?: number;
  [key: string]: any;
}

export interface SellerMetric {
  name: string;
  won: number;
  lost: number;
  open: number;
  total: number;
  [key: string]: any;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

export interface PipelineMetrics {
  name: string;
  goal: number;
  totalValueWon: number;
  countWon: number;
  totalValueOpen: number;
  countOpen: number;
  totalValueLost: number;
  countLost: number;
}