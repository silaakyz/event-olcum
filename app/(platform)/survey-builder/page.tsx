'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { AIQuestionSuggestions } from '../../../components/builder/AIQuestionSuggestions';
import { MetricSelector } from '../../../components/builder/MetricSelector';
import { QuestionEditor } from '../../../components/builder/QuestionEditor';
import { SurveyPreview } from '../../../components/builder/SurveyPreview';
import { type CoreMetricId } from '../../../lib/builder/coreMetrics';
import { createCustomQuestion, type BuilderQuestion } from '../../../lib/builder/state';
import { useSurvey } from '../../../lib/survey/useSurvey';
import { generateSurveySchema, suggestQuestions, type SurveyGoal } from '../../../src/core/surveys/schemaEngine';
import { toUISurveySchema } from '../../../src/core/survey/uiAdapter';

function SurveyBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = searchParams.get('surveyId') ?? undefined;
  const existingSurvey = useSurvey(surveyId);
  const [selectedMetrics, setSelectedMetrics] = useState<CoreMetricId[]>(['NPS', 'CSAT']);
  const [surveyName, setSurveyName] = useState('Event experience survey');
  const [customQuestions, setCustomQuestions] = useState<BuilderQuestion[]>([]);
  const [goal, setGoal] = useState<SurveyGoal>('event');

  useEffect(() => {
    if (!existingSurvey.loading && existingSurvey.survey) {
      setSurveyName(existingSurvey.survey.name);
      setGoal(existingSurvey.survey.schema.goal);
      setSelectedMetrics(existingSurvey.survey.schema.questions.flatMap((question) => question.metricId ? [question.metricId as CoreMetricId] : []));
      setCustomQuestions(existingSurvey.survey.schema.questions.filter((question) => !question.metricId && question.type === 'text').map((question) => ({ id: question.id, text: question.text })));
    }
  }, [existingSurvey.loading, existingSurvey.survey]);

  const schema = useMemo(() => generateSurveySchema({ goal, metrics: selectedMetrics, customQuestions: customQuestions.map((question) => ({ text: question.text })) }), [customQuestions, goal, selectedMetrics]);
  const uiSchema = useMemo(() => toUISurveySchema(schema), [schema]);
  const suggestions = useMemo(() => suggestQuestions(goal, selectedMetrics), [goal, selectedMetrics]);

  function addSuggestion(text: string) {
    setCustomQuestions((questions) => [...questions, createCustomQuestion(text)]);
  }

  function exportSchema() {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'survey-schema.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function saveAndOpenSurvey() {
    const survey = existingSurvey.saveSchema(surveyName, schema);
    router.push(`/survey/${survey.id}`);
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Survey intelligence</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Build a survey from your measurement goal</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Select core metrics, refine your questions, and preview the deployable schema in real time.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="survey-name" className="sr-only">Survey name</label>
            <input id="survey-name" value={surveyName} onChange={(event) => setSurveyName(event.target.value)} className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Survey name" />
            <label htmlFor="survey-goal" className="sr-only">Survey goal</label>
            <select id="survey-goal" value={goal} onChange={(event) => setGoal(event.target.value as SurveyGoal)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="event">Event measurement</option><option value="campaign">Campaign measurement</option><option value="sponsor">Sponsor measurement</option></select>
            <button type="button" onClick={saveAndOpenSurvey} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Save &amp; run</button>
            <button type="button" onClick={exportSchema} className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Export JSON</button>
          </div>
        </header>
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(320px,1fr)_minmax(360px,1.15fr)]">
          <aside className="rounded-xl border border-border bg-card p-4"><MetricSelector selectedMetrics={selectedMetrics} onChange={setSelectedMetrics} /></aside>
          <section className="rounded-xl border border-border bg-card p-4"><QuestionEditor questions={customQuestions} onChange={setCustomQuestions} /></section>
          <aside className="rounded-xl border border-border bg-card p-4"><SurveyPreview schema={schema} uiSchema={uiSchema} /><AIQuestionSuggestions suggestions={suggestions} onAdd={addSuggestion} /></aside>
        </div>
        <details className="mt-5 rounded-xl border border-border bg-card"><summary className="cursor-pointer px-4 py-3 text-sm font-medium">View generated schema</summary><pre className="overflow-auto border-t border-border p-4 text-xs leading-5 text-muted-foreground">{JSON.stringify(schema, null, 2)}</pre></details>
      </div>
    </main>
  );
}

export default function SurveyBuilderPage() {
  return <Suspense fallback={<main className="min-h-svh bg-background p-8 text-sm text-muted-foreground">Loading builder...</main>}><SurveyBuilderContent /></Suspense>;
}
