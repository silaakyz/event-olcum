import { recordAudit } from './auditTrail';

type StageName = 'parse' | 'engine' | 'other';

type RequestEntry = {
  id: string;
  route: string;
  start: number;
  inputRows?: number;
  stages: Record<string, number>;
};

const requests = new Map<string, RequestEntry>();
const MAX_PENDING = Number(process.env.TELEMETRY_MAX_PENDING ?? 1000);

// Simple stage aggregates
const stageAggregates: Record<string, { count: number; totalMs: number }> = {};

// Histogram buckets (ms)
const histogramBuckets = [10, 50, 100, 300, 1000, 5000];
const histogram: Record<string, number> = {};
for (const b of histogramBuckets) histogram[`<=${b}`] = 0;
histogram['>5000'] = 0;

function bucketFor(ms: number) {
  for (const b of histogramBuckets) if (ms <= b) return `<=${b}`;
  return '>5000';
}

export function startRequest(route: string, inputRows?: number) {
  const id = `cid-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  // enforce max pending requests to avoid unbounded memory growth
  if (requests.size >= MAX_PENDING) {
    // remove oldest entry
    const oldestKey = requests.keys().next().value;
    if (oldestKey) requests.delete(oldestKey);
  }

  requests.set(id, { id, route, start: Date.now(), inputRows, stages: {} });
  return id;
}

export function recordStage(requestId: string, stage: StageName, ms: number) {
  const r = requests.get(requestId);
  if (r) r.stages[stage] = (r.stages[stage] || 0) + ms;

  const agg = (stageAggregates[stage] ||= { count: 0, totalMs: 0 });
  agg.count += 1;
  agg.totalMs += ms;

  // Bottleneck detection: if stage > 70% of total so far (best-effort)
  const total = Object.values(r?.stages ?? {}).reduce((s, v) => s + v, 0);
  if (total > 0 && r && r.stages[stage] > total * 0.7 && r.stages[stage] > 50) {
    // record best-effort internal perf audit
    try {
      recordAudit({
        traceId: idForAudit(requestId),
        timestamp: new Date().toISOString(),
        route: r.route,
        inputRows: r.inputRows,
        processingTimeMs: total,
        success: true,
        summary: { nps: undefined, satisfaction: undefined },
        error: { type: 'PERF', message: `Bottleneck detected on stage ${stage}` },
      } as any);
    } catch (e) {
      // swallow
    }
  }
}

function idForAudit(requestId: string) {
  return `audit-${requestId}`;
}

export function endRequest(requestId: string, summary?: { validRows?: number; invalidRows?: number }) {
  const r = requests.get(requestId);
  if (!r) return;
  const total = Date.now() - r.start;
  const b = bucketFor(total);
  histogram[b] = (histogram[b] || 0) + 1;

  // record overall audit entry (internal only)
  try {
    recordAudit({
      traceId: idForAudit(requestId),
      timestamp: new Date().toISOString(),
      route: r.route,
      inputRows: r.inputRows,
      validRows: summary?.validRows,
      invalidRows: summary?.invalidRows,
      processingTimeMs: total,
      success: true,
    } as any);
  } catch (e) {
    // swallow
  }

  requests.delete(requestId);
}

export function getTelemetrySnapshot() {
  const stageSummary: Record<string, { avgMs: number; count: number }> = {};
  for (const k of Object.keys(stageAggregates)) {
    const a = stageAggregates[k];
    stageSummary[k] = { avgMs: Math.round(a.totalMs / Math.max(1, a.count)), count: a.count };
  }

  return {
    pendingRequests: Array.from(requests.values()).slice(0, 50),
    histogram: { ...histogram },
    stageSummary,
  };
}
