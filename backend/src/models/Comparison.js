const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({
  essayId: {
    type: String,
    required: true,
    index: true
  },
  studentId: {
    type: String,
    required: false,
    index: true
  },
  config: {
    topic: { type: String, required: true },
    mode: { type: String, enum: ['polish', 'rewrite'], required: true },
    difficulty: { type: String, enum: ['same', 'higher', 'lower'], required: true },
    style: { type: String, enum: ['academic', 'narrative', 'argumentative'], required: true },
    originalText: { type: String, required: true },
    gradeLevel: { type: String, required: true }
  },
  modelEssay: {
    text: { type: String, required: true },
    translation: { type: String, default: '' },
    highlights: [{ type: String }],
    improvements: [{ type: String }],
    vocabulary: [{
      word: { type: String, required: true },
      translation: { type: String, required: true },
      partOfSpeech: { type: String, required: true },
      context: { type: String }
    }],
    structures: [{
      structure: { type: String, required: true },
      translation: { type: String, required: true },
      usage: { type: String }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// 复合索引
comparisonSchema.index({ studentId: 1, createdAt: -1 });
comparisonSchema.index({ essayId: 1, createdAt: -1 });

module.exports = mongoose.model('Comparison', comparisonSchema);
