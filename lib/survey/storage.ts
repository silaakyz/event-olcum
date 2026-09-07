import type { SurveySchema } from '../../src/core/surveys/schemaEngine';
import type { SurveyResponse } from './response';
import type { CalculatedMetrics } from '../metrics/calculate';
import { invalidateMetricsCache } from '../metrics/cache';

export type Survey = {
  id: string;
  name: string;
  schema: SurveySchema;
  responses: SurveyResponse[];
  metrics: CalculatedMetrics | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredSurvey = Omit<Survey, 'metrics'>;

export const SURVEYS_STORAGE_KEY = 'event-olcum:surveys';

function readSurveys(): StoredSurvey[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SURVEYS_STORAGE_KEY);
    const surveys = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(surveys)) return [];
    const normalized = surveys.map(normalizeSurvey).filter((survey): survey is StoredSurvey => survey !== null);
    if (JSON.stringify(surveys) !== JSON.stringify(normalized)) {
      try {
        window.localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(normalized));
      } catch {
        // Keep the normalized in-memory value usable when storage is read-only or full.
      }
    }
    return normalized;
  } catch {
    try {
      window.localStorage.removeItem(SURVEYS_STORAGE_KEY);
    } catch {
      // Storage access can be unavailable in private or restricted contexts.
    }
    return [];
  }
}

function normalizeSurvey(value: Partial<Survey>): StoredSurvey | null {
  const schema = normalizeSchema(value.schema);
  if (!value.id || !schema) return null;
  const createdAt = value.createdAt ?? new Date(0).toISOString();
  return {
    id: value.id ?? createId(),
    name: value.name ?? 'Untitled survey',
    schema,
    responses: Array.isArray(value.responses) ? value.responses.filter(isSurveyResponse) : [],
    createdAt,
    updatedAt: value.updatedAt ?? createdAt,
  };
}

function normalizeSchema(value: unknown): SurveySchema | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SurveySchema>;
  if (!Array.isArray(candidate.questions) || typeof candidate.title !== 'string') return null;
  if (candidate.schemaVersion !== undefined && candidate.schemaVersion !== 1) return null;
  if (candidate.goal !== 'event' && candidate.goal !== 'campaign' && candidate.goal !== 'sponsor') return null;
  const questions = candidate.questions.filter(isSurveyQuestion);
  if (questions.length !== candidate.questions.length) return null;
  return { schemaVersion: 1, title: candidate.title, goal: candidate.goal, questions };
}

function isSurveyQuestion(value: unknown): value is SurveySchema['questions'][number] {
  if (!value || typeof value !== 'object') return false;
  const question = value as SurveySchema['questions'][number];
  if (typeof question.id !== 'string' || typeof question.text !== 'string') return false;
  if (!['scale', 'text', 'choice', 'calculated'].includes(question.type)) return false;
  if (!question.uiSchema || typeof question.uiSchema !== 'object') return false;
  return ['slider', 'radio', 'input', 'calculated'].includes(question.uiSchema.component)
    && typeof question.uiSchema.label === 'string';
}

function isSurveyResponse(value: unknown): value is SurveyResponse {
  if (!value || typeof value !== 'object' || !Array.isArray((value as SurveyResponse).answers)) return false;
  return (value as SurveyResponse).answers.every((answer) => Boolean(answer) && typeof answer.questionId === 'string' && (typeof answer.value === 'string' || typeof answer.value === 'number'));
}

function writeSurveys(surveys: StoredSurvey[]): void {
  try {
    window.localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(surveys));
  } catch {
    // Persistence failures must not crash the UI.
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `survey-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listSurveys(): StoredSurvey[] {
  return readSurveys().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getSurvey(id: string): StoredSurvey | null {
  return readSurveys().find((survey) => survey.id === id) ?? null;
}

export function saveSurvey(name: string, schema: SurveySchema, id?: string): StoredSurvey {
  const surveys = readSurveys();
  const existing = id ? surveys.find((item) => item.id === id) : undefined;
  const now = new Date().toISOString();
  const survey: StoredSurvey = {
    id: id ?? createId(),
    name: name.trim() || 'Untitled survey',
    schema,
    responses: existing?.responses ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  writeSurveys([...surveys.filter((item) => item.id !== survey.id), survey]);
  invalidateMetricsCache(survey.id);
  return survey;
}

export function saveSurveyResponse(id: string, response: SurveyResponse): StoredSurvey | null {
  const surveys = readSurveys();
  const existing = surveys.find((survey) => survey.id === id);
  if (!existing) return null;
  const updated: StoredSurvey = { ...existing, responses: [...existing.responses, response], updatedAt: new Date().toISOString() };
  writeSurveys(surveys.map((survey) => survey.id === id ? updated : survey));
  invalidateMetricsCache(id);
  return updated;
}

export function deleteSurvey(id: string): void {
  writeSurveys(readSurveys().filter((survey) => survey.id !== id));
  invalidateMetricsCache(id);
  try {
    window.localStorage.removeItem(`event-olcum:response:${id}`);
  } catch {
    // Ignore unavailable storage during cleanup.
  }
}

export function duplicateSurvey(id: string): StoredSurvey | null {
  const source = getSurvey(id);
  if (!source) return null;
  return saveSurvey(`${source.name} copy`, source.schema);
}
