'use client';

import type { BuilderQuestion } from '../../lib/builder/state';

export function QuestionEditor({ questions, onChange }: { questions: BuilderQuestion[]; onChange: (questions: BuilderQuestion[]) => void }) {
  function addQuestion() { onChange([...questions, { id: `custom-${Date.now()}`, text: '' }]); }
  return (
    <section aria-labelledby="question-editor-title">
      <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Step 2</p><h2 id="question-editor-title" className="mt-1 text-sm font-semibold text-foreground">Custom questions</h2></div><button type="button" onClick={addQuestion} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">Add question</button></div>
      {questions.length === 0 ? <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Add a question to tailor the survey.</div> : <div className="space-y-3">{questions.map((question, index) => <div key={question.id} className="rounded-lg border border-border bg-background p-3"><div className="mb-2 flex items-center justify-between"><label htmlFor={question.id} className="text-xs font-medium text-muted-foreground">Custom question {index + 1}</label><button type="button" onClick={() => onChange(questions.filter((item) => item.id !== question.id))} className="text-xs text-muted-foreground hover:text-destructive">Remove</button></div><textarea id={question.id} value={question.text} onChange={(event) => onChange(questions.map((item) => item.id === question.id ? { ...item, text: event.target.value } : item))} rows={3} placeholder="What would you like to learn?" className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" /></div>)}</div>}
    </section>
  );
}