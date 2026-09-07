export const CORE_METRICS = [
  'NPS',
  'CSAT',
  'SATISFACTION',
  'PARTICIPATION',
  'ROI',
  'COST_PER_PERSON',
] as const;

export type CoreMetricId = (typeof CORE_METRICS)[number];
