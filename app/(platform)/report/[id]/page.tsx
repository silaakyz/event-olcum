'use client';

import { MetricCard } from '../../../../components/report/MetricCard';
import { useSurvey } from '../../../../lib/survey/useSurvey';

function formatValue(value: number | null, suffix = '') { return value === null ? '—' : `${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}`; }

export default function SurveyReportPage({ params }: { params: { id: string } }) {
  const { metrics, survey, loading } = useSurvey(params.id);
  if (loading) return <main className="min-h-svh bg-background px-5 py-10 text-foreground"><div className="mx-auto max-w-4xl text-sm text-muted-foreground">Loading report...</div></main>;
  if (!survey || !metrics) return <main className="min-h-svh bg-background px-5 py-10 text-foreground"><div className="mx-auto max-w-4xl"><h1 className="text-2xl font-semibold">No submitted response yet</h1><p className="mt-2 text-sm text-muted-foreground">Complete this survey before viewing its report.</p></div></main>;
  return <main className="min-h-svh bg-background px-5 py-10 text-foreground"><div className="mx-auto max-w-5xl"><header className="mb-8 border-b border-border pb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Survey report</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{survey.name}</h1><p className="mt-2 text-sm text-muted-foreground">{survey.schema.title}</p></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="NPS" value={formatValue(metrics.nps)} detail="Promoters minus detractors" /><MetricCard label="CSAT" value={formatValue(metrics.csat, '/ 5')} detail="Average satisfaction" /><MetricCard label="Satisfaction" value={formatValue(metrics.satisfaction, '/ 5')} detail="Mean score" /><MetricCard label="Participation" value={formatValue(metrics.participation, '%')} detail="Completion intent" /></div><section className="mt-6 rounded-xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">Answer distribution</h2><div className="mt-4 space-y-3">{Object.entries(metrics.distribution).map(([value, count]) => <div key={value} className="flex items-center gap-3 text-xs"><span className="w-8 font-mono text-muted-foreground">{value}</span><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, count * 20)}%` }} /></div><span className="w-8 text-right text-muted-foreground">{count}</span></div>)}</div></section></div></main>;
}
