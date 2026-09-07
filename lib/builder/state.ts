import type { SurveySchema } from '../../src/core/surveys/schemaEngine';
import type { CoreMetricId } from './coreMetrics';

export type BuilderQuestion = {
  id: string;
  text: string;
};

export type SurveyBuilderState = {
  selectedMetrics: CoreMetricId[];
  customQuestions: BuilderQuestion[];
  goal: 'event' | 'campaign' | 'sponsor';
  generatedSchema: SurveySchema;
};

export const EMPTY_BUILDER_STATE: Omit<SurveyBuilderState, 'generatedSchema'> = {
  selectedMetrics: ['NPS', 'CSAT'],
  customQuestions: [],
  goal: 'event',
};

export function createCustomQuestion(text = ''): BuilderQuestion {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
  };
}
