export interface QuestionAnswer {
  text: string;
  userId: string;
  createdAt?: string;
}

export interface QuestionItem {
  _id: string;
  title: string;
  description?: string;
  pointId: string;
  answers: QuestionAnswer[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionPayload {
  title: string;
  description?: string;
  pointId: string;
}

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

export interface CreateAnswerPayload {
  text: string;
  userId: string;
}