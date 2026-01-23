const rateLimit = require('express-rate-limit');

// 通用限流：15分钟内最多 100 次请求
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个 IP 最多 100 次请求
  message: { error: '请求过于频繁，请稍后再试' }
});

// 严格限流：15分钟内最多 10 次请求（用于敏感操作）
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '请求过于频繁，请稍后再试' }
});

module.exports = { generalLimiter, strictLimiter };
