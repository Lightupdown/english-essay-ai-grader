# English Essay AI Grader

一个基于 AI 技术的英语作文自动评分系统。

## 📖 项目概述

用户上传作文图片，系统通过 OCR 提取文本，使用 AI 模型进行评分和反馈。

## 🏗️ 技术栈

### 前端
- React + TypeScript
- Vite (构建工具)
- Tailwind CSS (样式)
- Axios (HTTP 客户端)

### 后端
- Node.js + Express
- MongoDB (数据库)
- Mongoose (ODM)
- JWT (认证)

### AI 服务
- 智谱AI (OCR) - `glm-4.6v` 模型
- DeepSeek (文本分析) - `deepseek-chat` 模型

### 部署
- 前端: Vercel
- 后端: Railway
- 数据库: Railway MongoDB

## 📁 项目结构

```
english-essay-ai-grader/
├── frontend/           # 前端项目
├── backend/            # 后端项目
├── DEVELOPMENT.md      # 开发文档
└── README.md           # 项目说明
```

## 🚀 快速开始

### 1. 环境准备

- Node.js (v18+)
- Git
- MongoDB (本地开发)

### 2. 后端部署

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
# 复制 .env.example 到 .env 并填写配置

# 启动开发服务器
npm run dev  # http://localhost:5000
```

### 3. 前端部署

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 配置环境变量
# 复制 .env.local.example 到 .env.local 并填写配置

# 启动开发服务器
npm run dev  # http://localhost:5173
```

### 4. 测试

1. 访问 `http://localhost:5173/register` 注册账号
2. 登录后上传作文图片
3. 查看评分结果

## 🔧 配置说明

### 环境变量

#### 后端 (.env)
```env
# 服务器配置
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/essay_grader

# JWT
JWT_SECRET=your_super_secret_jwt_key

# 智谱AI
ZHIPU_API_KEY=your_zhipu_api_key

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key
```

#### 前端 (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 作文
- `POST /api/essay/process` - 处理作文（OCR + 分析）
- `GET /api/essay/history` - 获取历史记录
- `GET /api/essay/:id` - 获取单篇作文详情

## 💰 成本估算

### 开发阶段（免费）
- Railway (后端): $0/月 (500小时)
- Railway MongoDB: $0/月 (512MB)
- Vercel (前端): $0/月 (无限流量)
- 智谱AI OCR: $0 (新用户免费)
- DeepSeek: $0 (500万 tokens 免费)

### 生产环境（10000 用户）
- Railway Pro: $5/月
- 智谱AI: 约 20 元/月
- DeepSeek: 约 30 元/月
- **总计**: 约 55 元/月

## 📝 开发步骤

详见 `DEVELOPMENT.md` 文档。

## 🔐 安全性

- 密码使用 bcrypt 哈希存储
- JWT 认证，有效期 7 天
- 输入验证和清理
- API 限流（可选）

## 🐛 常见问题

### Q: 如何获取 API 密钥？
A: 
- 智谱AI：注册 https://open.bigmodel.cn
- DeepSeek：注册 https://api.deepseek.com

### Q: 图片大小限制是多少？
A: 前端限制 5MB，后端限制 10MB

### Q: 如何解决 CORS 问题？
A: 后端已配置 CORS，允许前端域名访问

## 📞 技术支持

如有问题，请查看：
1. 浏览器控制台错误
2. 后端日志
3. `DEVELOPMENT.md` 文档

## 📚 参考资料

- React 官方文档：https://react.dev/
- Express 官方文档：https://expressjs.com/
- MongoDB 官方文档：https://www.mongodb.com/docs/
- Railway 文档：https://docs.railway.app/
- Vercel 文档：https://vercel.com/docs

## 📄 许可证

MIT License

---

**版本**: 1.0.0  
**更新日期**: 2024-01-23
