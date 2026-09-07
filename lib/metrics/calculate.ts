import type { SurveySchema } from '../../src/core/surveys/schemaEngine';
import type { SurveyResponse } from '../survey/response';

export type CalculatedMetrics = {
  nps: number | null;
  csat: number | null;
  satisfaction: number | null;
  participation: number;
  roi: number | null;
  costPerPerson: number | null;
  distribution: Record<string, number>;
};

function numericAnswer(response: SurveyResponse, questionId: string): number | null {
  const answer = response.answers.find((item) => item.questionId === questionId)?.value;
  if (typeof answer === 'number' && Number.isFinite(answer)) return answer;
  if (typeof answer === 'string' && answer.trim() !== '' && Number.isFinite(Number(answer))) return Number(answer);
  return null;
}

export function calculateMetrics(response: SurveyResponse | SurveyResponse[], schema: SurveySchema): CalculatedMetrics {
  const responses = Array.isArray(response) ? response : [response];
  const metricQuestions = schema.questions.filter((question) => question.metricId);
  const values = responses.flatMap((item) => metricQuestions.flatMap((question) => {
    const value = numericAnswer(item, question.id);
    return value === null ? [] : [{ metricId: question.metricId, value }];
  }));
  const npsValues = values.filter((item) => item.metricId === 'NPS').map((item) => item.value);
  const csatValues = values.filter((item) => item.metricId === 'CSAT').map((item) => item.value);
  const satisfactionValues = values.filter((item) => item.metricId === 'SATISFACTION').map((item) => item.value);
  const participationQuestion = metricQuestions.find((question) => question.metricId === 'PARTICIPATION');
  const participationAnswers = participationQuestion ? responses.map((item) => item.answers.find((answer) => answer.questionId === participationQuestion.id)?.value).filter((value) => value !== undefined) : [];
  const participation = participationAnswers.length ? (participationAnswers.filter((value) => ['Definitely', 'Probably'].includes(String(value))).length / participationAnswers.length) * 100 : 0;
  const mean = (items: number[]) => items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : null;
  const promoters = npsValues.filter((value) => value >= 9).length;
  const detractors = npsValues.filter((value) => value <= 6).length;
  const nps = npsValues.length ? ((promoters / npsValues.length) - (detractors / npsValues.length)) * 100 : null;
  const distribution: Record<string, number> = {};
  values.forEach(({ value }) => { distribution[String(value)] = (distribution[String(value)] ?? 0) + 1; });

  return {
    nps,
    csat: mean(csatValues),
    satisfaction: mean(satisfactionValues),
    participation,
    roi: values.some((item) => item.metricId === 'ROI') ? 0 : null,
    costPerPerson: values.some((item) => item.metricId === 'COST_PER_PERSON') ? 0 : null,
    distribution,
  };
}
