const axios = require('axios');
const { GRADE_PROMPTS } = require('../config/grades');

const API_URL = 'https://api.deepseek.com/chat/completions';

/**
 * 生成范文
 * @param {Object} config - 配置对象
 * @param {string} config.topic - 作文题目
 * @param {string} config.mode - 生成模式 (polish/rewrite)
 * @param {string} config.difficulty - 难度调节 (same/higher/lower)
 * @param {string} config.style - 写作风格
 * @param {string} config.originalText - 原文
 * @param {string} config.gradeLevel - 年级水平
 * @returns {Promise<Object>} - 范文结果
 */
const generateModelEssay = async (config) => {
  try {
    const { topic, mode, difficulty, style, originalText, gradeLevel } = config;
    
    // 获取年级配置
    const gradeConfig = GRADE_PROMPTS[gradeLevel];
    if (!gradeConfig) {
      throw new Error(`无效的年级程度: ${gradeLevel}`);
    }

    // 构建难度提示
    let difficultyPrompt = '';
    switch (difficulty) {
      case 'higher':
        difficultyPrompt = '比当前水平高一个档次，使用更高级的词汇和复杂句型';
        break;
      case 'lower':
        difficultyPrompt = '比当前水平低一个档次，使用更基础的词汇和简单句型';
        break;
      default:
        difficultyPrompt = `保持${gradeConfig.name}水平`;
    }

    // 构建模式提示
    const modePrompt = mode === 'polish' 
      ? `基于以下原文进行润色改进，保留原文的核心内容和观点，但提升语言表达：\n\n原文：\n${originalText}`
      : '完全重新写一篇新的范文，不参考原文内容，只根据题目要求独立创作';

    // 构建风格提示
    const styleMap = {
      academic: '学术风格：正式、客观、使用学术词汇',
      narrative: '叙事风格：生动、有画面感、情感丰富',
      argumentative: '议论风格：逻辑严密、论据充分、说服力强'
    };

    const prompt = `你是一位资深英语教师和翻译专家。请根据以下要求生成一篇高质量英语范文，并提供精准的中文翻译、词汇解析和句式学习材料。

题目：${topic}

目标水平：${difficultyPrompt}

写作风格：${styleMap[style]}

生成模式：${modePrompt}

要求：
1. 字数与原文相当或略多，结构完整，段落清晰
2. 符合目标水平的语言要求，词汇丰富，句式多样
3. 内容切题，逻辑连贯，表达地道
4. 生成完毕后，请提供一份优秀的中文译文，语言流畅自然
5. 从范文中挑选5-8个核心高级词汇，提供词性和中文释义
6. 从范文中提炼3-5个重点句型，提供中文翻译

输出格式（JSON）：
{
  "text": "范文全文（纯英文，注意分段）",
  "translation": "范文全文的中文翻译（语言流畅自然，保持原文风格和结构，注意分段对应）",
  "highlights": ["范文亮点1（如：用词精准、逻辑清晰）", "范文亮点2", "范文亮点3"],
  "improvements": ["相比原文的改进点1", "改进点2"],
  "vocabulary": [
    {"word": "英文单词1", "translation": "中文释义", "partOfSpeech": "词性（如：n./v./adj./adv./phr.）", "context": "在范文中的使用语境"},
    {"word": "英文单词2", "translation": "中文释义", "partOfSpeech": "词性", "context": "使用语境"}
  ],
  "structures": [
    {"structure": "英文句型1", "translation": "中文翻译", "usage": "使用场景说明"},
    {"structure": "英文句型2", "translation": "中文翻译", "usage": "使用场景说明"}
  ]
}

重要说明：
- 中文翻译要地道流畅，符合中文表达习惯
- 词汇释义要准确简明，适合学生记忆
- 词性标注使用标准缩写：n.(名词) v.(动词) adj.(形容词) adv.(副词) phr.(短语) prep.(介词) conj.(连词)
- 所有中文内容都要用中文输出`;

    const systemPrompt = `你是一位资深英语教师和翻译专家，精通中英双语教学。你的任务是：
1. 根据题目和要求生成高质量的英语范文
2. 提供准确、流畅、地道的中文翻译
3. 从范文中提炼核心词汇，标注词性和释义
4. 总结重点句型，提供中文翻译和使用说明

翻译原则：
- 准确传达原文意思，不增不减
- 语言流畅自然，符合中文表达习惯
- 保持原文的风格和语气
- 适当进行意译，确保可读性

词汇解析原则：
- 选择范文中的核心、高级词汇
- 提供简明准确的中文释义
- 标准标注词性
- 给出使用语境帮助学生理解

请确保输出的JSON格式正确，所有字段完整。`;

    const response = await axios.post(
      API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
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

    const content = response.data.choices?.[0]?.message?.content || '{}';
    console.log('DeepSeek API raw response:', content);
    
    let data;
    try {
      data = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error('AI返回数据格式错误');
    }

    console.log('Parsed data:', data);

    // 确保vocabulary和structures是数组
    const vocabulary = Array.isArray(data.vocabulary) ? data.vocabulary : [];
    const structures = Array.isArray(data.structures) ? data.structures : [];

    // 验证vocabulary项的格式
    const validVocabulary = vocabulary.filter(item => {
      const isValid = item && typeof item === 'object' && item.word && item.translation && item.partOfSpeech;
      if (!isValid) {
        console.warn('Invalid vocabulary item:', item);
      }
      return isValid;
    });

    // 验证structures项的格式
    const validStructures = structures.filter(item => {
      const isValid = item && typeof item === 'object' && item.structure && item.translation;
      if (!isValid) {
        console.warn('Invalid structure item:', item);
      }
      return isValid;
    });

    return {
      text: data.text || '',
      translation: data.translation || '',
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
      improvements: Array.isArray(data.improvements) ? data.improvements : [],
      vocabulary: validVocabulary,
      structures: validStructures
    };
  } catch (error) {
    console.error('范文生成失败:', error);
    throw error;
  }
};

module.exports = { generateModelEssay };
