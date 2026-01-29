// 年级程度配置
const GRADE_PROMPTS = {
  primary: {
    name: '小学英语',
    focus: '基础语法、简单词汇、句子完整性',
    criteria: '注重基础拼写、简单句型、基本时态',
    languageLevel: '简单、清晰、易懂',
    scoreExpectation: '80-100分（基础扎实即可得高分）'
  },
  junior: {
    name: '初中英语',
    focus: '复合句、时态运用、段落结构',
    criteria: '注重句型多样性、逻辑连接、词汇丰富度',
    languageLevel: '中等难度、适当复杂',
    scoreExpectation: '75-95分（掌握复合句即可得高分）'
  },
  senior: {
    name: '高中英语',
    focus: '复杂句型、高级词汇、论证能力',
    criteria: '注重学术表达、逻辑严密、语言地道',
    languageLevel: '较高难度、学术化',
    scoreExpectation: '70-90分（运用高级表达即可得高分）'
  },
  cet4: {
    name: '大学四级',
    focus: '段落连贯、学术词汇、论证清晰',
    criteria: '注重结构完整、表达准确、逻辑清晰',
    languageLevel: '学术英语、规范表达',
    scoreExpectation: '65-85分（达到四级要求即可）'
  },
  cet6: {
    name: '大学六级',
    focus: '复杂论证、学术表达、批判思维',
    criteria: '注重深度分析、语言精炼、观点鲜明',
    languageLevel: '高级学术英语',
    scoreExpectation: '60-80分（达到六级要求即可）'
  },
  postgraduate: {
    name: '研究生英语',
    focus: '学术写作、批判分析、专业表达',
    criteria: '注重学术规范、逻辑严密、创新性',
    languageLevel: '专业学术英语',
    scoreExpectation: '60-75分（达到研究生要求即可）'
  },
  other: {
    name: '自定义水平',
    focus: '综合英语能力',
    criteria: '注重语言准确性、表达流畅性、内容完整性',
    languageLevel: '根据实际水平',
    scoreExpectation: '60-100分（根据实际水平评分）'
  }
};

// 年级验证函数
const validateGradeLevel = (gradeLevel) => {
  const validGrades = ['primary', 'junior', 'senior', 'cet4', 'cet6', 'postgraduate', 'other'];
  return validGrades.includes(gradeLevel);
};

module.exports = {
  GRADE_PROMPTS,
  validateGradeLevel
};
