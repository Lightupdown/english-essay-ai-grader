
export enum IssueType {
  Tense = 'tense',
  Punctuation = 'punctuation',
  Grammar = 'grammar',
  Spelling = 'spelling'
}

export type FeedbackType = 'error' | 'improvement' | 'highlight';

export interface FeedbackItem {
  type: FeedbackType;
  category: string;
  segment: string;
  explanation: string;
  suggestion?: string;
}

export interface AnalyzeResult {
  essayId: string;
  totalScore: number;
  grammarScore: number;
  vocabScore: number;
  feedbacks: FeedbackItem[];
  rawText: string;
  commentary: string;
}

export interface EssayRecord {
  id: string;
  imageName: string;
  imagePreviewUrl: string;
  createdAt: number;
  status: 'analyzed' | 'pending' | 'analyzing';
  result?: AnalyzeResult;
  rawText?: string;
}
