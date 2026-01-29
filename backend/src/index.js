require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const essayRoutes = require('./routes/essay');
const aiRoutes = require('./routes/ai');
const feedbackRoutes = require('./routes/feedback');
const comparisonRoutes = require('./routes/comparison');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));  // 支持大 Base64 数据

// 设置服务器超时时间（3分钟）
app.timeout = 180000;

// 连接数据库
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/essay', essayRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/comparison', comparisonRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
