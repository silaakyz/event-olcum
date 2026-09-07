export type AuditEntry = {
  traceId: string;
  timestamp: string;
  route: string;
  inputRows?: number;
  validRows?: number;
  invalidRows?: number;
  processingTimeMs?: number;
  success: boolean;
  error?: { type: string; message: string; details?: unknown };
  summary?: { nps?: number; satisfaction?: number };
};

const MAX_ENTRIES = Number(process.env.AUDIT_TRAIL_MAX ?? 1000);

export const auditTrail: AuditEntry[] = [];

export function recordAudit(entry: AuditEntry) {
  try {
    // clone to avoid leaking references
    const clone = JSON.parse(JSON.stringify(entry)) as AuditEntry;
    auditTrail.push(clone);
    if (auditTrail.length > MAX_ENTRIES) {
      auditTrail.shift();
    }
  } catch (e) {
    // No-op: audit trail is best-effort in-memory store
  }
}

export function getAuditTrail() {
  return auditTrail.slice();
}
