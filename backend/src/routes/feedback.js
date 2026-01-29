const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// 创建邮件发送器
const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'zx1411239060@163.com',
    pass: process.env.EMAIL_PASS || 'your-email-password', // 需要在.env中配置
  },
});

// 存储反馈（内存存储，重启后清空）
let dailyFeedbacks = [];
let lastEmailDate = null;

// 检查是否需要发送邮件（每天一次）
const checkAndSendEmail = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  if (lastEmailDate !== today && dailyFeedbacks.length > 0) {
    try {
      // 构建邮件内容
      const feedbackContent = dailyFeedbacks.map((feedback, index) => {
        return `
反馈 #${index + 1}
时间: ${new Date(feedback.timestamp).toLocaleString('zh-CN')}
内容: ${feedback.content || '无文字内容'}
${feedback.screenshot ? '包含截图: 是' : '包含截图: 否'}
浏览器: ${feedback.userAgent}
-------------------
`;
      }).join('\n');

      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'zx1411239060@163.com',
        to: 'zx1411239060@163.com',
        subject: `英语作文AI批改助手 - ${today} 用户反馈汇总`,
        text: `今日共收到 ${dailyFeedbacks.length} 条用户反馈：\n\n${feedbackContent}`,
        html: `
          <h2>英语作文AI批改助手 - 每日反馈汇总</h2>
          <p>日期: ${today}</p>
          <p>共收到 <strong>${dailyFeedbacks.length}</strong> 条反馈</p>
          <hr>
          ${dailyFeedbacks.map((feedback, index) => `
            <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
              <h3>反馈 #${index + 1}</h3>
              <p><strong>时间:</strong> ${new Date(feedback.timestamp).toLocaleString('zh-CN')}</p>
              <p><strong>内容:</strong> ${feedback.content || '无文字内容'}</p>
              ${feedback.screenshot ? '<p><strong>截图:</strong> 已包含（见下方）</p>' : ''}
              <p><strong>浏览器:</strong> ${feedback.userAgent}</p>
              ${feedback.screenshot ? `<div style="margin-top: 10px;">
                <img src="${feedback.screenshot}" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" />
              </div>` : ''}
            </div>
          `).join('')}
        `,
      });

      console.log(`✅ 反馈邮件已发送: ${today}, 共 ${dailyFeedbacks.length} 条`);
      
      // 清空已发送的反馈
      dailyFeedbacks = [];
      lastEmailDate = today;
    } catch (error) {
      console.error('❌ 发送反馈邮件失败:', error);
    }
  }
};

// 每5分钟检查一次是否需要发送邮件
setInterval(checkAndSendEmail, 5 * 60 * 1000);

// 提交反馈
router.post('/', async (req, res) => {
  try {
    const { content, screenshot, timestamp, userAgent } = req.body;

    // 验证输入
    if (!content?.trim() && !screenshot) {
      return res.status(400).json({ error: '请填写反馈内容或上传截图' });
    }

    // 保存反馈
    const feedback = {
      id: Date.now().toString(),
      content: content?.trim() || '',
      screenshot: screenshot || null,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || 'Unknown',
      ip: req.ip || req.connection.remoteAddress,
    };

    dailyFeedbacks.push(feedback);

    console.log(`✅ 收到新反馈 #${dailyFeedbacks.length}:`, {
      hasContent: !!content?.trim(),
      hasScreenshot: !!screenshot,
      timestamp: feedback.timestamp,
    });

    // 立即尝试发送邮件（如果是新的一天）
    await checkAndSendEmail();

    res.json({ 
      success: true, 
      message: '反馈提交成功，感谢您的建议！',
      feedbackId: feedback.id 
    });
  } catch (error) {
    console.error('提交反馈失败:', error);
    res.status(500).json({ error: '提交失败，请稍后重试' });
  }
});

// 获取今日反馈数量（用于调试）
router.get('/count', (req, res) => {
  res.json({ 
    count: dailyFeedbacks.length,
    lastEmailDate,
    today: new Date().toISOString().split('T')[0]
  });
});

module.exports = router;
