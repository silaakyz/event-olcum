'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SurveySchema } from '../../src/core/surveys/schemaEngine';
import type { SurveyResponse } from '../../lib/survey/response';

export function SurveyRunner({ schema, surveyId, initialResponse, onSubmit }: { schema: SurveySchema; surveyId?: string; initialResponse?: SurveyResponse | null; onSubmit?: (response: SurveyResponse) => void }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<SurveyResponse['answers']>(initialResponse?.answers ?? []);
  const [submitted, setSubmitted] = useState(false);

  function updateAnswer(questionId: string, value: number | string) {
    setAnswers((current) => [...current.filter((answer) => answer.questionId !== questionId), { questionId, value }]);
  }

  function submitSurvey() {
    if (!surveyId || !onSubmit) return;
    onSubmit({ answers });
    setSubmitted(true);
    router.push(surveyId ? `/report/${surveyId}` : '/report');
  }

  return (
    <main className="min-h-svh bg-background px-5 py-10 text-foreground">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 border-b border-border pb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Survey</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{schema.title}</h1><p className="mt-2 text-sm text-muted-foreground">Your responses help us understand the experience.</p></header>
        <div className="space-y-4">
          {schema.questions.map((question) => {
            const current = answers.find((answer) => answer.questionId === question.id)?.value ?? '';
            if (question.type === 'calculated') return null;
            return <section key={question.id} className="rounded-xl border border-border bg-card p-5"><label htmlFor={question.id} className="block text-sm font-medium leading-6 text-foreground">{question.text}</label>{question.type === 'scale' && <div className="mt-4 flex items-center gap-4"><input id={question.id} type="range" min={question.uiSchema.min ?? 0} max={question.uiSchema.max ?? 10} step={question.uiSchema.step ?? 1} value={current === '' ? question.uiSchema.min ?? 0 : current} onChange={(event) => updateAnswer(question.id, Number(event.target.value))} className="w-full accent-[var(--brand)]" /><output className="w-8 text-right font-mono text-sm">{current || question.uiSchema.min || 0}</output></div>}{question.type === 'choice' && <div className="mt-4 space-y-2">{(question.uiSchema.options ?? []).map((option) => <label key={option} className="flex items-center gap-3 text-sm text-muted-foreground"><input type="radio" name={question.id} value={option} checked={current === option} onChange={() => updateAnswer(question.id, option)} />{option}</label>)}</div>}{question.type === 'text' && <textarea id={question.id} value={String(current)} onChange={(event) => updateAnswer(question.id, event.target.value)} rows={4} placeholder="Your response" className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />}</section>;
          })}
        </div>
        <div className="mt-6 flex items-center justify-between"><span className="text-xs text-muted-foreground">{answers.length} response{answers.length === 1 ? '' : 's'} captured</span><button type="button" onClick={submitSurvey} disabled={submitted} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{submitted ? 'Submitted' : 'Submit Survey'}</button></div>
      </div>
    </main>
  );
}
