import api from './api';
import { ComparisonConfig, ModelEssay, ComparisonRecord } from '../types';

export interface PredictTopicResponse {
  topic: string;
}

export interface GenerateModelEssayResponse {
  comparisonId: string;
  config: ComparisonConfig;
  modelEssay: ModelEssay;
}

export interface ComparisonHistoryResponse {
  comparisons: ComparisonRecord[];
}

/**
 * 预测作文题目
 */
export const predictTopic = async (essayText: string): Promise<PredictTopicResponse> => {
  const response = await api.post('/comparison/predict-topic', { essayText });
  return response.data.data;
};

/**
 * 生成范文
 */
export const generateModelEssay = async (
  config: ComparisonConfig,
  studentId?: string
): Promise<GenerateModelEssayResponse> => {
  const response = await api.post('/comparison/generate', { config, studentId });
  return response.data.data;
};

/**
 * 获取对比历史
 */
export const getComparisonHistory = async (
  studentId?: string,
  essayId?: string
): Promise<ComparisonHistoryResponse> => {
  const params: Record<string, string> = {};
  if (studentId) params.studentId = studentId;
  if (essayId) params.essayId = essayId;
  
  const response = await api.get('/comparison/history', { params });
  return response.data.data;
};

/**
 * 获取单条对比记录
 */
export const getComparisonById = async (id: string): Promise<ComparisonRecord> => {
  const response = await api.get(`/comparison/${id}`);
  return response.data.data.comparison;
};
