'use client';

import { SurveyRunner } from '../../../../components/survey/SurveyRunner';
import { useSurvey } from '../../../../lib/survey/useSurvey';

export default function SurveyPage({ params }: { params: { id: string } }) {
  const survey = useSurvey(params.id);
  if (survey.loading) return <main className="min-h-svh bg-background p-8 text-sm text-muted-foreground">Loading survey...</main>;
  if (!survey.schema) return <main className="min-h-svh bg-background p-8 text-sm text-muted-foreground">Survey not found.</main>;
  return <SurveyRunner schema={survey.schema} surveyId={params.id} initialResponse={survey.response} onSubmit={survey.submitResponse} />;
}
