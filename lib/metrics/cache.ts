import type { CalculatedMetrics } from './calculate';
import type { SurveyResponse } from '../survey/response';
import type { SurveySchema } from '../../src/core/surveys/schemaEngine';

type CacheEntry = {
  fingerprint: string;
  metrics: CalculatedMetrics;
};

const metricsCache = new Map<string, CacheEntry>();

function fingerprint(schema: SurveySchema, responses: SurveyResponse[]): string {
  return JSON.stringify({ schema, responses });
}

export function getCachedMetrics(
  surveyId: string,
  schema: SurveySchema,
  responses: SurveyResponse[],
): CalculatedMetrics | null {
  const currentFingerprint = fingerprint(schema, responses);
  const cached = metricsCache.get(surveyId);
  if (cached?.fingerprint === currentFingerprint) return cached.metrics;

  return null;
}

export function setCachedMetrics(
  surveyId: string,
  schema: SurveySchema,
  responses: SurveyResponse[],
  metrics: CalculatedMetrics,
): void {
  metricsCache.set(surveyId, { fingerprint: fingerprint(schema, responses), metrics });
}

export function invalidateMetricsCache(surveyId: string): void {
  metricsCache.delete(surveyId);
}

export function clearMetricsCache(): void {
  metricsCache.clear();
}
