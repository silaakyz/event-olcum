'use client';

import App, { type DashboardData } from '../../../src/App';
import { useSurveys } from '../../../lib/survey/useSurveys';
import { CORE_METRICS } from '../../../lib/builder/coreMetrics';

export default function DashboardPage() {
  const { surveys, loading } = useSurveys();
  const data: DashboardData = {
    loading,
    metricsAvailable: CORE_METRICS.length,
    totalResponses: surveys.reduce((total, survey) => total + survey.responses.length, 0),
    surveys: surveys.map((survey) => ({
      id: survey.id,
      name: survey.name,
      responses: survey.responses.length,
      created: new Date(survey.createdAt).toLocaleDateString(),
      status: survey.responses.length === 0 ? 'Draft' : 'Active',
      metrics: survey.schema.questions.flatMap((question) => question.metricId ? [question.metricId] : []),
    })),
  };

  return <App data={data} />;
}
