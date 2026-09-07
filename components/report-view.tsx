'use client'

import type { NpsReport } from '../lib/nps'
import { cn } from '../lib/utils'

function verdict(score: number): string {
  if (score >= 70) return 'World-class. People are actively selling for you.'
  if (score >= 50) return 'Strong. A healthy base of promoters carrying you.'
  if (score >= 30) return 'Good, with room to convert passives into fans.'
  if (score >= 0) return 'Fragile. More work to do than word to spread.'
  return 'Underwater. Detractors outnumber your promoters.'
}

export function ReportView({
  report,
  uploadedAt,
}: {
  report: NpsReport
  uploadedAt: string
}) {
  const segments = [
    {
      label: 'Promoters',
      hint: 'scored 9–10',
      count: report.promoters,
      pct: report.promoterPct,
      tone: 'bg-brand',
    },
    {
      label: 'Passives',
      hint: 'scored 7–8',
      count: report.passives,
      pct: report.passivePct,
      tone: 'bg-muted-foreground/40',
    },
    {
      label: 'Detractors',
      hint: 'scored 0–6',
      count: report.detractors,
      pct: report.detractorPct,
      tone: 'bg-foreground/70',
    },
  ]

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-5">
        {/* Headline score — deliberately given the most room */}
        <div className="md:col-span-3">
          <p className="text-sm text-muted-foreground">Net Promoter Score</p>
          <div className="mt-2 flex items-end gap-4">
            <span className="font-mono text-7xl font-medium leading-none tracking-tight text-foreground tabular-nums sm:text-8xl">
              {report.score > 0 ? '+' : ''}
              {report.score}
            </span>
            <span className="mb-2 inline-flex items-center rounded-full border border-brand/30 bg-brand-muted/60 px-2.5 py-1 font-mono text-xs text-brand">
              avg {report.averageScore}
            </span>
          </div>
          <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
            {verdict(report.score)}
          </p>
        </div>

        {/* Supporting metrics, quieter and stacked */}
        <dl className="flex flex-col justify-end gap-5 md:col-span-2">
          {segments.map((s) => (
            <div key={s.label} className="flex items-baseline justify-between">
              <dt className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {s.label}
                </span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </dt>
              <dd className="text-right">
                <span className="font-mono text-lg tabular-nums text-foreground">
                  {s.pct}%
                </span>
                <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
                  {s.count}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Distribution bar */}
      <div className="mt-9">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {segments.map((s) => (
            <div
              key={s.label}
              className={cn('h-full transition-all', s.tone)}
              style={{ width: `${s.pct}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Based on{' '}
        <span className="font-medium text-foreground tabular-nums">
          {report.responses.toLocaleString()}
        </span>{' '}
        responses from{' '}
        <span className="font-mono text-foreground">{report.columnUsed}</span> ·
        Generated {uploadedAt}
      </p>
    </section>
  )
}
