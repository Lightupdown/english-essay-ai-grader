const axios = require('axios');

const extractTextFromImage = async (imageBase64) => {
  try {
    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4.6v',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请提取图片中的所有英文文本，包括标题、正文、标点符号等。只返回提取的文本内容，不要添加任何解释或说明。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4096
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const text = response.data.choices[0].message.content;
    return text;
  } catch (error) {
    console.error('智谱AI OCR 调用失败:', error.message);
    throw new Error('OCR 识别失败，请检查图片质量或稍后重试');
  }
};

module.exports = { extractTextFromImage };
