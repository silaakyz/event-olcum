import { DEFAULT_METRIC_CONFIG, MetricConfig, MetricResult, resolveResponseValue, TruthLevel } from './types';

export const npsDefinition = {
  name: 'nps',
  source: 'measured' as TruthLevel,
  truthLevel: 'measured' as const,
  formula: '((promoters - detractors) / total_valid_nps_responses) * 100 where promoters >= 9, passive is 7-8, detractors <= 6',
  inputs: ['responses[].nps', 'responses[].answers.nps'],
  outputRange: '-100 to 100',
  interpretationRules: [
    'NPS >= 50 is strongly positive',
    'NPS between 0 and 49 is moderate',
    'NPS < 0 indicates more detractors than promoters',
  ],
};

export function calculateNPS(responses: any[], config: MetricConfig = DEFAULT_METRIC_CONFIG): {
  metric: MetricResult;
  npsDistribution: { promoter: number; passive: number; detractor: number };
  validCount: number;
  invalidCount: number;
  error?: string;
} {
  const distribution = { promoter: 0, passive: 0, detractor: 0 };
  let validCount = 0;
  let invalidCount = 0;

  for (const response of responses) {
    const rawValue = resolveResponseValue(response, config.npsFieldNames);

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      invalidCount += 1;
      continue;
    }

    const numericValue = Number(rawValue);

    if (!Number.isFinite(numericValue)) {
      invalidCount += 1;
      continue;
    }

    if (numericValue < 0 || numericValue > 10) {
      invalidCount += 1;
      continue;
    }

    validCount += 1;

    if (numericValue >= 9) {
      distribution.promoter += 1;
    } else if (numericValue >= 7) {
      distribution.passive += 1;
    } else {
      distribution.detractor += 1;
    }
  }

  const total = validCount;
  const npsValue = total === 0 ? null : ((distribution.promoter - distribution.detractor) / total) * 100;

  const errors: string[] = [];

  if (npsValue !== null && (npsValue < -100 || npsValue > 100)) {
    errors.push('NPS out of valid range [-100, 100].');
  }

  if (validCount === 0) {
    errors.push('No valid NPS values found.');
  }

  const metric: MetricResult = {
    ...npsDefinition,
    value: npsValue,
    error: errors.length > 0 ? errors.join(' ') : undefined,
  };

  return {
    metric,
    npsDistribution: distribution,
    validCount,
    invalidCount,
    error: errors.length > 0 ? errors.join(' ') : undefined,
  };
}
