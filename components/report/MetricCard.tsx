'use client';

export function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <article className="rounded-xl border border-border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-foreground">{value}</p>{detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}</article>;
}
