const mongoose = require('mongoose');

const essaySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  imageBase64: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  gradeLevel: {
    type: String,
    enum: ['primary', 'junior', 'senior', 'cet4', 'cet6', 'postgraduate', 'other'],
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true
  },
  feedback: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 按创建时间降序索引
essaySchema.index({ userId: 1, createdAt: -1 });

// 按用户、年级、时间复合索引
essaySchema.index({ userId: 1, gradeLevel: 1, createdAt: -1 });

module.exports = mongoose.model('Essay', essaySchema);
