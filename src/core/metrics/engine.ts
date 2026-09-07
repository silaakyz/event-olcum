import { calculateNPS } from './nps';
import { calculateSatisfaction } from './satisfaction';
import { DEFAULT_METRIC_CONFIG, EventReport, EventReportMetadata, MetricResult, resolveResponseValue } from './types';

export function buildEventReport(responses: any[]): EventReport {
  const safeResponses = Array.isArray(responses) ? responses : [];
  const npsResult = calculateNPS(safeResponses, DEFAULT_METRIC_CONFIG);
  const satisfactionResult = calculateSatisfaction(safeResponses, DEFAULT_METRIC_CONFIG);

  const validResponseIndexes = new Set<number>();

  for (let index = 0; index < safeResponses.length; index += 1) {
    const response = safeResponses[index];
    const npsValue = DEFAULT_METRIC_CONFIG.npsFieldNames
      .map((fieldName) => resolveResponseValue(response, [fieldName]))
      .find((value) => value !== undefined && value !== null && value !== '');

    const satisfactionValue = DEFAULT_METRIC_CONFIG.satisfactionFieldNames
      .map((fieldName) => resolveResponseValue(response, [fieldName]))
      .find((value) => value !== undefined && value !== null && value !== '');

    if (npsValue !== undefined || satisfactionValue !== undefined) {
      validResponseIndexes.add(index);
    }
  }

  const metadata: EventReportMetadata = {
    totalResponses: safeResponses.length,
    validResponses: validResponseIndexes.size,
    invalidResponses: safeResponses.length - validResponseIndexes.size,
    distribution: {
      nps: npsResult.npsDistribution,
      satisfaction: satisfactionResult.distribution,
    },
    npsDistribution: npsResult.npsDistribution,
    satisfactionScale: DEFAULT_METRIC_CONFIG.satisfactionScale === 5 ? '1-5' : '1-10',
  };

  const metricErrors = [npsResult.error, satisfactionResult.error].filter(Boolean) as string[];
  const error = metricErrors.length > 0 ? metricErrors.join(' ') : undefined;

  const npsMetric: MetricResult = {
    ...npsResult.metric,
    value: npsResult.metric.value,
    error: npsResult.metric.error,
  };

  const satisfactionMetric: MetricResult = {
    ...satisfactionResult.metric,
    value: satisfactionResult.metric.value,
    error: satisfactionResult.metric.error,
  };

  if (npsMetric.value !== null && (npsMetric.value < -100 || npsMetric.value > 100)) {
    npsMetric.error = 'Sanity check failed: NPS must be between -100 and 100.';
  }

  if (
    satisfactionMetric.value !== null &&
    (satisfactionMetric.value < 1 || satisfactionMetric.value > DEFAULT_METRIC_CONFIG.satisfactionScale)
  ) {
    satisfactionMetric.error = `Sanity check failed: satisfaction must be between 1 and ${DEFAULT_METRIC_CONFIG.satisfactionScale}.`;
  }

  const eventReport: EventReport = {
    nps: npsMetric,
    satisfaction: satisfactionMetric,
    metadata,
    ...(error ? { error } : {}),
  };

  return eventReport;
}
