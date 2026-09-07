import { buildMultiEventReport } from '@/core/analytics/multiEventReport';
import { logRequestStart, logRequestEnd, logError } from '@/lib/logger';
import { startRequest, recordStage, endRequest } from '@/lib/telemetry';

export async function POST(request: Request) {
  const correlationId = startRequest('/api/multi-report');
  logRequestStart('/api/multi-report', undefined, correlationId);

  try {
    const body = await request.json().catch(() => null);
    const events = Array.isArray(body?.events) ? body.events : [];

    if (!Array.isArray(events) || events.length === 0) {
      const err = {
        success: false,
        error: {
          type: 'VALIDATION',
          message: 'No events supplied.',
          details: { field: 'events' },
        },
      };

      logError('/api/multi-report', { type: 'VALIDATION', message: 'No events supplied.' });

      return Response.json(err, { status: 400 });
    }

    const parseStart = Date.now();
    const data = buildMultiEventReport(events);
    recordStage(correlationId, 'parse', Date.now() - parseStart);

    // Build the public event payload without telemetry fields.
    const eventsPayload = data.events.map((entry) => {
      // record an audit per event (best-effort)

      logRequestEnd('/api/multi-report', { validRows: entry.report?.metadata?.validResponses ?? 0, invalidRows: entry.report?.metadata?.invalidResponses ?? 0, nps: entry.report?.nps?.value ?? undefined, satisfaction: entry.report?.satisfaction?.value ?? undefined }, correlationId);

      return {
        name: entry.name,
        report: entry.report,
        validRows: entry.validRows,
        ...(entry.error ? { error: entry.error } : {}),
      };
    });

    // record overall audit
    logRequestEnd('/api/multi-report', { validRows: data.events.reduce((s, e) => s + (e.validRows || 0), 0), invalidRows: data.events.reduce((s, e) => s + ((e.report?.metadata?.invalidResponses) ?? 0), 0), nps: undefined, satisfaction: undefined }, correlationId);
    endRequest(correlationId, { validRows: data.events.reduce((s, e) => s + (e.validRows || 0), 0), invalidRows: data.events.reduce((s, e) => s + ((e.report?.metadata?.invalidResponses) ?? 0), 0) });

    return Response.json(
      {
        success: true,
        data: {
          events: eventsPayload,
          comparison: data.comparison,
        },
        meta: {
          eventCount: data.meta.eventCount,
          timestamp: data.meta.timestamp,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const err = {
      success: false,
      error: {
        type: 'SYSTEM',
        message: error instanceof Error ? error.message : 'Unknown multi-event report error.',
        details: {},
      },
    };

    logError('/api/multi-report', { type: 'SYSTEM', message: error instanceof Error ? error.message : 'Unknown multi-event report error.' });

    return Response.json(err, { status: 500 });
  }
}
