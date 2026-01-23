const express = require('express');
const auth = require('../middleware/auth');
const Essay = require('../models/Essay');
const zhipuService = require('../services/zhipuService');
const deepseekService = require('../services/deepseekService');

const router = express.Router();

// 处理作文（OCR + 分析）
router.post('/process', auth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const userId = req.user.id;

    // 验证输入
    if (!imageBase64) {
      return res.status(400).json({ error: '图片不能为空' });
    }

    // 验证 Base64 格式
    if (!imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: '无效的图片格式' });
    }

    // 1. 调用智谱AI OCR
    const text = await zhipuService.extractTextFromImage(imageBase64);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: '未能从图片中提取到文本，请检查图片质量' });
    }

    // 2. 调用 DeepSeek 分析
    const analysis = await deepseekService.analyzeText(text);

    // 3. 保存到数据库
    const essay = new Essay({
      userId,
      imageBase64,
      extractedText: text,
      score: analysis.score,
      feedback: analysis.feedback
    });
    await essay.save();

    res.json({
      essayId: essay._id,
      score: analysis.score,
      feedback: analysis.feedback,
      extractedText: text
    });
  } catch (error) {
    console.error('作文处理失败:', error);
    res.status(500).json({ error: '作文处理失败，请稍后重试' });
  }
});

// 获取历史记录
router.get('/history', auth, async (req, res) => {
  try {
    const essays = await Essay.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-imageBase64');  // 不返回 Base64，减少数据量

    res.json({ essays });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '获取历史失败' });
  }
});

// 获取单篇作文详情
router.get('/:id', auth, async (req, res) => {
  try {
    const essay = await Essay.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!essay) {
      return res.status(404).json({ error: '作文不存在' });
    }

    res.json({ essay });
  } catch (error) {
    console.error('获取作文失败:', error);
    res.status(500).json({ error: '获取作文失败' });
  }
});

module.exports = router;
