'use client';

import { CORE_METRICS, type CoreMetricId } from '../../lib/builder/coreMetrics';
import { listBuilderMetricsByCategory, type BuilderMetricCategory } from '../../lib/builder/metricRegistry';

const categories: Array<{ id: BuilderMetricCategory; label: string }> = [
  { id: 'experience', label: 'Experience' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'economic', label: 'Economic' },
];

export function MetricSelector({ selectedMetrics, onChange }: { selectedMetrics: CoreMetricId[]; onChange: (metrics: CoreMetricId[]) => void }) {
  function toggleMetric(metricId: CoreMetricId) {
    onChange(selectedMetrics.includes(metricId) ? selectedMetrics.filter((id) => id !== metricId) : [...selectedMetrics, metricId]);
  }

  return (
    <section aria-labelledby="metric-selector-title">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Step 1</p><h2 id="metric-selector-title" className="mt-1 text-sm font-semibold text-foreground">Choose metrics</h2></div><span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{selectedMetrics.length}</span></div>
      <div className="space-y-5">
        {categories.map((category) => <div key={category.id}><p className="mb-2 text-xs font-medium text-muted-foreground">{category.label}</p><div className="space-y-1">{listBuilderMetricsByCategory(category.id).map((metric) => <label key={metric.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/70"><input type="checkbox" checked={selectedMetrics.includes(metric.id)} onChange={() => toggleMetric(metric.id)} className="mt-0.5 size-4 accent-[var(--brand)]" /><span className="min-w-0"><span className="block text-sm font-medium text-foreground">{metric.label}</span><span className="block text-xs leading-5 text-muted-foreground">{metric.type === 'calculated' ? 'Calculated measure' : metric.range ? `${metric.range[0]} to ${metric.range[1]} scale` : 'Choice measure'}</span></span></label>)}</div></div>)}
      </div>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">Core metrics are fixed so reports stay comparable across events.</p>
      <span className="sr-only">{CORE_METRICS.length} core metrics available</span>
    </section>
  );
}