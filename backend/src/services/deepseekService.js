const axios = require('axios');
const { GRADE_PROMPTS } = require('../config/grades');

const API_URL = 'https://api.deepseek.com/chat/completions';

// 使用普通chat模式以提高响应速度
const USE_REASONING_MODEL = false; // false = 使用快速模式，true = 使用深度思考模式（较慢）

const extractJSON = (str) => {
  let cleanedStr = str;
  
  console.log('原始响应长度:', cleanedStr.length);
  console.log('原始响应前200字符:', cleanedStr.substring(0, 200));
  
  // 移除代码块标记
  cleanedStr = cleanedStr.replace(/^```json\s*/i, '');
  cleanedStr = cleanedStr.replace(/^```\s*/i, '');
  cleanedStr = cleanedStr.replace(/\s*```$/g, '');
  
  // 如果是深度思考模式，可能包含思考过程，移除思考部分
  // 寻找 JSON 开始标记（第一个 {）
  const firstBraceIdx = cleanedStr.indexOf('{');
  if (firstBraceIdx === -1) {
    throw new Error('未找到JSON起始标记 {');
  }
  
  // 移除 JSON 之前的文本（可能是思考过程）
  if (firstBraceIdx > 0) {
    console.log('JSON之前的内容:', cleanedStr.substring(0, firstBraceIdx));
    cleanedStr = cleanedStr.substring(firstBraceIdx);
  }
  
  // 尝试直接解析（如果已经是纯JSON）
  try {
    const directParse = JSON.parse(cleanedStr);
    console.log('直接解析成功');
    return cleanedStr;
  } catch (e) {
    console.log('直接解析失败，使用括号匹配:', e.message);
  }
  
  let braceCount = 0;
  let startIdx = 0;
  
  let jsonStr = '';
  let inString = false;
  let escapeNext = false;

  console.log('开始括号匹配提取，字符串长度:', cleanedStr.length);

  for (let i = startIdx; i < cleanedStr.length; i++) {
    const char = cleanedStr[i];
    
    if (escapeNext) {
      escapeNext = false;
      jsonStr += char;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      jsonStr += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      jsonStr += char;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    jsonStr += char;

    if (braceCount === 0 && jsonStr.trim().length > 0) {
      jsonStr = jsonStr.trim();
      jsonStr = jsonStr.replace(/\s*```[\s`]*$/g, '');
      
      console.log('JSON提取完成，结束位置:', i);
      console.log('提取的JSON长度:', jsonStr.length);
      console.log('JSON最后10字符:', jsonStr.slice(-10));
      return jsonStr;
    }
  }

  console.log('JSON提取失败，最后braceCount:', braceCount);
  console.log('当前jsonStr长度:', jsonStr.length);
  console.log('jsonStr最后200字符:', jsonStr.slice(-200));
  console.log('原始字符串最后200字符:', cleanedStr.slice(-200));

  throw new Error('JSON解析失败：括号不匹配');
};

const processFeedback = (f, index) => {
  if (!f) return null;

  const type = f.type || f.category || 'improvement';
  const explanation = f.explanation || "";
  const suggestion = f.suggestion || "";

  let segment = f.segment || "";
  
  if (!segment && explanation) {
    const match = explanation.match(/["']([^"']+)["']/);
    if (match) {
      segment = match[1];
    }
  }

  if (!segment) {
    segment = `Error ${index + 1}`;
  }

  return {
    type: ['error', 'improvement', 'highlight'].includes(type) ? type : 'improvement',
    category: f.category || type,
    segment,
    explanation,
    suggestion
  };
};

const analyzeText = async (text, essayId, gradeLevel) => {
  try {
    console.log(`开始DeepSeek文本分析（年级：${gradeLevel}）...`);
    
    // 获取年级配置
    const gradeConfig = GRADE_PROMPTS[gradeLevel];
    if (!gradeConfig) {
      throw new Error(`无效的年级程度: ${gradeLevel}`);
    }

    // 构建年级特定的系统提示词（优化版本，提高响应速度）
    const systemPrompt = `你是一位资深英语教师，正在批改${gradeConfig.name}学生的英语作文。

**评分标准（${gradeConfig.name}）：**
${gradeConfig.criteria}

**评分（100分制）：**
- totalScore: 总分
- grammarScore: 语法得分（0-100）
- vocabScore: 词汇得分（0-100）

**反馈类型：**
1. error - 语法错误（必须修正）
2. improvement - 改进建议（可以优化）
3. highlight - 亮点（值得表扬）

**输出JSON格式：**
{
  "totalScore": 数字,
  "grammarScore": 数字,
  "vocabScore": 数字,
  "commentary": "中文总评（50-100字）",
  "feedbacks": [
    {
      "type": "error/improvement/highlight",
      "category": "错误类型",
      "segment": "原文片段（精确匹配）",
      "explanation": "中文解释\\nEnglish explanation",
      "suggestion": "中文建议\\nEnglish suggestion"
    }
  ]
}

**重要：**
1. segment必须精确匹配原文
2. explanation和suggestion必须使用中英文双语（中文在前，英文在后，用换行分隔）
3. 只输出JSON，不要其他内容`;


    const response = await axios.post(
      API_URL,
      {
        model: USE_REASONING_MODEL ? 'deepseek-reasoner' : 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `【待批改原文】\n${text}`
          }
        ],
        temperature: 0.5,
        max_tokens: 8192,
        response_format: {
          type: 'json_object'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    console.log('DeepSeek API 返回原始数据:', response.data);
    const content = response.data.choices?.[0]?.message?.content || '{}';
    
    console.log('解析后的内容 (前500字符):', content.substring(0, 500));
    console.log('内容总长度:', content.length);

    let data;
    let jsonString;
    try {
      jsonString = extractJSON(content);
      console.log('提取的JSON字符串:', jsonString.substring(0, 300));
      console.log('JSON最后50字符:', jsonString.slice(-50));
      console.log('JSON总长度:', jsonString.length);
      // 找到错误位置附近的内容
      const errorPos = 6189;
      if (jsonString.length > errorPos) {
        console.log('错误位置附近内容 (6150-6250):', jsonString.substring(6150, 6250));
      }
      data = JSON.parse(jsonString);
    } catch (e) {
      console.error('JSON解析错误:', e);
      console.error('尝试解析的内容:', content);
      console.error('内容长度:', content.length);
      console.error('完整内容预览:', content.substring(0, 2000));
      if (jsonString) {
        console.error('完整JSON预览:', jsonString.substring(0, 3000));
        console.error('JSON最后500字符:', jsonString.slice(-500));
      }
      throw new Error(`JSON解析失败: ${e.message}`);
    }

    const rawText = text || data.rawText || data.originalText || '';
    const feedbacksRaw = data.feedbacks || data.feedback || [];

    const processedFeedbacks = feedbacksRaw
      .map((f, i) => processFeedback(f, i))
      .filter(f => f !== null && f.segment && f.explanation);

    const analyzedData = {
      essayId,
      gradeLevel,
      totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0,
      grammarScore: typeof data.grammarScore === 'number' ? data.grammarScore : 0,
      vocabScore: typeof data.vocabScore === 'number' ? data.vocabScore : 0,
      feedbacks: processedFeedbacks,
      rawText,
      commentary: data.commentary || ''
    };

    console.log('最终解析数据:', analyzedData);
    console.log('原始文本长度:', rawText.length);
    console.log('处理后的反馈数量:', processedFeedbacks.length);

    if (!analyzedData.rawText || analyzedData.feedbacks.length === 0) {
      throw new Error('DeepSeek API 返回的数据格式不正确，缺少必要的文本或反馈信息');
    }

    return analyzedData;
  } catch (error) {
    if (error.response) {
      console.error('DeepSeek API 调用失败:', error.response.status, error.response.data);
      throw new Error(`分析请求失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('DeepSeek API 请求超时:', error.message);
      throw new Error('分析超时，请检查网络后重试');
    } else {
      console.error('DeepSeek 分析失败:', error.message);
      throw error;
    }
  }
};

module.exports = { analyzeText };
