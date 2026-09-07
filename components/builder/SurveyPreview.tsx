'use client';

import type { UISurveySchema } from '../../src/core/survey/uiAdapter';
import type { SurveySchema } from '../../src/core/surveys/schemaEngine';

export function SurveyPreview({ schema, uiSchema }: { schema: SurveySchema; uiSchema: UISurveySchema }) {
  function exportSchema() {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'survey-schema.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return <section aria-labelledby="survey-preview-title"><div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Step 3</p><h2 id="survey-preview-title" className="mt-1 text-sm font-semibold text-foreground">Live preview</h2></div><button type="button" onClick={exportSchema} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Export JSON</button></div><div className="rounded-xl border border-border bg-background p-5 shadow-sm"><h3 className="text-base font-semibold text-foreground">{uiSchema.title}</h3><div className="mt-5 space-y-4">{uiSchema.questions.length === 0 ? <p className="text-sm text-muted-foreground">Select a metric or add a custom question to begin.</p> : uiSchema.questions.map((question) => <div key={question.id} className="rounded-lg border border-border-subtle bg-card p-3"><div className="mb-2 flex items-center justify-between gap-3"><p className="text-sm leading-5 text-foreground">{String(question.props.text ?? '')}</p><span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{question.component}</span></div>{question.component === 'slider' && <input type="range" min={Number(question.props.min ?? 0)} max={Number(question.props.max ?? 10)} step={Number(question.props.step ?? 1)} defaultValue={Number(question.props.min ?? 0)} className="w-full accent-[var(--brand)]" />}{question.component === 'radio' && <div className="space-y-1.5">{(question.props.options as string[] | undefined)?.map((option) => <label key={option} className="flex items-center gap-2 text-xs text-muted-foreground"><input type="radio" name={question.id} />{option}</label>)}</div>}{question.component === 'input' && <input type="text" placeholder="Your response" className="w-full rounded-md border border-input px-3 py-2 text-xs" />}{question.component === 'calculated' && <p className="text-xs text-muted-foreground">Calculated automatically from response data.</p>}</div>)}</div></div></section>;
}