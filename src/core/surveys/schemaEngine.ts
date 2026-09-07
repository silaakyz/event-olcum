import { type CoreMetricId, getBuilderMetric } from '../../../lib/builder/metricRegistry';

export type SurveyGoal = 'event' | 'campaign' | 'sponsor';
export type SurveyQuestionType = 'scale' | 'text' | 'choice' | 'calculated';
export type SurveyMetric = CoreMetricId;

export type SurveyQuestion = {
  id: string;
  metricId?: string;
  text: string;
  type: SurveyQuestionType;
  uiSchema: {
    component: 'slider' | 'radio' | 'input' | 'calculated';
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    label: string;
  };
};

export type CustomSurveyQuestion = {
  text: string;
  type?: Exclude<SurveyQuestionType, 'calculated'>;
  uiSchema?: {
    component?: SurveyQuestion['uiSchema']['component'];
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    label?: string;
  };
};

export type SurveySchemaInput = {
  goal: SurveyGoal;
  metrics: readonly string[];
  customText?: string;
  customQuestions?: readonly CustomSurveyQuestion[];
  context?: string;
};

export type SurveySchema = {
  schemaVersion: 1;
  title: string;
  goal: SurveyGoal;
  questions: SurveyQuestion[];
};

const GOAL_TITLES: Record<SurveyGoal, string> = {
  event: 'Event experience survey',
  campaign: 'Campaign impact survey',
  sponsor: 'Sponsor impact survey',
};

const GOAL_SUGGESTIONS: Record<SurveyGoal, string[]> = {
  event: [
    'What was the most valuable part of the event for you?',
    'What is one thing we could improve for the next event?',
  ],
  campaign: [
    'What do you remember most about this campaign?',
    'What action, if any, did this campaign motivate you to take?',
  ],
  sponsor: [
    'Which sponsor or brand do you remember from this experience?',
    'How well did the sponsor fit the event or experience?',
  ],
};

function validMetricIds(metrics: readonly string[]): CoreMetricId[] {
  return [...new Set(metrics)].filter((metric): metric is CoreMetricId => Boolean(getBuilderMetric(metric)));
}

function metricQuestion(metricId: CoreMetricId): SurveyQuestion {
  const metric = getBuilderMetric(metricId);
  if (!metric) {
    throw new Error(`Unknown metric: ${metricId}`);
  }
  const component = metric.uiHint;

  return {
    id: `metric-${metric.id}`,
    metricId: metric.id,
    text: metric.question ?? metric.label,
    type: metric.type,
    uiSchema: {
      component,
      ...(metric.range ? { min: metric.range[0], max: metric.range[1] } : {}),
      ...(metric.step ? { step: metric.step } : {}),
      ...(metric.options ? { options: metric.options } : {}),
      label: metric.label,
    },
  };
}

function customQuestion(question: CustomSurveyQuestion, index: number): SurveyQuestion | null {
  const text = question.text?.trim();
  if (!text) return null;

  const type = question.type ?? 'text';
  return {
    id: `custom-${index + 1}`,
    text,
    type,
    uiSchema: {
      component: question.uiSchema?.component ?? (type === 'choice' ? 'radio' : type === 'scale' ? 'slider' : 'input'),
      ...(question.uiSchema?.min !== undefined ? { min: question.uiSchema.min } : {}),
      ...(question.uiSchema?.max !== undefined ? { max: question.uiSchema.max } : {}),
      ...(question.uiSchema?.step !== undefined ? { step: question.uiSchema.step } : {}),
      ...(question.uiSchema?.options ? { options: question.uiSchema.options } : {}),
      label: question.uiSchema?.label ?? text,
    },
  };
}

function suggestedQuestion(goal: SurveyGoal, text: string, index: number): SurveyQuestion {
  return {
    id: `ai-${goal}-${index + 1}`,
    text,
    type: 'text',
    uiSchema: { component: 'input', label: text },
  };
}

export function suggestQuestions(
  goal: SurveyGoal,
  metrics: readonly string[],
  context = '',
): SurveyQuestion[] {
  const normalizedContext = context.toLowerCase();
  const metricIds = validMetricIds(metrics);
  const suggestions = [...(GOAL_SUGGESTIONS[goal] ?? GOAL_SUGGESTIONS.event)];

  if (metricIds.includes('ROI') || metricIds.includes('COST_PER_PERSON')) {
    suggestions.unshift('What costs had the greatest impact on delivering this experience?');
  }
  if (goal === 'sponsor') {
    suggestions.unshift('What sponsor interaction or activation did you notice most?');
  }
  if (normalizedContext.includes('improve')) {
    suggestions.unshift('What is the single most important improvement we should make?');
  }

  return [...new Set(suggestions)].map((text, index) => suggestedQuestion(goal, text, index));
}

export function generateSurveySchema(input: SurveySchemaInput): SurveySchema {
  const metricIds = validMetricIds(input.metrics);
  const metricQuestions = metricIds.map(metricQuestion);
  const customTextQuestion = input.customText
    ? customQuestion({ text: input.customText }, 0)
    : null;
  const customQuestions = (input.customQuestions ?? [])
    .map((question, index) => customQuestion(question, index + (customTextQuestion ? 1 : 0)))
    .filter((question): question is SurveyQuestion => question !== null);
  const aiQuestions = suggestQuestions(input.goal, metricIds, input.context ?? input.customText);

  return {
    schemaVersion: 1,
    title: GOAL_TITLES[input.goal],
    goal: input.goal,
    questions: [...metricQuestions, ...(customTextQuestion ? [customTextQuestion] : []), ...customQuestions, ...aiQuestions],
  };
}
