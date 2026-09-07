import { buildEventReport } from '@/core/metrics/engine';
import { parseSurveyInput } from '@/lib/surveyInput';
import { logRequestStart, logRequestEnd, logError } from '@/lib/logger';
import { startRequest, recordStage, endRequest } from '@/lib/telemetry';

export async function POST(request: Request) {
  const correlationId = startRequest('/api/report');
  logRequestStart('/api/report', undefined, correlationId);

  try {
    const body = await request.json().catch(() => null);

    const csvText = typeof body === 'string'
      ? body
      : typeof body?.csv === 'string'
        ? body.csv
        : '';

    if (!csvText || csvText.trim() === '') {
      const err = {
        success: false,
        error: {
          type: 'VALIDATION',
          message: 'Empty CSV input.',
          details: { field: 'csv' },
        },
      };

      logError('/api/report', { type: 'VALIDATION', message: 'Empty CSV input.' });

      return Response.json(err, { status: 400 });
    }

    const parseStart = Date.now();
    const parsed = parseSurveyInput(csvText);
    recordStage(correlationId, 'parse', Date.now() - parseStart);

    if (parsed.error) {
      const err = {
        success: false,
        error: {
          type: parsed.error.type,
          message: parsed.error.message,
          details: parsed.error.details,
        },
      };


      logError('/api/report', { type: parsed.error.type, message: parsed.error.message, details: parsed.error.details });

      return Response.json(err, { status: 400 });
    }

    if (!parsed.data || parsed.data.length === 0) {
      const err = {
        success: false,
        error: {
          type: 'VALIDATION',
          message: 'No valid survey rows found.',
          details: { invalidRowDetails: parsed.invalidRowDetails },
        },
      };


      logError('/api/report', { type: 'VALIDATION', message: 'No valid survey rows found.', details: { invalidRowDetails: parsed.invalidRowDetails } });

      return Response.json(err, { status: 400 });
    }

    const engineStart = Date.now();
    const report = buildEventReport(parsed.data);
    recordStage(correlationId, 'engine', Date.now() - engineStart);
    const reportWithCompatibility: any = {
      ...(report as any),
      totalResponses: report.metadata.totalResponses,
      validResponses: report.metadata.validResponses,
      invalidResponses: report.metadata.invalidResponses,
    };


    const response = {
      success: true,
      data: { report: reportWithCompatibility },
      meta: {
        inputRows: parsed.totalRows ?? parsed.data.length,
        validRows: parsed.validRows ?? parsed.data.length,
        invalidRows: parsed.droppedRows ?? 0,
        ...(parsed.invalidRowDetails && parsed.invalidRowDetails.length > 0 ? { invalidRowDetails: parsed.invalidRowDetails } : {}),
      },
    };

    logRequestEnd('/api/report', { validRows: parsed.validRows ?? parsed.data.length, invalidRows: parsed.droppedRows ?? 0, nps: report.nps?.value ?? undefined, satisfaction: report.satisfaction?.value ?? undefined }, correlationId);
    endRequest(correlationId, { validRows: parsed.validRows ?? parsed.data.length, invalidRows: parsed.droppedRows ?? 0 });

    return Response.json(response, { status: 200 });
  } catch (error) {
    const err = {
      success: false,
      error: {
        type: 'SYSTEM',
        message: error instanceof Error ? error.message : 'Unknown error while generating report.',
        details: {},
      },
    };


    logError('/api/report', { type: 'SYSTEM', message: error instanceof Error ? error.message : 'Unknown error while generating report.' }, correlationId);
    endRequest(correlationId);

    return Response.json(err, { status: 500 });
  }
}
