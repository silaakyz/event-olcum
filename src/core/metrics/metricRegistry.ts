export type MetricCategory =
  | 'experience'
  | 'engagement'
  | 'economic'
  | 'operational'
  | 'sustainability';

export type MetricType = 'scale' | 'calculated' | 'choice';

export type MetricDefinition = {
  id: string;
  category: MetricCategory;
  type: MetricType;
  label: string;
  question?: string;
  range?: [number, number];
  step?: number;
  formula?: string;
  uiHint: 'slider' | 'radio' | 'text' | 'calculated';
  options?: string[];
};

export const CORE_METRICS: Record<string, MetricDefinition> = {
  nps: {
    id: 'nps', category: 'experience', type: 'scale', label: 'Net Promoter Score',
    question: 'How likely are you to recommend this event to a friend or colleague?',
    range: [0, 10], step: 1, uiHint: 'slider',
  },
  csat: {
    id: 'csat', category: 'experience', type: 'scale', label: 'Customer Satisfaction',
    question: 'How satisfied were you with your overall experience?',
    range: [1, 5], step: 1, uiHint: 'slider',
  },
  satisfaction: {
    id: 'satisfaction', category: 'experience', type: 'scale', label: 'Satisfaction',
    question: 'How satisfied are you with the experience you received?',
    range: [1, 5], step: 1, uiHint: 'slider',
  },
  participation_rate: {
    id: 'participation_rate', category: 'engagement', type: 'choice', label: 'Participation Intent',
    question: 'How likely are you to participate in a future event or activation?',
    options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'], uiHint: 'radio',
  },
  response_rate: {
    id: 'response_rate', category: 'engagement', type: 'calculated', label: 'Response Rate',
    formula: '(responses / invitations) * 100', uiHint: 'calculated',
  },
  completion_rate: {
    id: 'completion_rate', category: 'engagement', type: 'calculated', label: 'Completion Rate',
    formula: '(completed responses / started responses) * 100', uiHint: 'calculated',
  },
  roi: {
    id: 'roi', category: 'economic', type: 'calculated', label: 'Return on Investment',
    formula: '((measurable return - total investment) / total investment) * 100', uiHint: 'calculated',
  },
  cost_per_participant: {
    id: 'cost_per_participant', category: 'economic', type: 'calculated', label: 'Cost per Participant',
    formula: 'total cost / participants', uiHint: 'calculated',
  },
  operational_score: {
    id: 'operational_score', category: 'operational', type: 'calculated', label: 'Operational Score',
    formula: 'weighted average of operational measures', uiHint: 'calculated',
  },
  sustainability_score: {
    id: 'sustainability_score', category: 'sustainability', type: 'calculated', label: 'Sustainability Score',
    formula: 'weighted sustainability impact score', uiHint: 'calculated',
  },
};

export type CoreMetricId = keyof typeof CORE_METRICS;

export function getMetric(id: string): MetricDefinition | undefined {
  return CORE_METRICS[id];
}

export function listMetricsByCategory(category: MetricCategory): MetricDefinition[] {
  return Object.values(CORE_METRICS).filter((metric) => metric.category === category);
}