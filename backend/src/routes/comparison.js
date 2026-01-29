const express = require('express');
const router = express.Router();
const { predictTopic } = require('../services/topicService');
const { generateModelEssay } = require('../services/modelEssayService');
const Comparison = require('../models/Comparison');

// 预测题目
router.post('/predict-topic', async (req, res) => {
  try {
    const { essayText } = req.body;

    if (!essayText || essayText.trim().length === 0) {
      return res.status(400).json({ error: '作文内容不能为空' });
    }

    const topic = await predictTopic(essayText);
    
    res.json({ 
      success: true, 
      data: { topic } 
    });
  } catch (error) {
    console.error('预测题目失败:', error);
    res.status(500).json({ error: error.message || '预测题目失败' });
  }
});

// 生成范文
router.post('/generate', async (req, res) => {
  try {
    const { config, studentId } = req.body;

    if (!config || !config.topic || !config.originalText || !config.gradeLevel) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 生成范文
    const modelEssay = await generateModelEssay(config);

    // 保存到数据库
    const comparison = new Comparison({
      essayId: config.essayId,
      studentId: studentId || null,
      config,
      modelEssay,
      createdAt: new Date()
    });
    await comparison.save();

    res.json({
      success: true,
      data: {
        comparisonId: comparison._id,
        config,
        modelEssay
      }
    });
  } catch (error) {
    console.error('生成范文失败:', error);
    res.status(500).json({ error: error.message || '生成范文失败' });
  }
});

// 获取对比记录列表
router.get('/history', async (req, res) => {
  try {
    const { studentId, essayId } = req.query;
    
    const query = {};
    if (studentId) query.studentId = studentId;
    if (essayId) query.essayId = essayId;

    const comparisons = await Comparison.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ 
      success: true, 
      data: { comparisons } 
    });
  } catch (error) {
    console.error('获取对比历史失败:', error);
    res.status(500).json({ error: '获取对比历史失败' });
  }
});

// 获取单条对比记录
router.get('/:id', async (req, res) => {
  try {
    const comparison = await Comparison.findById(req.params.id);
    
    if (!comparison) {
      return res.status(404).json({ error: '对比记录不存在' });
    }

    res.json({ 
      success: true, 
      data: { comparison } 
    });
  } catch (error) {
    console.error('获取对比记录失败:', error);
    res.status(500).json({ error: '获取对比记录失败' });
  }
});

module.exports = router;
