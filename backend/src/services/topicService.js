const axios = require('axios');

const API_URL = 'https://api.deepseek.com/chat/completions';

/**
 * 从作文内容预测题目
 * @param {string} essayText - 作文原文
 * @returns {Promise<string>} - 预测的题目
 */
const predictTopic = async (essayText) => {
  try {
    const prompt = `请根据以下英语作文内容，预测这道作文题的题目要求是什么。

作文内容：
${essayText}

要求：
1. 只输出题目要求本身（如：Write about your favorite season）
2. 不要输出任何解释或分析
3. 如果无法确定，输出 "Unknown Topic"
4. 用英文输出题目`;

    const response = await axios.post(
      API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个英语作文题目预测专家。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const topic = response.data.choices?.[0]?.message?.content?.trim() || 'Unknown Topic';
    return topic;
  } catch (error) {
    console.error('题目预测失败:', error);
    throw new Error('题目预测失败，请手动输入');
  }
};

module.exports = { predictTopic };
