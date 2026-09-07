import { buildEventReport } from '../metrics/engine';
import { parseSurveyInput } from '../../lib/surveyInput';

export type MultiEventInput = {
  name: string;
  csv: string;
};

export type MultiEventComparison = {
  bestEvent: string;
  worstEvent: string;
  avgNps: number;
  avgSatisfaction: number;
  deltas: Array<{
    eventName: string;
    npsDeltaFromBest: number;
    satisfactionDeltaFromBest: number;
  }>;
};

export type MultiEventReportResult = {
  events: Array<{
    name: string;
    report: ReturnType<typeof buildEventReport>;
    validRows: number;
    error?: string;
  }>;
  comparison: MultiEventComparison;
  meta: {
    eventCount: number;
    timestamp: string;
  };
};

function buildDeterministicTimestamp(events: MultiEventInput[]): string {
  const source = events
    .map((event) => `${event?.name ?? 'unnamed_event'}::${event?.csv ?? ''}`)
    .join('|');

  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }

  const normalizedValue = Math.abs(hash) % 31557600000;
  return new Date(normalizedValue).toISOString();
}

export function buildMultiEventReport(events: MultiEventInput[]): MultiEventReportResult {
  const safeEvents = Array.isArray(events) ? events : [];
  const eventResults: Array<{ name: string; report: ReturnType<typeof buildEventReport>; validRows: number; error?: string }> = [];

  for (const event of safeEvents) {
    try {
      if (!event || typeof event.name !== 'string' || typeof event.csv !== 'string') {
        eventResults.push({
          name: event?.name || 'unnamed_event',
          report: buildEventReport([]),
          validRows: 0,
          error: 'Invalid event payload.',
        });
        continue;
      }

      const parsed = parseSurveyInput(event.csv);
      if (parsed.error || !parsed.data || parsed.data.length === 0) {
        eventResults.push({
          name: event.name,
          report: buildEventReport([]),
          validRows: 0,
          error: parsed.error?.message || 'No valid rows found.',
        });
        continue;
      }

      const report = buildEventReport(parsed.data);
      eventResults.push({
        name: event.name,
        report: report as any,
        validRows: parsed.data.length,
      });
    } catch (error) {
      eventResults.push({
        name: event?.name || 'unnamed_event',
        report: buildEventReport([]),
        validRows: 0,
        error: error instanceof Error ? error.message : 'Unknown event processing error.',
      });
    }
  }

  const validEventResults = eventResults.filter((result) => !result.error);

  const bestEvent = validEventResults.length > 0
    ? validEventResults.reduce((best, current) => {
        const bestValue = best.report.nps.value ?? Number.NEGATIVE_INFINITY;
        const currentValue = current.report.nps.value ?? Number.NEGATIVE_INFINITY;
        return currentValue > bestValue ? current : best;
      }).name
    : 'undefined';

  const worstEvent = validEventResults.length > 0
    ? validEventResults.reduce((worst, current) => {
        const worstValue = worst.report.nps.value ?? Number.POSITIVE_INFINITY;
        const currentValue = current.report.nps.value ?? Number.POSITIVE_INFINITY;
        return currentValue < worstValue ? current : worst;
      }).name
    : 'undefined';

  const avgNps = validEventResults.length > 0
    ? validEventResults.reduce((sum, current) => sum + (Number(current.report.nps.value ?? 0)), 0) / validEventResults.length
    : 0;

  const avgSatisfaction = validEventResults.length > 0
    ? validEventResults.reduce((sum, current) => sum + (Number(current.report.satisfaction.value ?? 0)), 0) / validEventResults.length
    : 0;

  const bestNps = validEventResults.length > 0
    ? Math.max(...validEventResults.map((entry) => Number(entry.report.nps.value ?? 0)))
    : 0;

  const comparison: MultiEventComparison = {
    bestEvent,
    worstEvent,
    avgNps,
    avgSatisfaction,
    deltas: validEventResults.map((entry) => ({
      eventName: entry.name,
      npsDeltaFromBest: Number(entry.report.nps.value ?? 0) - bestNps,
      satisfactionDeltaFromBest: Number(entry.report.satisfaction.value ?? 0) - (validEventResults.find((item) => item.name === bestEvent)?.report.satisfaction.value ?? 0),
    })),
  };

  return {
    events: eventResults,
    comparison,
    meta: {
      eventCount: safeEvents.length,
      timestamp: buildDeterministicTimestamp(safeEvents),
    },
  };
}
