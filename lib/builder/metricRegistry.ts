import { CORE_METRICS, type CoreMetricId } from './coreMetrics';

export { CORE_METRICS } from './coreMetrics';
export type { CoreMetricId } from './coreMetrics';

export type BuilderMetricCategory = 'experience' | 'engagement' | 'economic';
export type BuilderMetricType = 'scale' | 'calculated' | 'choice';

export type BuilderMetricDefinition = {
  id: CoreMetricId;
  label: string;
  category: BuilderMetricCategory;
  question?: string;
  type: BuilderMetricType;
  range?: [number, number];
  step?: number;
  options?: string[];
  uiHint: 'slider' | 'radio' | 'calculated';
};

const METRIC_DEFINITIONS: Record<CoreMetricId, BuilderMetricDefinition> = {
  NPS: {
    id: 'NPS', label: 'Net Promoter Score', category: 'experience',
    question: 'How likely are you to recommend this event to a friend or colleague?',
    type: 'scale', range: [0, 10], step: 1, uiHint: 'slider',
  },
  CSAT: {
    id: 'CSAT', label: 'Customer Satisfaction', category: 'experience',
    question: 'How satisfied were you with your overall experience?',
    type: 'scale', range: [1, 5], step: 1, uiHint: 'slider',
  },
  SATISFACTION: {
    id: 'SATISFACTION', label: 'Satisfaction', category: 'experience',
    question: 'How satisfied are you with the experience you received?',
    type: 'scale', range: [1, 5], step: 1, uiHint: 'slider',
  },
  PARTICIPATION: {
    id: 'PARTICIPATION', label: 'Participation Intent', category: 'engagement',
    question: 'How likely are you to participate in a future event or activation?',
    type: 'choice', options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'], uiHint: 'radio',
  },
  ROI: {
    id: 'ROI', label: 'Return on Investment', category: 'economic', type: 'calculated', uiHint: 'calculated',
  },
  COST_PER_PERSON: {
    id: 'COST_PER_PERSON', label: 'Cost per Person', category: 'economic', type: 'calculated', uiHint: 'calculated',
  },
};

export const METRIC_REGISTRY: Readonly<Record<CoreMetricId, BuilderMetricDefinition>> =
  Object.freeze(METRIC_DEFINITIONS);

export function getBuilderMetric(id: string): BuilderMetricDefinition | undefined {
  return METRIC_REGISTRY[id as CoreMetricId];
}

export const getMetric = getBuilderMetric;

export function listBuilderMetrics(): BuilderMetricDefinition[] {
  return CORE_METRICS.map((id) => METRIC_REGISTRY[id]);
}

export function listBuilderMetricsByCategory(
  category: BuilderMetricCategory,
): BuilderMetricDefinition[] {
  return listBuilderMetrics().filter((metric) => metric.category === category);
}
