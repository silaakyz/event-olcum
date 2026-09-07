'use client';

import Link from 'next/link';

export type DashboardSurvey = {
  id: string;
  name: string;
  status: 'Draft' | 'Active' | 'Completed';
  responses: number;
  created: string;
  metrics: string[];
};

export type DashboardData = {
  surveys: DashboardSurvey[];
  totalResponses: number;
  metricsAvailable: number;
  loading: boolean;
};

function StatusBadge({ status }: { status: DashboardSurvey['status'] }) {
  const tone = status === 'Active'
    ? 'border-green-200 bg-green-50 text-green-700'
    : status === 'Completed'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : 'border-slate-200 bg-slate-50 text-slate-600';
  return <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${tone}`}>{status}</span>;
}

export default function App({ data }: { data: DashboardData }) {
  return (
    <main className="min-h-svh bg-[var(--color-bg)] p-6 text-[var(--color-ink)] lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-blue)]">Survey intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-sm text-[var(--color-ink-2)]">Overview of your survey activity</p>
          </div>
          <Link href="/survey-builder" className="rounded-md bg-[var(--color-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-blue-hover)]">New Survey</Link>
        </header>
        {data.loading ? <div className="rounded-xl border border-[var(--color-border)] bg-white p-8 text-sm text-[var(--color-ink-2)]">Loading surveys...</div> : <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Metric label="Total Surveys" value={data.surveys.length} detail="Saved in your workspace" />
            <Metric label="Total Responses" value={data.totalResponses} detail="Across all surveys" />
            <Metric label="Metrics Available" value={data.metricsAvailable} detail="Registry-backed measures" />
          </div>
          <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4"><h2 className="text-sm font-semibold">Recent Surveys</h2><Link href="/surveys" className="text-xs font-medium text-[var(--color-blue)] hover:underline">View all</Link></div>
            {data.surveys.length === 0 ? <div className="p-10 text-center text-sm text-[var(--color-ink-2)]">No surveys yet. Create one to start collecting responses.</div> : <div className="divide-y divide-[var(--color-border-2)]">
              {data.surveys.slice(0, 6).map((survey) => <div key={survey.id} className="grid gap-3 px-5 py-4 md:grid-cols-[2fr_120px_100px_140px_180px] md:items-center">
                <div><p className="text-sm font-medium">{survey.name}</p><p className="mt-1 text-xs text-[var(--color-ink-3)]">{survey.metrics.join(' · ') || 'No metrics selected'}</p></div>
                <StatusBadge status={survey.status} />
                <span className="font-mono text-sm">{survey.responses || '—'}</span>
                <span className="text-xs text-[var(--color-ink-3)]">{survey.created}</span>
                <div className="flex gap-2"><Link href={`/survey/${survey.id}`} className="rounded-md border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-bg)]">Run</Link><Link href={`/report/${survey.id}`} className="rounded-md border border-[var(--color-border)] px-2 py-1.5 text-xs font-medium hover:bg-[var(--color-bg)]">Report</Link></div>
              </div>)}
            </div>}
          </section>
        </>}
      </div>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="rounded-xl border border-[var(--color-border)] bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-3)]">{label}</p><p className="mt-3 font-mono text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-[var(--color-ink-2)]">{detail}</p></div>;
}
