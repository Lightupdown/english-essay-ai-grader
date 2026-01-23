import api from './api';
import { Essay } from '../types';

export interface ProcessResponse {
  essayId: string;
  score: number;
  feedback: any;
  extractedText: string;
}

export const processEssay = async (imageBase64: string): Promise<ProcessResponse> => {
  const response = await api.post('/essay/process', { imageBase64 });
  return response.data;
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
