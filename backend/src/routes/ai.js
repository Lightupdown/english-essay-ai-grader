const express = require('express');
const router = express.Router();
const { extractTextFromImage } = require('../services/zhipuService');
const { analyzeText } = require('../services/deepseekService');
const { validateGradeLevel } = require('../config/grades');

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
    const { text, essayId, gradeLevel } = req.body;

    if (!text) {
      return res.status(400).json({ error: '缺少文本内容' });
    }

    if (!essayId) {
      return res.status(400).json({ error: '缺少作文ID' });
    }

    if (!gradeLevel) {
      return res.status(400).json({ error: '缺少年级程度' });
    }

    // 验证年级参数
    if (!validateGradeLevel(gradeLevel)) {
      return res.status(400).json({ 
        error: '无效的年级程度。有效值：primary, junior, senior, cet4, cet6, postgraduate, other' 
      });
    }

    const result = await analyzeText(text, essayId, gradeLevel);
    res.json(result);
  } catch (error) {
    console.error('分析路由错误:', error);
    res.status(500).json({ error: error.message || '文本分析失败' });
  }
});

module.exports = router;
