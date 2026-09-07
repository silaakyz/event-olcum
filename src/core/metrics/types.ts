export type TruthLevel = 'measured' | 'estimated' | 'assumed';

export type MetricDefinition = {
  name: string;
  source: TruthLevel;
  truthLevel?: TruthLevel;
  formula: string;
  inputs: string[];
  outputRange: string;
  interpretationRules: string[];
};

export type MetricResult = MetricDefinition & {
  value: number | null;
  error?: string;
};

export type SatisfactionScale = 5 | 10;

export type MetricConfig = {
  npsFieldNames: string[];
  satisfactionFieldNames: string[];
  satisfactionScale: SatisfactionScale;
};

export type EventReportMetadata = {
  totalResponses: number;
  validResponses: number;
  invalidResponses: number;
  distribution: Record<string, number | Record<string, number>>;
  npsDistribution?: {
    promoter: number;
    passive: number;
    detractor: number;
  };
  satisfactionScale?: '1-5' | '1-10' | 'undefined in spec';
};

export type EventReport = {
  nps: MetricResult;
  satisfaction: MetricResult;
  metadata: EventReportMetadata;
  error?: string;
};

export const DEFAULT_METRIC_CONFIG: MetricConfig = {
  npsFieldNames: ['nps', 'answers.nps', 'survey.nps', 'score', 'overallNps'],
  satisfactionFieldNames: [
    'satisfaction',
    'satisfactionScore',
    'answers.satisfaction',
    'survey.satisfaction',
    'rating',
    'overallSatisfaction',
  ],
  satisfactionScale: 5,
};

export function resolveResponseValue(response: any, fieldNames: string[]): unknown {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  for (const fieldName of fieldNames) {
    if (!fieldName.includes('.')) {
      if (Object.prototype.hasOwnProperty.call(response, fieldName)) {
        return (response as Record<string, unknown>)[fieldName];
      }
      continue;
    }

    const parts = fieldName.split('.');
    let current: any = response;
    let found = true;

    for (const part of parts) {
      if (current == null || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) {
        found = false;
        break;
      }
      current = current[part];
    }

    if (found) {
      return current;
    }
  }

  return undefined;
}
