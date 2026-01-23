# English Essay AI Grader - 开发文档

## 📖 项目概述

### 项目名称
English Essay AI Grader（英语作文 AI 评分系统）

### 项目描述
一个基于 AI 技术的英语作文自动评分系统。用户上传作文图片，系统通过 OCR 提取文本，使用 AI 模型进行评分和反馈。

### 技术栈
- **前端**：React + TypeScript + Vite + Tailwind CSS
- **后端**：Node.js + Express + MongoDB
- **部署**：Vercel（前端）+ Railway（后端）
- **AI 服务**：智谱AI（OCR）+ DeepSeek（文本分析）

---

## 🏗️ 项目架构

### 整体架构图
```
用户 (浏览器)
    ↓ HTTP 请求
前端 (Vercel) - React + TypeScript
    ↓ API 调用
后端 (Railway) - Node.js + Express
    ↓ 数据库操作
MongoDB (Railway) - 用户/作文数据
    ↓ API 调用
智谱AI (OCR) + DeepSeek (文本分析)
```

### 数据流
```
1. 用户上传作文图片
2. 前端转换为 Base64 格式
3. 发送到后端 /api/essay/process
4. 后端调用智谱AI API 进行 OCR
5. 后端调用 DeepSeek API 进行文本分析
6. 保存到 MongoDB（包含 Base64 图片）
7. 返回评分结果给前端
8. 前端展示详细反馈
```

---

## 📁 项目结构

```
english-essay-ai-grader/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── App.tsx             # 主应用组件
│   │   ├── types.ts            # TypeScript 类型定义
│   │   ├── views/              # 页面组件
│   │   │   ├── Home.tsx        # 首页（上传 + 历史）
│   │   │   ├── Result.tsx      # 结果页（详细评分）
│   │   │   ├── Login.tsx       # 登录页面
│   │   │   └── Register.tsx    # 注册页面
│   │   ├── components/         # 可复用组件
│   │   │   ├── Header.tsx      # 顶部导航
│   │   │   └── ScoreCard.tsx   # 评分卡片
│   │   ├── services/           # API 服务层
│   │   │   ├── api.ts          # Axios 实例
│   │   │   ├── auth.ts         # 认证服务
│   │   │   └── essay.ts        # 作文服务
│   │   └── utils/              # 工具函数
│   │       └── storage.ts      # localStorage 工具
│   ├── package.json            # 依赖配置
│   ├── vite.config.ts          # Vite 配置
│   ├── tailwind.config.js      # Tailwind 配置
│   └── .env.local              # 环境变量（开发）
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── index.ts            # 服务器入口
│   │   ├── config/
│   │   │   ├── database.js     # MongoDB 连接
│   │   │   └── env.js          # 环境变量配置
│   │   ├── models/
│   │   │   ├── User.js         # 用户模型
│   │   │   └── Essay.js        # 作文模型
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT 验证
│   │   │   └── rateLimit.js    # 限流（可选）
│   │   ├── routes/
│   │   │   ├── auth.js         # 认证路由
│   │   │   └── essay.js        # 作文路由
│   │   ├── services/
│   │   │   ├── zhipuService.js # OCR 服务
│   │   │   └── deepseekService.js # 文本分析服务
│   │   └── utils/
│   │       ├── jwt.js          # JWT 工具
│   │       └── validation.js   # 验证工具
│   ├── package.json            # 依赖配置
│   ├── .env                    # 环境变量（生产）
│   └── railway.json            # Railway 配置
│
├── .env.local                   # 前端环境变量
├── README.md                    # 项目说明
└── DEVELOPMENT.md               # 本文档
```

---

## 🎯 功能模块

### 1. 用户系统
- ✅ 用户注册（邮箱 + 密码）
- ✅ 用户登录
- ✅ JWT 认证
- ✅ 个人信息查看

### 2. 作文处理
- ✅ 图片上传（Base64）
- ✅ OCR 文本提取（智谱AI）
- ✅ AI 文本分析（DeepSeek）
- ✅ 评分和反馈生成
- ✅ 历史记录查看

### 3. 数据持久化
- ✅ 用户数据存储（MongoDB）
- ✅ 作文数据存储（MongoDB）
- ✅ 图片存储（Base64 在 MongoDB）

---

## 🔧 技术实现细节

### 数据库设计（MongoDB）

#### users 集合
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### essays 集合
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  imageBase64: String (required),
  extractedText: String (required),
  score: Number (required),
  feedback: Mixed (JSON),
  createdAt: Date,
  updatedAt: Date
}
```

### API 接口设计

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

#### 作文相关
- `POST /api/essay/process` - 处理作文（OCR + 分析）
- `GET /api/essay/history` - 获取历史记录
- `GET /api/essay/:id` - 获取单篇作文详情

### AI 服务配置

#### 智谱AI（OCR）
- **模型**：`glm-4.6v`
- **API 端点**：`https://open.bigmodel.cn/api/paas/v4/chat/completions`
- **用途**：从图片中提取英文文本

#### DeepSeek（文本分析）
- **模型**：`deepseek-chat`
- **API 端点**：`https://api.deepseek.com/chat/completions`
- **用途**：分析文本并生成评分和反馈
- **JSON 模式**：启用（`response_format: { type: "json_object" }`）

---

## 🚀 部署指南

### 开发环境

#### 后端（本地）
```bash
cd backend
npm install
npm run dev  # http://localhost:5000
```

#### 前端（本地）
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### 生产环境

#### Railway（后端）
1. 注册 Railway 账号（https://railway.app）
2. 创建 MongoDB 数据库
3. 部署后端代码
4. 配置环境变量

#### Vercel（前端）
1. 注册 Vercel 账号（https://vercel.com）
2. 部署前端代码
3. 配置环境变量

---

## 💰 成本估算

### 免费额度（开发阶段）
| 服务 | 免费额度 | 预估用量 | 费用 |
|------|---------|---------|------|
| Railway (后端) | 500小时/月 | 720小时 | $0 |
| Railway MongoDB | 512MB | 100MB | $0 |
| Vercel (前端) | 无限流量 | 1000访问 | $0 |
| 智谱AI OCR | 新用户免费 | 1000次 | $0 |
| DeepSeek | 500万 tokens | 200万 tokens | $0 |
| **总计** | - | - | **$0/月** |

### 生产环境（10000 用户）
- Railway Pro: $5/月
- 智谱AI: 约 20 元/月
- DeepSeek: 约 30 元/月
- **总计**: 约 55 元/月

---

## 📝 开发步骤

### 阶段 1：后端开发（1-2 天）
1. 初始化 Node.js + Express 项目
2. 配置 MongoDB 连接
3. 实现用户认证（注册/登录）
4. 实现 JWT 中间件
5. 集成智谱AI OCR
6. 集成 DeepSeek 文本分析
7. 实现作文处理接口
8. 实现历史记录接口
9. 本地测试

### 阶段 2：前端迁移（1 天）
1. 更新服务层（调用后端 API）
2. 添加登录/注册页面
3. 更新首页（需要登录）
4. 更新结果页（从后端获取数据）
5. 更新 Header 组件（显示登录状态）
6. 本地测试前后端联调

### 阶段 3：部署（1 天）
1. 注册 Railway 账号
2. 创建 MongoDB 数据库
3. 部署后端到 Railway
4. 注册 Vercel 账号
5. 部署前端到 Vercel
6. 配置环境变量
7. 生产环境测试

### 阶段 4：优化和文档（半天）
1. 优化代码
2. 添加错误处理
3. 编写部署文档
4. 测试完整流程

---

## 🔐 安全性

### 密码安全
- 使用 bcrypt 哈希（10 轮盐值）
- 不存储明文密码

### JWT 安全
- 使用强密钥（至少 32 位）
- 设置 7 天有效期
- 存储在 localStorage

### 输入验证
- 邮箱格式验证
- 密码长度验证（至少 6 位）
- 文件类型和大小验证

### API 限流（可选）
- 15 分钟内最多 100 次请求

---

## 🐛 常见问题

### Q: 如何获取 API 密钥？
A: 
- 智谱AI：注册 https://open.bigmodel.cn，获取 API Key
- DeepSeek：注册 https://api.deepseek.com，获取 API Key

### Q: 如何解决 CORS 问题？
A: 后端已配置 CORS，允许前端域名访问

### Q: 图片大小限制是多少？
A: 前端限制 5MB，后端限制 10MB

### Q: 如何重置密码？
A: 目前不支持，需要手动修改数据库

### Q: 如何删除账户？
A: 目前不支持，需要手动删除数据库记录

---

## 📞 技术支持

### 问题反馈
- 检查浏览器控制台错误
- 检查后端日志
- 检查网络连接
- 检查 API 密钥是否正确

### 调试建议
1. 使用 Postman 测试 API
2. 查看 MongoDB 数据是否正确保存
3. 检查 AI API 调用是否成功
4. 验证 JWT Token 有效性

---

## 🎯 下一步行动

### 立即开始
1. 确认环境已就绪（Node.js, Git, MongoDB）
2. 获取 API 密钥（智谱AI, DeepSeek）
3. 选择开发方式：
   - **快速开始**：使用提供的完整代码
   - **逐步开发**：按文档一步步实现

### 开发建议
1. 先在本地测试所有功能
2. 确认 AI API 调用正常
3. 再部署到生产环境
4. 逐步优化和添加新功能

---

## 📚 参考资料

### 技术文档
- React 官方文档：https://react.dev/
- Express 官方文档：https://expressjs.com/
- MongoDB 官方文档：https://www.mongodb.com/docs/
- Mongoose 官方文档：https://mongoosejs.com/docs/
- Vite 官方文档：https://vitejs.dev/
- Tailwind CSS 官方文档：https://tailwindcss.com/

### 部署平台
- Railway 文档：https://docs.railway.app/
- Vercel 文档：https://vercel.com/docs

### AI 服务
- 智谱AI 文档：https://open.bigmodel.cn/docs
- DeepSeek 文档：https://api.deepseek.com/docs

---

## 📝 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-23 | 初始版本，前后端分离架构 |

---

**文档结束**
