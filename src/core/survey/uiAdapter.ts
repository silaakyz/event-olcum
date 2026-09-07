import type { SurveyQuestion, SurveySchema } from '../surveys/schemaEngine';

export type UISurveyQuestion = {
  id: string;
  component: string;
  props: Record<string, unknown>;
};

export type UISurveySchema = {
  title: string;
  questions: UISurveyQuestion[];
};

function toUIQuestion(question: SurveyQuestion): UISurveyQuestion {
  if (question.type === 'calculated') {
    return {
      id: question.id,
      component: 'calculated',
      props: { label: question.uiSchema.label, readOnly: true, text: question.text },
    };
  }

  const component = question.type === 'scale'
    ? 'slider'
    : question.type === 'choice'
      ? 'radio'
      : 'input';

  return {
    id: question.id,
    component,
    props: {
      label: question.uiSchema.label,
      ...(question.uiSchema.min !== undefined ? { min: question.uiSchema.min } : {}),
      ...(question.uiSchema.max !== undefined ? { max: question.uiSchema.max } : {}),
      ...(question.uiSchema.step !== undefined ? { step: question.uiSchema.step } : {}),
      ...(question.uiSchema.options ? { options: question.uiSchema.options } : {}),
      text: question.text,
    },
  };
}

export function toUISurveySchema(schema: SurveySchema): UISurveySchema {
  return {
    title: schema.title,
    questions: schema.questions.map(toUIQuestion),
  };
}