import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import Logo from './components/Logo';
import { dataService } from './services/dataService';
import { Deal, Activity, Stage } from './types';

const App: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);

  const [dealStartDate, setDealStartDate] = useState<string>('');
  const [dealEndDate, setDealEndDate] = useState<string>('');
  const [dealStatus, setDealStatus] = useState<string>('');
  const [dealStageId, setDealStageId] = useState<string>('');
  const [dealOwner, setDealOwner] = useState<string>('');
  const [dealTitle, setDealTitle] = useState<string>('');

  const [activityStartDate, setActivityStartDate] = useState<string>('');
  const [activityEndDate, setActivityEndDate] = useState<string>('');
  const [activityType, setActivityType] = useState<string>('');
  const [activityTitle, setActivityTitle] = useState<string>('');

  const [dashboards, setDashboards] = useState<Array<{
    id: string;
    name: string;
    metric: string;
    chartType: string;
    startDate: string;
    endDate: string;
    stageId: string;
    status: string;
    owner: string;
    title: string;
    activityType: string;
    activityTitle: string;
    size: 'sm' | 'md' | 'lg';
    x: number;
    y: number;
    w: number;
    h: number;
  }>>([]);
  const [draggingDashId, setDraggingDashId] = useState<string | null>(null);
  const [resizingDashId, setResizingDashId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeOrigin, setResizeOrigin] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const dashboardAreaRef = useRef<HTMLDivElement | null>(null);
  const [isDashEditorOpen, setIsDashEditorOpen] = useState(false);
  const [editingDashId, setEditingDashId] = useState<string | null>(null);
  const [draftDash, setDraftDash] = useState({
    name: 'Novo dashboard',
    metric: 'deals_total',
    chartType: 'number',
    startDate: '',
    endDate: '',
    stageId: '',
    status: '',
    owner: '',
    title: '',
    activityType: '',
    activityTitle: '',
    size: 'md' as 'sm' | 'md' | 'lg'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isDealsModalOpen, setIsDealsModalOpen] = useState(false);
  const [dealsModalMetric, setDealsModalMetric] = useState<'deals_canceled' | 'deals_won' | 'deals_solicitations' | null>(null);
  const [dealsModalDate, setDealsModalDate] = useState<string>('');
  const [hideAutoChurn, setHideAutoChurn] = useState(false);

  const loadData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      if (forceRefresh) {
        await dataService.refreshDeals();
      } else {
        await dataService.fetchDeals();
      }
      const loadedDeals = dataService.getDeals();
      const loadedActivities = dataService.getActivities();
      const loadedStages = dataService.getStages();
      setDeals(loadedDeals);
      setActivities(loadedActivities);
      setStages(loadedStages);
      if (loadedDeals.length > 0) {
        setSelectedDealId(loadedDeals[0].id);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDeals = deals.filter((deal) => {
    if (dealStatus && deal.status !== dealStatus) return false;
    if (dealStageId && String(deal.stage_id) !== dealStageId) return false;
    if (dealOwner && !deal.owner_name.toLowerCase().includes(dealOwner.toLowerCase())) return false;
    if (dealTitle && !deal.title.toLowerCase().includes(dealTitle.toLowerCase())) return false;
    if (dealStartDate || dealEndDate) {
      if (!deal.add_time) return false;
      const dateValue = deal.add_time.slice(0, 10);
      if (!isWithinRange(dateValue, dealStartDate || undefined, dealEndDate || undefined)) return false;
    }
    return true;
  });

  useEffect(() => {
    if (!selectedDealId || !filteredDeals.some((deal) => deal.id === selectedDealId)) {
      setSelectedDealId(filteredDeals[0]?.id ?? null);
    }
  }, [filteredDeals, selectedDealId]);

  const selectedDeal = deals.find((deal) => deal.id === selectedDealId) || null;
  const dealsById = useMemo(() => new Map(deals.map((deal) => [deal.id, deal])), [deals]);
  const stageNameById = useMemo(() => new Map(stages.map((stage) => [stage.id, stage.name])), [stages]);

  const canceledStageIds = useMemo(() => {
    const cancelled = stages
      .filter((stage) => stage.name.toLowerCase().includes('cancel'))
      .map((stage) => stage.id);
    const reintegration = stages
      .filter((stage) => stage.name.toLowerCase().includes('reintegra'))
      .map((stage) => stage.id);
    const solicitations = stages
      .filter((stage) => stage.name.toLowerCase().includes('solicitou cancelamento'))
      .map((stage) => stage.id);
    const pendingCancel = stages
      .filter((stage) => stage.name.toLowerCase().includes('tratativa de cancel'))
      .map((stage) => stage.id);
    const automatic = stages
      .filter((stage) => stage.name.toLowerCase().includes('autom'))
      .map((stage) => stage.id);
    const filtered = cancelled.filter(
      (id) => !reintegration.includes(id) && !pendingCancel.includes(id) && !solicitations.includes(id)
    );
    return hideAutoChurn ? filtered.filter((id) => !automatic.includes(id)) : filtered;
  }, [stages, hideAutoChurn]);

  const solicitationsStageIds = useMemo(() => {
    return stages
      .filter((stage) => stage.name.toLowerCase().includes('solicitou cancelamento'))
      .map((stage) => stage.id);
  }, [stages]);

  const recoveredStageId = 25;
  const recoveredPipelineId = 5;
  const isRecoveredDeal = (deal: Deal) =>
    deal.pipeline_id === recoveredPipelineId && deal.stage_id === recoveredStageId;

  const resolveActivityDate = (activity: Activity): string | null => {
    if (activity.due_date) return activity.due_date;
    if (activity.add_time) return activity.add_time.slice(0, 10);
    return null;
  };

  const isWithinRange = (value: string, start?: string, end?: string) => {
    const current = new Date(value).getTime();
    const startTime = start ? new Date(start).getTime() : null;
    const endTime = end ? new Date(end).getTime() : null;
    if (startTime && current < startTime) return false;
    if (endTime && current > endTime) return false;
    return true;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isInCurrentMonth = (dateValue: string) => {
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return dateValue.startsWith(monthKey);
  };

  const getMonthRange = (monthValue: string) => {
    if (!monthValue) return { start: '', end: '' };
    const [year, month] = monthValue.split('-').map(Number);
    if (!year || !month) return { start: '', end: '' };
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return {
      start: formatDate(startDate),
      end: formatDate(endDate)
    };
  };

  const filteredActivities = activities.filter((activity) => {
    if (!selectedDealId || activity.deal_id !== selectedDealId) return false;
    const dateValue = resolveActivityDate(activity);
    if (activityStartDate || activityEndDate) {
      if (!dateValue || !isWithinRange(dateValue, activityStartDate || undefined, activityEndDate || undefined)) return false;
    }
    if (activityType && activity.type !== activityType) return false;
    if (activityTitle && !activity.subject.toLowerCase().includes(activityTitle.toLowerCase())) return false;
    return true;
  });

  const activityTypes = Array.from(new Set(activities.map((activity) => activity.type).filter(Boolean)));

  const buildDateRange = (start?: string, end?: string) => {
    const today = new Date();
    const endDate = end ? new Date(end) : today;
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return { startDate, endDate };
  };

  const buildDailySeries = (start?: string, end?: string) => {
    const { startDate, endDate } = buildDateRange(start, end);
    const series: Array<{ date: string; value: number }> = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      series.push({ date: cursor.toISOString().slice(0, 10), value: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return series;
  };

  const shouldIncludeDeal = (deal: Deal, filters: {
    stageId?: string;
    status?: string;
    owner?: string;
    title?: string;
  }) => {
    if (filters.status && deal.status !== filters.status) return false;
    if (filters.stageId && String(deal.stage_id) !== filters.stageId) return false;
    if (filters.owner && !deal.owner_name.toLowerCase().includes(filters.owner.toLowerCase())) return false;
    if (filters.title && !deal.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    return true;
  };

  const shouldIncludeActivity = (activity: Activity, filters: {
    stageId?: string;
    status?: string;
    owner?: string;
    title?: string;
    activityType?: string;
    activityTitle?: string;
  }) => {
    if (filters.activityType && activity.type !== filters.activityType) return false;
    if (filters.activityTitle && !activity.subject.toLowerCase().includes(filters.activityTitle.toLowerCase())) return false;
    if (filters.stageId || filters.status || filters.owner || filters.title) {
      const deal = activity.deal_id ? dealsById.get(activity.deal_id) : null;
      if (!deal) return false;
      return shouldIncludeDeal(deal, {
        stageId: filters.stageId,
        status: filters.status,
        owner: filters.owner,
        title: filters.title
      });
    }
    return true;
  };

  const getSeriesForMetric = (
    metric: string,
    start?: string,
    end?: string,
    stageId?: string,
    status?: string,
    owner?: string,
    title?: string,
    activityType?: string,
    activityTitle?: string
  ) => {
    const series = buildDailySeries(start, end);
    const lookup = new Map(series.map((item) => [item.date, item]));

    if (metric.startsWith('deals')) {
      deals.forEach((deal) => {
        if (!shouldIncludeDeal(deal, { stageId, status, owner, title })) return;
        let dateRef: string | null = deal.add_time;
        if (metric === 'deals_solicitations') {
          if (!solicitationsStageIds.includes(deal.stage_id)) return;
          if (!deal.stage_change_time) return;
          dateRef = deal.stage_change_time;
        }
        if (metric === 'deals_won') {
          if (!isRecoveredDeal(deal)) return;
          if (!deal.stage_change_time) return;
          dateRef = deal.stage_change_time;
        }
        if (metric === 'deals_lost') dateRef = deal.lost_time;
        if (metric === 'deals_canceled') {
          const cancelDate = deal.cancel_date;
          if (!cancelDate) return;
          if (!isInCurrentMonth(cancelDate.slice(0, 10))) return;
          dateRef = cancelDate;
        }
        if (metric === 'deals_canceled' && !canceledStageIds.includes(deal.stage_id)) return;
        if (!dateRef) return;
        const dateKey = dateRef.slice(0, 10);
        if (!isWithinRange(dateKey, start, end)) return;
        const slot = lookup.get(dateKey);
        if (slot) slot.value += 1;
      });
      return series;
    }

    activities.forEach((activity) => {
      if (!shouldIncludeActivity(activity, { stageId, status, owner, title, activityType, activityTitle })) return;
      const dateValue = resolveActivityDate(activity);
      if (!dateValue) return;
      if (!isWithinRange(dateValue, start, end)) return;
      if (metric === 'activities_done' && !activity.done) return;
      if (metric === 'activities_open' && activity.done) return;
      const slot = lookup.get(dateValue);
      if (slot) slot.value += 1;
    });

    return series;
  };

  const getDonutData = (
    metric: string,
    start?: string,
    end?: string,
    stageId?: string,
    status?: string,
    owner?: string,
    title?: string,
    activityType?: string,
    activityTitle?: string
  ) => {
    if (metric.startsWith('deals')) {
      const values = { won: 0, lost: 0, open: 0 };
      deals.forEach((deal) => {
        if (!shouldIncludeDeal(deal, { stageId, status, owner, title })) return;
        let dateRef = deal.add_time;
        if (metric === 'deals_won') {
          if (!isRecoveredDeal(deal)) return;
          if (!deal.stage_change_time) return;
          dateRef = deal.stage_change_time;
        }
        if (metric === 'deals_canceled') {
          const cancelDate = deal.cancel_date;
          if (!cancelDate) return;
          if (!isInCurrentMonth(cancelDate.slice(0, 10))) return;
          dateRef = cancelDate;
        }
        if (!dateRef) return;
        const dateKey = dateRef.slice(0, 10);
        if (!isWithinRange(dateKey, start, end)) return;
        if (metric === 'deals_canceled') {
          if (canceledStageIds.includes(deal.stage_id)) {
            values.lost += 1;
          }
          return;
        }
        values[deal.status as 'won' | 'lost' | 'open'] += 1;
      });
      return [
        { name: 'Ganho', value: values.won, color: '#00d68f' },
        { name: 'Perdido', value: values.lost, color: '#ff3366' },
        { name: 'Aberto', value: values.open, color: '#5b7afb' }
      ];
    }

    const values = { done: 0, open: 0 };
    activities.forEach((activity) => {
      if (!shouldIncludeActivity(activity, { stageId, status, owner, title, activityType, activityTitle })) return;
      const dateValue = resolveActivityDate(activity);
      if (!dateValue) return;
      if (!isWithinRange(dateValue, start, end)) return;
      if (activity.done) values.done += 1;
      else values.open += 1;
    });
    return [
      { name: 'Concluída', value: values.done, color: '#00d68f' },
      { name: 'Pendente', value: values.open, color: '#ff3366' }
    ];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getMetricTotalValue = (
    metric: string,
    startDate?: string,
    endDate?: string,
    stageId?: string,
    status?: string,
    owner?: string,
    title?: string
  ) => {
    if (!metric.startsWith('deals')) return 0;
    const total = deals.reduce((sum, deal) => {
      if (!shouldIncludeDeal(deal, { stageId, status, owner, title })) return sum;
      let dateRef: string | null = deal.add_time;
      if (metric === 'deals_solicitations') {
        if (!solicitationsStageIds.includes(deal.stage_id)) return sum;
        if (!deal.stage_change_time) return sum;
        dateRef = deal.stage_change_time;
      }
      if (metric === 'deals_won') {
        if (!isRecoveredDeal(deal)) return sum;
        if (!deal.stage_change_time) return sum;
        dateRef = deal.stage_change_time;
      }
      if (metric === 'deals_lost') dateRef = deal.lost_time;
      if (metric === 'deals_canceled') {
        const cancelDate = deal.cancel_date;
        if (!cancelDate) return sum;
        if (!isInCurrentMonth(cancelDate.slice(0, 10))) return sum;
        dateRef = cancelDate;
      }
      if (metric === 'deals_canceled' && !canceledStageIds.includes(deal.stage_id)) return sum;
      if (!dateRef) return sum;
      if (startDate || endDate) {
        if (!isWithinRange(dateRef.slice(0, 10), startDate || undefined, endDate || undefined)) return sum;
      }
      return sum + (Number(deal.value) || 0);
    }, 0);
    return total;
  };

  const getDealsForMetric = (
    metric: 'deals_canceled' | 'deals_won' | 'deals_solicitations'
  ) => {
    return deals.filter((deal) => {
      let dateRef: string | null = deal.add_time;
      if (metric === 'deals_solicitations') {
        if (!solicitationsStageIds.includes(deal.stage_id)) return false;
        if (!deal.stage_change_time) return false;
        dateRef = deal.stage_change_time;
      }
      if (metric === 'deals_won') {
        if (!isRecoveredDeal(deal)) return false;
        if (!deal.stage_change_time) return false;
        dateRef = deal.stage_change_time;
      }
      if (metric === 'deals_canceled') {
        const cancelDate = deal.cancel_date;
        if (!cancelDate) return false;
        if (!isInCurrentMonth(cancelDate.slice(0, 10))) return false;
        dateRef = cancelDate;
      }
      if (metric === 'deals_canceled' && !canceledStageIds.includes(deal.stage_id)) return false;
      if (!dateRef) return false;
      return true;
    });
  };

  const openDealsModal = (
    metric: 'deals_canceled' | 'deals_won' | 'deals_solicitations'
  ) => {
    setDealsModalMetric(metric);
    setDealsModalDate('');
    setIsDealsModalOpen(true);
  };

  const exportCanceledDeals = () => {
    const rows = deals
      .filter((deal) => canceledStageIds.includes(deal.stage_id))
      .filter((deal) => {
        const cancelDate = deal.cancel_date;
        return !!cancelDate && isInCurrentMonth(cancelDate.slice(0, 10));
      })
      .map((deal) => ({
        ID: deal.id,
        Titulo: deal.title,
        Dono: deal.owner_name,
        Estagio: stageNameById.get(deal.stage_id) || 'Sem estágio',
        Valor: deal.value,
        Moeda: deal.currency,
        DataCancelamento: deal.cancel_date || '',
        PipelineId: deal.pipeline_id
      }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cancelados');
    XLSX.writeFile(workbook, 'deals_cancelados.xlsx');
  };

  const exportFilteredDeals = (metric: 'deals_canceled' | 'deals_won' | 'deals_solicitations') => {
    const rows = getDealsForMetric(metric).map((deal) => ({
      ID: deal.id,
      Titulo: deal.title,
      Dono: deal.owner_name,
      Estagio: stageNameById.get(deal.stage_id) || 'Sem estágio',
      Valor: deal.value,
      Moeda: deal.currency,
      DataReferencia:
        metric === 'deals_canceled'
          ? deal.cancel_date || ''
          : metric === 'deals_won'
            ? deal.stage_change_time || deal.won_time || ''
            : deal.stage_change_time || deal.add_time || '',
      PipelineId: deal.pipeline_id
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    const sheetName =
      metric === 'deals_canceled'
        ? 'Cancelados'
        : metric === 'deals_won'
          ? 'Recuperados'
          : 'Solicitacoes';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `deals_${sheetName.toLowerCase()}.xlsx`);
  };

  const handleChartClick = (
    metric: 'deals_canceled' | 'deals_won' | 'deals_solicitations'
  ) => () => {
    openDealsModal(metric);
  };

  const getMetricValue = (
    metric: string,
    startDate?: string,
    endDate?: string,
    stageId?: string,
    status?: string,
    owner?: string,
    title?: string,
    activityType?: string,
    activityTitle?: string
  ) => {
    if (metric.startsWith('deals')) {
      const filtered = deals.filter((deal) => {
        if (!shouldIncludeDeal(deal, { stageId, status, owner, title })) return false;
        let dateRef: string | null = deal.add_time;
        if (metric === 'deals_solicitations') {
          if (!solicitationsStageIds.includes(deal.stage_id)) return false;
          if (!deal.stage_change_time) return false;
          dateRef = deal.stage_change_time;
        }
        if (metric === 'deals_won') {
          if (!isRecoveredDeal(deal)) return false;
          if (!deal.stage_change_time) return false;
          dateRef = deal.stage_change_time;
        }
        if (metric === 'deals_lost') dateRef = deal.lost_time;
        if (metric === 'deals_canceled') {
          const cancelDate = deal.cancel_date;
          if (!cancelDate) return false;
          if (!isInCurrentMonth(cancelDate.slice(0, 10))) return false;
          dateRef = cancelDate;
        }
        if (metric === 'deals_canceled' && !canceledStageIds.includes(deal.stage_id)) return false;
        if (!dateRef) return false;
        if (!startDate && !endDate) return true;
        return isWithinRange(dateRef.slice(0, 10), startDate || undefined, endDate || undefined);
      });

      if (metric === 'deals_canceled') return filtered.length;
      if (metric === 'deals_won') return filtered.filter((deal) => deal.status === 'won').length;
      if (metric === 'deals_lost') return filtered.filter((deal) => deal.status === 'lost').length;
      return filtered.length;
    }

    const filteredActivities = activities.filter((activity) => {
      if (!shouldIncludeActivity(activity, { stageId, status, owner, title, activityType, activityTitle })) return false;
      const dateValue = resolveActivityDate(activity);
      if (!dateValue) return false;
      if (!startDate && !endDate) return true;
      return isWithinRange(dateValue, startDate || undefined, endDate || undefined);
    });

    if (metric === 'activities_done') return filteredActivities.filter((activity) => activity.done).length;
    if (metric === 'activities_open') return filteredActivities.filter((activity) => !activity.done).length;
    return filteredActivities.length;
  };

  const handleAddDashboard = () => {
    setEditingDashId(null);
    setDraftDash({
      name: 'Novo dashboard',
      metric: 'deals_total',
      chartType: 'number',
      startDate: '',
      endDate: '',
      stageId: '',
      status: '',
      owner: '',
      title: '',
      activityType: '',
      activityTitle: '',
      size: 'md'
    });
    setIsDashEditorOpen(true);
  };

  const handleDashMonthChange = (monthValue: string) => {
    const { start, end } = getMonthRange(monthValue);
    setDraftDash((prev) => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
  };

  const dashboardMetrics = useMemo(() => {
    return dashboards.map((dash) => ({
      ...dash,
      value: getMetricValue(
        dash.metric,
        dash.startDate,
        dash.endDate,
        dash.stageId,
        dash.status,
        dash.owner,
        dash.title,
        dash.activityType,
        dash.activityTitle
      ),
      series: getSeriesForMetric(
        dash.metric,
        dash.startDate,
        dash.endDate,
        dash.stageId,
        dash.status,
        dash.owner,
        dash.title,
        dash.activityType,
        dash.activityTitle
      ),
      donut: getDonutData(
        dash.metric,
        dash.startDate,
        dash.endDate,
        dash.stageId,
        dash.status,
        dash.owner,
        dash.title,
        dash.activityType,
        dash.activityTitle
      )
    }));
  }, [dashboards, deals, activities]);

  const updateDashboard = (id: string, patch: Partial<typeof dashboards[number]>) => {
    setDashboards((prev) => prev.map((dash) => (dash.id === id ? { ...dash, ...patch } : dash)));
  };

  const removeDashboard = (id: string) => {
    setDashboards((prev) => prev.filter((dash) => dash.id !== id));
  };


  const handleEditDashboard = (id: string) => {
    const dash = dashboards.find((item) => item.id === id);
    if (!dash) return;
    setEditingDashId(id);
    setDraftDash({
      name: dash.name,
      metric: dash.metric,
      chartType: dash.chartType,
      startDate: dash.startDate,
      endDate: dash.endDate,
      stageId: dash.stageId,
      status: dash.status,
      owner: dash.owner,
      title: dash.title,
      activityType: dash.activityType,
      activityTitle: dash.activityTitle,
      size: dash.size
    });
    setIsDashEditorOpen(true);
  };

  const handleSaveDashboard = () => {
    if (editingDashId) {
      updateDashboard(editingDashId, draftDash);
    } else {
      setDashboards((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          ...draftDash,
          x: 24,
          y: 24,
          w: 380,
          h: 260
        }
      ]);
    }
    setIsDashEditorOpen(false);
    setEditingDashId(null);
  };

  const formatAxisDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(parsed);
  };

  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>, id: string) => {
    const target = event.target as HTMLElement;
    if (target.closest('.dashboard-actions')) return;
    const card = dashboards.find((dash) => dash.id === id);
    if (!card) return;
    setDraggingDashId(id);
    setDragOffset({
      x: event.clientX - card.x,
      y: event.clientY - card.y
    });
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>, id: string) => {
    event.stopPropagation();
    const card = dashboards.find((dash) => dash.id === id);
    if (!card) return;
    setResizingDashId(id);
    setResizeOrigin({ x: event.clientX, y: event.clientY, w: card.w, h: card.h });
  };

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dashboardAreaRef.current) return;
    const bounds = dashboardAreaRef.current.getBoundingClientRect();
    if (draggingDashId) {
      const x = Math.max(0, Math.min(event.clientX - bounds.left - dragOffset.x, bounds.width - 120));
      const y = Math.max(0, Math.min(event.clientY - bounds.top - dragOffset.y, bounds.height - 80));
      setDashboards((prev) => prev.map((dash) => (dash.id === draggingDashId ? { ...dash, x, y } : dash)));
    }
    if (resizingDashId) {
      const dx = event.clientX - resizeOrigin.x;
      const dy = event.clientY - resizeOrigin.y;
      const nextW = Math.max(260, resizeOrigin.w + dx);
      const nextH = Math.max(200, resizeOrigin.h + dy);
      setDashboards((prev) => prev.map((dash) => (dash.id === resizingDashId ? { ...dash, w: nextW, h: nextH } : dash)));
    }
  };

  const handlePointerUp = () => {
    setDraggingDashId(null);
    setResizingDashId(null);
  };

  const getDashboardColor = (metric: string, chartType: string) => {
    if (metric.startsWith('activities')) return '#5b7afb';
    if (metric === 'deals_won') return '#00d68f';
    if (metric === 'deals_lost') return '#ff3366';
    if (metric === 'deals_canceled') return '#ff3366';
    if (chartType === 'donut') return '#C5A059';
    return '#C5A059';
  };

  const getSeriesPalette = (metric: string) => {
    if (metric.startsWith('activities')) {
      return ['#7dd3fc', '#38bdf8', '#0284c7', '#0ea5e9'];
    }
    if (metric === 'deals_solicitations') {
      return ['#a5b4fc', '#818cf8', '#6366f1', '#4f46e5'];
    }
    if (metric === 'deals_won') {
      return ['#86efac', '#22c55e', '#16a34a', '#10b981'];
    }
    if (metric === 'deals_lost' || metric === 'deals_canceled') {
      return ['#fca5a5', '#f87171', '#ef4444', '#dc2626'];
    }
    return ['#fde68a', '#fbbf24', '#f59e0b', '#facc15'];
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
            <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="loading-text">CARREGANDO DADOS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <Logo />
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={() => setHideAutoChurn((prev) => !prev)}>
              {hideAutoChurn ? 'Mostrar churn auto' : 'Ocultar churn auto'}
            </button>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button" onClick={exportCanceledDeals}>Exportar relatório geral</button>
            <button className="ghost-button" onClick={() => loadData(true)}>Atualizar</button>
          </div>
        </div>
      </div>

      <div className="content">
        <section className="summary-hero">
          <div className="summary-text">
            <span className="summary-tag">Resumo mensal</span>
            <h1>VISÃO CONSOLIDADA</h1>
            <p>Status de cancelamentos e solicitações por ferramenta.</p>
          </div>
          <div className="summary-cards">
            <div className="summary-card">
              <span>Meta global de perda</span>
              <strong>{getMetricValue('deals_total').toLocaleString('pt-BR')}</strong>
            </div>
            <div className="summary-card danger">
              <span>Perda realizada</span>
              <strong>{formatCurrency(getMetricTotalValue('deals_canceled'))}</strong>
            </div>
            <div className="summary-card success">
              <span>Valor recuperado</span>
              <strong>{formatCurrency(getMetricTotalValue('deals_won'))}</strong>
            </div>
          </div>
        </section>

        <section className="chart-grid">
          <div className="card chart-card">
            <div className="chart-header">
              <h2>Evolução de cancelamentos</h2>
              <span className="chart-total">Total cancelado</span>
            </div>
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getSeriesForMetric('deals_canceled')} onClick={handleChartClick('deals_canceled')}>
                  <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {getSeriesForMetric('deals_canceled').map((entry, index) => (
                      <Cell key={`cancel-${entry.date}`} fill={getSeriesPalette('deals_canceled')[index % getSeriesPalette('deals_canceled').length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card chart-card">
            <div className="chart-header">
              <h2>Evolução de recuperação</h2>
              <span className="chart-total">Total recuperado</span>
            </div>
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getSeriesForMetric('deals_won')} onClick={handleChartClick('deals_won')}>
                  <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {getSeriesForMetric('deals_won').map((entry, index) => (
                      <Cell key={`won-${entry.date}`} fill={getSeriesPalette('deals_won')[index % getSeriesPalette('deals_won').length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card chart-card">
            <div className="chart-header">
              <h2>Solicitações</h2>
              <span className="chart-total">Total de solicitações</span>
            </div>
            <div className="dashboard-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getSeriesForMetric('deals_solicitations')} onClick={handleChartClick('deals_solicitations')}>
                  <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {getSeriesForMetric('deals_solicitations').map((entry, index) => (
                      <Cell key={`solic-${entry.date}`} fill={getSeriesPalette('deals_solicitations')[index % getSeriesPalette('deals_solicitations').length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="dashboard-builder">
          <div className="dashboard-toolbar">
            <h2 className="panel-title">Dashboards</h2>
            <button className="primary-button" onClick={handleAddDashboard}>+</button>
          </div>

          <div
            className="dashboard-cards free-layout"
            ref={dashboardAreaRef}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            {dashboardMetrics.length === 0 && <div className="empty-state">Nenhum dashboard criado.</div>}
            {dashboardMetrics.map((dash) => (
              <div
                key={dash.id}
                className={`card dashboard-card ${draggingDashId === dash.id ? 'is-dragging' : ''}`}
                onMouseDown={(event) => handleDragStart(event, dash.id)}
                style={{
                  ['--dash-color' as any]: getDashboardColor(dash.metric, dash.chartType),
                  left: dash.x ?? 24,
                  top: dash.y ?? 24,
                  width: dash.w ?? 380,
                  height: dash.h ?? 260
                }}
              >
                <div className="dashboard-card-header">
                  <h3 className="dashboard-title">{dash.name}</h3>
                  <div className="dashboard-actions">
                    <button className="ghost-button" onClick={() => handleEditDashboard(dash.id)}>Editar</button>
                    <button className="ghost-button danger" onClick={() => removeDashboard(dash.id)}>×</button>
                  </div>
                </div>
                <div className="dashboard-preview">
                  <p className="dashboard-metric">{dash.metric.replace('_', ' ')}</p>
                  {dash.chartType === 'number' && (
                    <div className="dashboard-value">
                      {dash.value}
                    </div>
                  )}
                  {dash.chartType !== 'number' && (
                    <div className="dashboard-chart">
                      {dash.chartType === 'bar' && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dash.series}>
                            <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {dash.series.map((entry, index) => (
                                <Cell key={`${dash.id}-bar-${entry.date}`} fill={getSeriesPalette(dash.metric)[index % getSeriesPalette(dash.metric).length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                      {dash.chartType === 'line' && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dash.series}>
                            <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke={getSeriesPalette(dash.metric)[1] || getDashboardColor(dash.metric, dash.chartType)} strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                      {dash.chartType === 'donut' && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={dash.donut} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={3}>
                              {dash.donut.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                  <p className="dashboard-chart-type">Gráfico: {dash.chartType}</p>
                  <p className="dashboard-period">
                    {dash.startDate || 'Início livre'} → {dash.endDate || 'Fim livre'}
                  </p>
                </div>
                <div className="resize-handle" onMouseDown={(event) => handleResizeStart(event, dash.id)} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {isDashEditorOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="panel-header">
              <h2 className="panel-title">{editingDashId ? 'Editar dashboard' : 'Novo dashboard'}</h2>
              <button className="ghost-button" onClick={() => setIsDashEditorOpen(false)}>Fechar</button>
            </div>
            <div className="filters-grid">
              <div className="filter-field">
                <label>Nome</label>
                <input type="text" value={draftDash.name} onChange={(e) => setDraftDash({ ...draftDash, name: e.target.value })} />
              </div>
              <div className="filter-field">
                <label>Métrica</label>
                <select value={draftDash.metric} onChange={(e) => setDraftDash({ ...draftDash, metric: e.target.value })}>
                  <option value="deals_total">Total de negócios</option>
                  <option value="deals_won">Negócios ganhos</option>
                  <option value="deals_lost">Negócios perdidos</option>
                  <option value="deals_canceled">Cancelados (por estágio)</option>
                  <option value="activities_total">Total de atividades</option>
                  <option value="activities_done">Atividades concluídas</option>
                  <option value="activities_open">Atividades pendentes</option>
                </select>
              </div>
              <div className="filter-field">
                <label>Tipo de gráfico</label>
                <select value={draftDash.chartType} onChange={(e) => setDraftDash({ ...draftDash, chartType: e.target.value })}>
                  <option value="number">Número</option>
                  <option value="bar">Barras</option>
                  <option value="line">Linha</option>
                  <option value="donut">Donut</option>
                </select>
              </div>
              <div className="filter-field">
                <label>Mês</label>
                <input
                  type="month"
                  value={draftDash.startDate ? draftDash.startDate.slice(0, 7) : ''}
                  onChange={(e) => handleDashMonthChange(e.target.value)}
                />
              </div>
              <div className="filter-field">
                <label>Estágio</label>
                <select value={draftDash.stageId} onChange={(e) => setDraftDash({ ...draftDash, stageId: e.target.value })}>
                  <option value="">Todos</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label>Status</label>
                <select value={draftDash.status} onChange={(e) => setDraftDash({ ...draftDash, status: e.target.value })}>
                  <option value="">Todos</option>
                  <option value="open">Aberto</option>
                  <option value="won">Ganho</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>
              <div className="filter-field">
                <label>Dono</label>
                <input type="text" value={draftDash.owner} onChange={(e) => setDraftDash({ ...draftDash, owner: e.target.value })} />
              </div>
              <div className="filter-field">
                <label>Título do negócio</label>
                <input type="text" value={draftDash.title} onChange={(e) => setDraftDash({ ...draftDash, title: e.target.value })} />
              </div>
              <div className="filter-field">
                <label>Tipo da atividade</label>
                <select value={draftDash.activityType} onChange={(e) => setDraftDash({ ...draftDash, activityType: e.target.value })}>
                  <option value="">Todos</option>
                  {activityTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="filter-field">
                <label>Título da atividade</label>
                <input type="text" value={draftDash.activityTitle} onChange={(e) => setDraftDash({ ...draftDash, activityTitle: e.target.value })} />
              </div>
            </div>

            <div className="dashboard-preview">
              <p className="dashboard-metric">{draftDash.metric.replace('_', ' ')}</p>
              {draftDash.chartType === 'number' && (
                <div className="dashboard-value">
                  {getMetricValue(
                    draftDash.metric,
                    draftDash.startDate,
                    draftDash.endDate,
                    draftDash.stageId,
                    draftDash.status,
                    draftDash.owner,
                    draftDash.title,
                    draftDash.activityType,
                    draftDash.activityTitle
                  )}
                </div>
              )}
              {draftDash.chartType !== 'number' && (
                <div className="dashboard-chart">
                  {draftDash.chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getSeriesForMetric(draftDash.metric, draftDash.startDate, draftDash.endDate, draftDash.stageId, draftDash.status, draftDash.owner, draftDash.title, draftDash.activityType, draftDash.activityTitle)}>
                        <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {getSeriesForMetric(draftDash.metric, draftDash.startDate, draftDash.endDate, draftDash.stageId, draftDash.status, draftDash.owner, draftDash.title, draftDash.activityType, draftDash.activityTitle).map((entry, index) => (
                            <Cell key={`${entry.date}-bar`} fill={getSeriesPalette(draftDash.metric)[index % getSeriesPalette(draftDash.metric).length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {draftDash.chartType === 'line' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getSeriesForMetric(draftDash.metric, draftDash.startDate, draftDash.endDate, draftDash.stageId, draftDash.status, draftDash.owner, draftDash.title, draftDash.activityType, draftDash.activityTitle)}>
                        <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={{ fill: '#9ca3af', fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke={getSeriesPalette(draftDash.metric)[1] || '#C5A059'} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {draftDash.chartType === 'donut' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getDonutData(draftDash.metric, draftDash.startDate, draftDash.endDate, draftDash.stageId, draftDash.status, draftDash.owner, draftDash.title, draftDash.activityType, draftDash.activityTitle)} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={3}>
                          {getDonutData(draftDash.metric, draftDash.startDate, draftDash.endDate, draftDash.stageId, draftDash.status, draftDash.owner, draftDash.title, draftDash.activityType, draftDash.activityTitle).map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="ghost-button" onClick={() => setIsDashEditorOpen(false)}>Cancelar</button>
              <button className="primary-button" onClick={handleSaveDashboard}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {isDealsModalOpen && dealsModalMetric && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="panel-header">
              <h2 className="panel-title">
                {dealsModalMetric === 'deals_canceled'
                  ? 'Deals cancelados'
                  : dealsModalMetric === 'deals_won'
                    ? 'Deals recuperados'
                    : 'Deals solicitados'}
              </h2>
              <div className="panel-actions">
                <button className="ghost-button" onClick={() => exportFilteredDeals(dealsModalMetric)}>Exportar</button>
                <button className="ghost-button" onClick={() => setIsDealsModalOpen(false)}>Fechar</button>
              </div>
            </div>
            <p className="panel-subtitle">
              {dealsModalDate ? `Data: ${new Intl.DateTimeFormat('pt-BR').format(new Date(dealsModalDate))}` : 'Todos os períodos'}
            </p>
            <div className="deals-list">
              {getDealsForMetric(dealsModalMetric).length === 0 && (
                <div className="empty-state">Nenhum deal encontrado.</div>
              )}
              {getDealsForMetric(dealsModalMetric).map((deal) => (
                <div key={deal.id} className="deal-item">
                  <div>
                    <strong>{deal.title}</strong>
                    <span>{deal.owner_name}</span>
                  </div>
                  <div className="deal-item-meta">
                    <span>{stageNameById.get(deal.stage_id) || 'Sem estágio'}</span>
                    <span>{formatCurrency(Number(deal.value) || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;