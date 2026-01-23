const axios = require('axios');

const analyzeText = async (text) => {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位专业的英语作文评分专家。请根据以下标准对英文作文进行评分和反馈：

评分标准（总分100分）：
1. 语法 (Grammar) - 20分：时态、语态、句子结构、主谓一致等
2. 词汇 (Vocabulary) - 20分：词汇丰富度、准确性、恰当性
3. 连贯性 (Coherence) - 20分：段落结构、逻辑连接、过渡词使用
4. 内容 (Content) - 20分：观点清晰、论据充分、切题程度
5. 整体印象 (Overall) - 20分：语言流畅度、表达自然度

请以 JSON 格式返回结果，包含：
- score: 总分（0-100）
- feedback: 包含 grammar, vocabulary, coherence, content 四个部分的详细反馈
- commentary: 整体评价和建议

示例输出格式：
{
  "score": 85,
  "feedback": {
    "grammar": { "score": 18, "feedback": "..." },
    "vocabulary": { "score": 17, "feedback": "..." },
    "coherence": { "score": 18, "feedback": "..." },
    "content": { "score": 17, "feedback": "..." },
    "commentary": "..."
  }
}`
          },
          {
            role: 'user',
            content: text
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
        timeout: 60000
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('DeepSeek 分析失败:', error.message);
    throw new Error('文本分析失败，请稍后重试');
  }
};

module.exports = { analyzeText };
