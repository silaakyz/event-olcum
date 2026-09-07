'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCachedMetrics, setCachedMetrics } from '../metrics/cache';
import { calculateMetrics, type CalculatedMetrics } from '../metrics/calculate';
import type { SurveyResponse } from './response';
import { deleteSurvey, duplicateSurvey, getSurvey, listSurveys, saveSurvey, saveSurveyResponse, type StoredSurvey, type Survey } from './storage';
import type { SurveySchema } from '../../src/core/surveys/schemaEngine';

export type UseSurveyResult = {
  survey: Survey | null;
  schema: SurveySchema | null;
  response: SurveyResponse | null;
  metrics: CalculatedMetrics | null;
  loading: boolean;
  refresh: () => void;
  submitResponse: (response: SurveyResponse) => void;
  saveSchema: (name: string, schema: SurveySchema) => StoredSurvey;
  surveys: StoredSurvey[];
  deleteSurvey: (id: string) => void;
  duplicateSurvey: (id: string) => StoredSurvey | null;
};

export function useSurvey(surveyId?: string): UseSurveyResult {
  const [state, setState] = useState<Omit<UseSurveyResult, 'refresh' | 'submitResponse' | 'saveSchema' | 'deleteSurvey' | 'duplicateSurvey'>>({ survey: null, schema: null, response: null, metrics: null, loading: true, surveys: [] });

  const refresh = useCallback(() => {
    if (!surveyId) {
      setState({ survey: null, schema: null, response: null, metrics: null, loading: false, surveys: listSurveys() });
      return;
    }
    const survey = getSurvey(surveyId);
      const response = survey?.responses.length ? survey.responses[survey.responses.length - 1] : null;
      let metrics = survey ? getCachedMetrics(survey.id, survey.schema, survey.responses) : null;
      if (survey && !metrics) {
        metrics = calculateMetrics(survey.responses, survey.schema);
        setCachedMetrics(survey.id, survey.schema, survey.responses, metrics);
      }
      const hydratedSurvey = survey ? { ...survey, metrics } : null;
      setState({ survey: hydratedSurvey, schema: survey?.schema ?? null, response, metrics, loading: false, surveys: [] });
  }, [surveyId]);

  const submitResponse = useCallback((response: SurveyResponse) => {
    if (!surveyId) return;
    saveSurveyResponse(surveyId, response);
    refresh();
  }, [refresh, surveyId]);

  const saveSchema = useCallback((name: string, schema: SurveySchema) => {
    const saved = saveSurvey(name, schema, surveyId);
    refresh();
    return saved;
  }, [refresh, surveyId]);

  const removeSurvey = useCallback((id: string) => {
    deleteSurvey(id);
    refresh();
  }, [refresh]);

  const cloneSurvey = useCallback((id: string) => {
    const duplicate = duplicateSurvey(id);
    refresh();
    return duplicate;
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh, submitResponse, saveSchema, deleteSurvey: removeSurvey, duplicateSurvey: cloneSurvey };
}
