import { recordAudit, getAuditTrail, AuditEntry } from './auditTrail';
import { getTelemetrySnapshot } from './telemetry';

const DEFAULT_MAX_AUDIT_ENTRIES = Number(process.env.AUDIT_TRAIL_MAX ?? 1000);

export function logRequestStart(route: string, inputRows?: number, correlationId?: string) {
  try {
    const entry: Partial<AuditEntry> = {
      traceId: correlationId ?? `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      route,
      inputRows,
      success: false,
    } as any;

    // best-effort internal record
    recordAudit(entry as AuditEntry);
    // internal debug only
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[logRequestStart]', route, { inputRows });
    }
  } catch (e) {
    // swallow
  }
}

export function logRequestEnd(route: string, summary?: { validRows?: number; invalidRows?: number; nps?: number; satisfaction?: number }, correlationId?: string) {
  try {
    const entry: Partial<AuditEntry> = {
      traceId: correlationId ?? `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      route,
      validRows: summary?.validRows,
      invalidRows: summary?.invalidRows,
      success: true,
      summary: { nps: summary?.nps, satisfaction: summary?.satisfaction },
    } as any;

    recordAudit(entry as AuditEntry);
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[logRequestEnd]', route, summary ?? {});
    }
  } catch (e) {
    // swallow
  }
}

export function logError(route: string, error: { type: string; message: string; details?: unknown }, correlationId?: string) {
  try {
    const entry: Partial<AuditEntry> = {
      traceId: correlationId ?? `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      route,
      success: false,
      error: { type: error.type, message: error.message, details: error.details },
    } as any;

    recordAudit(entry as AuditEntry);
    // eslint-disable-next-line no-console
    console.error('[logError]', route, error.type, error.message);
  } catch (e) {
    // swallow
  }
}

export function getInternalAuditTrail() {
  return { auditTrail: getAuditTrail(), telemetry: getTelemetrySnapshot() };
}
