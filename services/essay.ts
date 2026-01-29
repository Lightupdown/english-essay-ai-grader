import api from './api';
import { Essay, GradeLevel } from '../types';

export interface ProcessResponse {
  essayId: string;
  gradeLevel: GradeLevel;
  score: number;
  feedback: any;
  extractedText: string;
}

export const processEssay = async (imageBase64: string, gradeLevel: GradeLevel): Promise<ProcessResponse> => {
  const response = await api.post('/essay/process', { imageBase64, gradeLevel });
  return response.data.data;
};

export const getHistory = async (): Promise<Essay[]> => {
  const response = await api.get('/essay/history');
  return response.data.essays;
};

export const getEssayById = async (id: string): Promise<Essay> => {
  const response = await api.get(`/essay/${id}`);
  return response.data.essay;
};

export type { Essay };
