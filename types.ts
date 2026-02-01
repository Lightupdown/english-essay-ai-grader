
export enum IssueType {
  Tense = 'tense',
  Punctuation = 'punctuation',
  Grammar = 'grammar',
  Spelling = 'spelling'
}

export type FeedbackType = 'error' | 'improvement' | 'highlight';

// 年级程度类型
export type GradeLevel = 
  | 'primary'      // 小学英语
  | 'junior'       // 初中英语
  | 'senior'       // 高中英语
  | 'cet4'         // 大学四级
  | 'cet6'         // 大学六级
  | 'postgraduate' // 研究生英语
  | 'other';       // 其他水平

// 年级配置
export interface GradeConfig {
  value: GradeLevel;
  label: string;
  description: string;
  scoreRange: { min: number; max: number };
  focus: string[];
  criteria: string;
}

// 年级配置常量
export const GRADE_CONFIGS: Record<GradeLevel, GradeConfig> = {
  primary: {
    value: 'primary',
    label: '小学英语',
    description: '基础语法、简单词汇',
    scoreRange: { min: 60, max: 100 },
    focus: ['基础拼写', '简单句型', '基本时态'],
    criteria: '注重基础语法、简单词汇、句子完整性'
  },
  junior: {
    value: 'junior',
    label: '初中英语',
    description: '复合句、段落结构',
    scoreRange: { min: 60, max: 100 },
    focus: ['复合句', '时态运用', '段落结构'],
    criteria: '注重句型多样性、逻辑连接、词汇丰富度'
  },
  senior: {
    value: 'senior',
    label: '高中英语',
    description: '复杂句型、高级词汇',
    scoreRange: { min: 60, max: 100 },
    focus: ['复杂句型', '高级词汇', '论证能力'],
    criteria: '注重学术表达、逻辑严密、语言地道'
  },
  cet4: {
    value: 'cet4',
    label: '大学四级',
    description: '段落连贯、学术词汇',
    scoreRange: { min: 60, max: 100 },
    focus: ['段落连贯', '学术词汇', '论证清晰'],
    criteria: '注重结构完整、表达准确、逻辑清晰'
  },
  cet6: {
    value: 'cet6',
    label: '大学六级',
    description: '复杂论证、批判思维',
    scoreRange: { min: 60, max: 100 },
    focus: ['复杂论证', '学术表达', '批判思维'],
    criteria: '注重深度分析、语言精炼、观点鲜明'
  },
  postgraduate: {
    value: 'postgraduate',
    label: '研究生英语',
    description: '学术写作、专业表达',
    scoreRange: { min: 60, max: 100 },
    focus: ['学术写作', '批判分析', '专业表达'],
    criteria: '注重学术规范、逻辑严密、创新性'
  },
  other: {
    value: 'other',
    label: '其他水平',
    description: '自定义水平',
    scoreRange: { min: 60, max: 100 },
    focus: ['综合英语能力'],
    criteria: '注重语言准确性、表达流畅性、内容完整性'
  }
};

export interface FeedbackItem {
  type: FeedbackType;
  category: string;
  segment: string;
  explanation: string;
  suggestion?: string;
}

export interface AnalyzeResult {
  essayId: string;
  gradeLevel: GradeLevel;
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
  gradeLevel?: GradeLevel;
  result?: AnalyzeResult;
  rawText?: string;
  isTrial?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Essay {
  _id: string;
  userId: string;
  imageBase64: string;
  extractedText: string;
  gradeLevel: GradeLevel;
  score: number;
  feedback: any;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// 同题对比生成模式
export type ComparisonMode = 'polish' | 'rewrite';

// 难度调节
export type DifficultyAdjustment = 'same' | 'higher' | 'lower';

// 写作风格
export type WritingStyle = 'academic' | 'narrative' | 'argumentative';

// 同题对比配置
export interface ComparisonConfig {
  topic: string;                    // 作文题目
  mode: ComparisonMode;             // 生成模式
  difficulty: DifficultyAdjustment; // 难度调节
  style: WritingStyle;              // 写作风格
  originalText: string;             // 原文
  gradeLevel: GradeLevel;           // 当前年级
  essayId?: string;                 // 关联的作文ID（可选）
}

// 推荐词汇项
export interface VocabularyItem {
  word: string;                     // 英文单词
  translation: string;              // 中文翻译（简明准确）
  partOfSpeech: string;             // 词性（n. v. adj. adv. 等）
  context?: string;                 // 使用语境/例句（可选）
}

// 推荐句型项
export interface StructureItem {
  structure: string;                // 英文句型
  translation: string;              // 中文翻译
  usage?: string;                   // 使用场景说明（可选）
}

// 范文结果
export interface ModelEssay {
  text: string;                     // 范文内容（英文）
  translation: string;              // 范文中文翻译
  highlights: string[];             // 亮点说明
  improvements: string[];           // 相比原文的改进点
  vocabulary: VocabularyItem[];     // 推荐词汇（带翻译和词性）
  structures: StructureItem[];      // 推荐句型（带翻译）
}

// 同题对比记录
export interface ComparisonRecord {
  id: string;
  essayId: string;                  // 关联的原作文ID
  config: ComparisonConfig;
  modelEssay: ModelEssay;
  createdAt: number;
  studentId?: string;               // 学生ID（可选）
}
