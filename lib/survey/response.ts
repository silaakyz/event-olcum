export type SurveyResponse = {
  answers: {
    questionId: string;
    value: number | string;
  }[];
};
