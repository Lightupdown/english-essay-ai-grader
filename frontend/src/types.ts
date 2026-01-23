// 用户类型
export interface User {
  id: string;
  email: string;
  name?: string;
}

// 作文类型
export interface Essay {
  _id: string;
  userId: string;
  imageBase64: string;
  extractedText: string;
  score: number;
  feedback: Feedback;
  createdAt: string;
  updatedAt: string;
}

// 反馈类型
export interface Feedback {
  grammar: { score: number; feedback: string };
  vocabulary: { score: number; feedback: string };
  coherence: { score: number; feedback: string };
  content: { score: number; feedback: string };
  commentary: string;
}

// API 响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}
