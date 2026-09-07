import { DEFAULT_METRIC_CONFIG, MetricConfig, MetricResult, resolveResponseValue, TruthLevel } from './types';

export const satisfactionDefinition = {
  name: 'satisfaction',
  source: 'measured' as TruthLevel,
  truthLevel: 'measured' as const,
  formula: 'average of valid satisfaction scores; scale is configured as 1-5 or 1-10',
  inputs: ['responses[].satisfaction', 'responses[].answers.satisfaction', 'responses[].rating'],
  outputRange: '1 to 5 or 1 to 10 depending on configured scale',
  interpretationRules: [
    'Higher values indicate stronger satisfaction',
    'Use the configured scale explicitly and do not mix scales',
    'If scale is undefined in spec, mark it as undefined in spec',
  ],
};

export function calculateSatisfaction(responses: any[], config: MetricConfig = DEFAULT_METRIC_CONFIG): {
  metric: MetricResult;
  distribution: Record<string, number>;
  validCount: number;
  invalidCount: number;
  error?: string;
} {
  const distribution: Record<string, number> = {};
  const validScores: number[] = [];
  let invalidCount = 0;

  const allowedValues = Array.from({ length: config.satisfactionScale }, (_, index) => index + 1);

  for (const response of responses) {
    const rawValue = resolveResponseValue(response, config.satisfactionFieldNames);

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      invalidCount += 1;
      continue;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      invalidCount += 1;
      continue;
    }

    if (!allowedValues.includes(numericValue)) {
      invalidCount += 1;
      continue;
    }

    validScores.push(numericValue);
    distribution[String(numericValue)] = (distribution[String(numericValue)] ?? 0) + 1;
  }

  const value = validScores.length === 0 ? null : validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  const errors: string[] = [];

  if (value !== null && (value < 1 || value > config.satisfactionScale)) {
    errors.push(`Satisfaction out of valid range [1, ${config.satisfactionScale}].`);
  }

  if (validScores.length === 0) {
    errors.push('No valid satisfaction values found.');
  }

  const metric: MetricResult = {
    ...satisfactionDefinition,
    value,
    error: errors.length > 0 ? errors.join(' ') : undefined,
  };

  return {
    metric,
    distribution,
    validCount: validScores.length,
    invalidCount,
    error: errors.length > 0 ? errors.join(' ') : undefined,
  };
}
