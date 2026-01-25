const axios = require('axios');

const API_URL = 'https://api.deepseek.com/chat/completions';

// 深度思考模式更适合作文批改分析
const USE_REASONING_MODEL = true; // 设置为 true 使用深度思考模式

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

const analyzeText = async (text, essayId) => {
  try {
    console.log('开始DeepSeek文本分析...');

    const response = await axios.post(
      API_URL,
      {
        model: USE_REASONING_MODEL ? 'deepseek-reasoner' : 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位拥有20年教学经验的资深英语名师及雅思/托福资深阅卷官。你擅长以严谨不失鼓励的方式，通过深度解析帮助学生提升写作水平。

请对英语作文进行全方位的专业批改与诊断。

# Assessment Rubric (评分标准)
请基于以下维度给出 0-100 的整数评分：
1. totalScore: 综合表现（逻辑连贯性、任务完成度、语言多样性）。
2. grammarScore: 语法准确性（时态、语序、主谓一致、从句运用）。
3. vocabScore: 词汇丰富度（用词精准度、同义替换、搭配地道程度）。

# Feedback Categories (反馈类别)
请识别并提取 **8-12 个反馈项，【必须包含以下三类】**：
- "error": 至少 2-3 个（严重的语法陷阱、拼写错误或中式英语表达）。
- "improvement": 3-5 个（逻辑生硬处的润色，或将"平庸词汇"升级为"高阶地道表达"）。
- "highlight": 至少 2-3 个（展现高级句式如倒装、虚拟语气，或词汇精准运用的闪光点）。

# Data Structure Requirements (数据结构要求)
每个反馈对象必须严格包含：
1. segment: 原文中的字符串片段（**优先完全一致，保留标点、空格、大小写**）。
   【匹配优先级】：
   - 首选：原文中完全一致的片段（包括标点、空格、大小写）
   - 次选：最接近的表达（相似度≥90%，允许±2个字符差异）
   - 禁止：擅自修正、缩减、改写或添加原文中没有的内容
   - 原因：考虑OCR识别误差，允许细微差异，但explanation和suggestion仍应准确对应原文位置
2. type: 仅限 "error" | "improvement" | "highlight"。
3. category: 简练的分类（如：时态错误、非谓语动词、词汇升级、逻辑连接）。
4. explanation: 【深度双语解析】。先用中文解释逻辑错误/升级理由，再用英文提供学术背景或地道用法说明。
5. suggestion: 针对性的修正方案或推荐的高阶例句。

# Golden Rules (硬性约束)
1. 【Segment精确匹配】：segment 字段必须是 rawText 中**完全一致**的子字符串
   - 包括换行符（\\n）、标点符号、大小写、空格
   - 绝对不要添加、删除或修改原文的任何字符
   - **换行符处理规则**：
     - 如果原文某处有换行符（如标题换行、段落分隔），segment 必须保留该换行符
     - 如果原文没有换行符，segment 绝对不能添加换行符
     - 绝对不要为了"格式化"或"美观"而调整原文的换行结构
   - **正确示例**：
     - 原文: "How\\ndo I look like?" → segment: "How\\ndo I look like?" ✓
     - 原文: "I like\\nart class" → segment: "I like\\nart class" ✓
   - **错误示例**：
     - 原文: "How\\ndo I look like?" → segment: "How do I look like?" ✗
     - 原文: "I like art class" → segment: "I like\\nart class" ✗
2. 【深度解析】：禁止简单的"这里错了"。必须说明"为什么错"以及"改后如何提升了语感或正式度"。
3. 【JSON 纯净性】：只输出合法的 JSON 字符串。严禁包含 JSON 代码块标记、严禁任何前言或后缀说明文字。
4. 【逻辑一致】：rawText 字段必须完整保留用户输入的原始文本。
5. 【输出控制】：使用 balanced 的创造性，确保包含三类反馈。
6. 【个性化点评】：commentary 字段必须根据作文的具体表现给出个性化的专家点评，不要使用模板化的通用评价。

# Output Format (JSON Schema)
{
  "totalScore": number,
  "grammarScore": number,
  "vocabScore": number,
  "rawText": "string",
  "commentary": "string",
  "feedbacks": [
    {
      "segment": "string",
      "type": "string",
      "category": "string",
      "explanation": "string",
      "suggestion": "string"
    }
  ]
}

# Commentary Requirements (专家点评要求)
commentary 字段应该是一段**个性化的专家点评**（50-100字），要求：
- 针对这篇作文的具体优点和不足进行点评
- 结合totalScore给出符合实际的评价
- 语言要鼓励性强，同时指出改进方向
- 提及作文中的1-2个具体亮点或问题

【重要提醒】
1. segment尽量与原文一致，保留标点符号和大小写
2. 绝对不要使用代码块标记，直接输出纯JSON字符串
3. 只返回JSON，不要任何其他内容
4. 确保JSON格式正确有效
5. 优先标注明显的语法和拼写错误为error类型
6. 识别并标注表达地道的地方为highlight类型
7. commentary必须是中文，50-100字，个性化点评`
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
