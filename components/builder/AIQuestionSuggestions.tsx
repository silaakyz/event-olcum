'use client';

import type { SurveyQuestion } from '../../src/core/surveys/schemaEngine';

export function AIQuestionSuggestions({ suggestions, onAdd }: { suggestions: SurveyQuestion[]; onAdd: (text: string) => void }) {
  return <section aria-labelledby="ai-suggestions-title" className="mt-6"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">AI-ready</p><h2 id="ai-suggestions-title" className="mt-1 text-sm font-semibold text-foreground">Suggested questions</h2></div><span className="rounded-full bg-brand-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand">Rules</span></div><div className="space-y-2">{suggestions.map((suggestion) => <button key={suggestion.id} type="button" onClick={() => onAdd(suggestion.text)} className="w-full rounded-lg border border-border bg-background p-3 text-left text-xs leading-5 text-muted-foreground hover:border-brand/50 hover:bg-brand-muted/30"><span className="mr-1 text-brand">+</span>{suggestion.text}</button>)}</div></section>;
}