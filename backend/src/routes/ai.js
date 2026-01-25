const express = require('express');
const router = express.Router();
const { extractTextFromImage } = require('../services/zhipuService');
const { analyzeText } = require('../services/deepseekService');

router.post('/ocr', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    const text = await extractTextFromImage(imageBase64);
    res.json({ text });
  } catch (error) {
    console.error('OCR路由错误:', error);
    res.status(500).json({ error: error.message || 'OCR识别失败' });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { text, essayId } = req.body;

    if (!text) {
      return res.status(400).json({ error: '缺少文本内容' });
    }

    if (!essayId) {
      return res.status(400).json({ error: '缺少作文ID' });
    }

    const result = await analyzeText(text, essayId);
    res.json(result);
  } catch (error) {
    console.error('分析路由错误:', error);
    res.status(500).json({ error: error.message || '文本分析失败' });
  }
});

module.exports = router;
