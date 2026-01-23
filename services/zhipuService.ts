import { AnalyzeResult } from "../types";

const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  if (import.meta.env.DEV) {
    console.log('开始OCR文字提取...');
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ZHIPU_API_KEY}`
    },
    body: JSON.stringify({
      model: "glm-4.6v",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            },
            {
              type: "text",
              text: "请仔细识别这张图片中的英文文字内容。\n\n要求：\n1. 只返回识别到的英文文字，不要添加任何解释、注释或说明\n2. 保持原文的段落结构和换行\n3. 准确识别每个单词，包括大小写和标点符号\n4. 如果遇到无法识别的单词，用[?]标记\n5. 如果图像模糊，尽力识别，不要编造内容\n\n直接输出识别结果，不要使用任何格式标记。"
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCR请求失败: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";

  if (import.meta.env.DEV) {
    console.log('OCR提取完成，文字长度:', content.length);
    console.log('OCR结果预览:', content.substring(0, 200));
  }

  return content.trim();
};
