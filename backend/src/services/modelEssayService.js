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

    const prompt = `请根据以下要求生成一篇英语范文：

题目：${topic}

目标水平：${difficultyPrompt}

写作风格：${styleMap[style]}

生成模式：${modePrompt}

要求：
1. 字数与原文相当或略多
2. 符合目标水平的语言要求
3. 内容切题，结构完整
4. 输出JSON格式

输出格式：
{
  "text": "范文全文（纯英文）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "improvements": ["改进点1", "改进点2"],
  "vocabulary": ["推荐词汇1", "推荐词汇2", "推荐词汇3"],
  "structures": ["推荐句型1", "推荐句型2"]
}

注意：所有中文说明都要用中文输出。`;

    const response = await axios.post(
      API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位资深英语教师，擅长根据要求生成高质量的英语作文范文。'
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
    const data = JSON.parse(content);

    return {
      text: data.text || '',
      highlights: data.highlights || [],
      improvements: data.improvements || [],
      vocabulary: data.vocabulary || [],
      structures: data.structures || []
    };
  } catch (error) {
    console.error('范文生成失败:', error);
    throw new Error('范文生成失败，请稍后重试');
  }
};

module.exports = { generateModelEssay };
