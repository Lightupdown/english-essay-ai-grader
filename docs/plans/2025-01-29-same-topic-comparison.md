# 同题作文对比功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现同题作文对比功能，允许学生输入或自动预测作文题目，编辑修改后生成范文，并支持润色/重写等模式选择。

**Architecture:** 
1. 在 Result 页面添加"同题对比"入口按钮
2. 创建独立的 Comparison 页面，包含：题目编辑区、生成选项配置、范文展示区
3. 后端新增 comparison 路由和 AI 服务，支持题目预测和范文生成
4. 使用混合存储：IndexedDB 缓存范文，MongoDB 持久化对比记录

**Tech Stack:** React + TypeScript + Tailwind CSS, Node.js + Express + MongoDB, DeepSeek API

---

## 功能需求确认

### 核心功能
1. **题目获取**：自动从当前作文预测题目 / 手动输入题目
2. **题目编辑**：学生可以修改预测的题目
3. **生成选项**：
   - 模式选择：润色当前作文 / 完全重写
   - 难度调节：保持当前水平 / 提高一档 / 降低一档
   - 风格选择：学术 / 叙事 / 议论
4. **范文生成**：AI 根据题目和选项生成范文
5. **对比展示**：并排显示原文和范文，高亮差异

### 数据流
```
Result 页面 → 点击"同题对比" → Comparison 页面
                                    ↓
                            显示题目编辑区（自动预测或手动输入）
                                    ↓
                            配置生成选项
                                    ↓
                            调用后端 API 生成范文
                                    ↓
                            展示对比结果（并排 + 差异高亮）
```

---

## 任务清单

### Task 1: 创建类型定义

**Files:**
- Modify: `types.ts`

**Step 1: 添加同题对比相关类型**

在 `types.ts` 末尾添加：

```typescript
// 同题对比生成模式
export type ComparisonMode = 'polish' | 'rewrite';

// 难度调节
export type DifficultyAdjustment = 'same' | 'higher' | 'lower';

// 写作风格
export type WritingStyle = 'academic' | 'narrative' | 'argumentative';

// 同题对比配置
export interface ComparisonConfig {
  topic: string;                    // 作文题目
  mode: ComparisonMode;             // 生成模式
  difficulty: DifficultyAdjustment; // 难度调节
  style: WritingStyle;              // 写作风格
  originalText: string;             // 原文
  gradeLevel: GradeLevel;           // 当前年级
}

// 范文结果
export interface ModelEssay {
  text: string;                     // 范文内容
  highlights: string[];             // 亮点说明
  improvements: string[];           // 相比原文的改进点
  vocabulary: string[];             // 推荐词汇
  structures: string[];             // 推荐句型
}

// 同题对比记录
export interface ComparisonRecord {
  id: string;
  essayId: string;                  // 关联的原作文ID
  config: ComparisonConfig;
  modelEssay: ModelEssay;
  createdAt: number;
  studentId?: string;               // 学生ID（可选）
}
```

**Step 2: Commit**

```bash
git add types.ts
git commit -m "feat: add comparison feature types"
```

---

### Task 2: 创建后端 AI 服务 - 题目预测

**Files:**
- Create: `backend/src/services/topicService.js`

**Step 1: 实现题目预测功能**

```javascript
const axios = require('axios');

const API_URL = 'https://api.deepseek.com/chat/completions';

const predictTopic = async (essayText) => {
  try {
    const prompt = `请根据以下英语作文内容，预测这道作文题的题目要求是什么。

作文内容：
${essayText}

要求：
1. 只输出题目要求本身（如：Write about your favorite season）
2. 不要输出任何解释或分析
3. 如果无法确定，输出 "Unknown Topic"
4. 用英文输出题目`;

    const response = await axios.post(
      API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个英语作文题目预测专家。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const topic = response.data.choices?.[0]?.message?.content?.trim() || 'Unknown Topic';
    return topic;
  } catch (error) {
    console.error('题目预测失败:', error);
    throw new Error('题目预测失败，请手动输入');
  }
};

module.exports = { predictTopic };
```

**Step 2: Commit**

```bash
git add backend/src/services/topicService.js
git commit -m "feat: add topic prediction service"
```

---

### Task 3: 创建后端 AI 服务 - 范文生成

**Files:**
- Create: `backend/src/services/modelEssayService.js`

**Step 1: 实现范文生成功能**

```javascript
const axios = require('axios');
const { GRADE_PROMPTS } = require('../config/grades');

const API_URL = 'https://api.deepseek.com/chat/completions';

const generateModelEssay = async (config) => {
  try {
    const { topic, mode, difficulty, style, originalText, gradeLevel } = config;
    
    const gradeConfig = GRADE_PROMPTS[gradeLevel];
    if (!gradeConfig) {
      throw new Error(`无效的年级程度: ${gradeLevel}`);
    }

    let difficultyPrompt = '';
    switch (difficulty) {
      case 'higher':
        difficultyPrompt = '比当前水平高一个档次，使用更高级的词汇和复杂句型';
        break;
      case 'lower':
        difficultyPrompt = '比当前水平低一个档次，使用更基础的词汇和简单句型';
        break;
      default:
        difficultyPrompt = `保持${gradeConfig.name}水平`;
    }

    const modePrompt = mode === 'polish' 
      ? `基于以下原文进行润色改进，保留原文的核心内容和观点，但提升语言表达：\n\n原文：\n${originalText}`
      : '完全重新写一篇新的范文，不参考原文内容，只根据题目要求独立创作';

    const styleMap = {
      academic: '学术风格：正式、客观、使用学术词汇',
      narrative: '叙事风格：生动、有画面感、情感丰富',
      argumentative: '议论风格：逻辑严密、论据充分、说服力强'
    };

    const prompt = `请根据以下要求生成一篇英语范文：

题目：${topic}

目标水平：${difficultyPrompt}

写作风格：${styleMap[style]}

生成模式：${modePrompt}

要求：
1. 字数与原文相当或略多
2. 符合目标水平的语言要求
3. 内容切题，结构完整
4. 输出JSON格式

输出格式：
{
  "text": "范文全文（纯英文）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "improvements": ["改进点1", "改进点2"],
  "vocabulary": ["推荐词汇1", "推荐词汇2", "推荐词汇3"],
  "structures": ["推荐句型1", "推荐句型2"]
}

注意：所有中文说明都要用中文输出。`;

    const response = await axios.post(
      API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位资深英语教师，擅长根据要求生成高质量的英语作文范文。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: {
          type: 'json_object'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '{}';
    const data = JSON.parse(content);

    return {
      text: data.text || '',
      highlights: data.highlights || [],
      improvements: data.improvements || [],
      vocabulary: data.vocabulary || [],
      structures: data.structures || []
    };
  } catch (error) {
    console.error('范文生成失败:', error);
    throw new Error('范文生成失败，请稍后重试');
  }
};

module.exports = { generateModelEssay };
```

**Step 2: Commit**

```bash
git add backend/src/services/modelEssayService.js
git commit -m "feat: add model essay generation service"
```

---

### Task 4: 创建后端对比路由

**Files:**
- Create: `backend/src/routes/comparison.js`

**Step 1: 实现对比 API 路由**

```javascript
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

    const modelEssay = await generateModelEssay(config);

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
```

**Step 2: Commit**

```bash
git add backend/src/routes/comparison.js
git commit -m "feat: add comparison API routes"
```

---

### Task 5: 创建 MongoDB 模型

**Files:**
- Create: `backend/src/models/Comparison.js`

**Step 1: 实现对比记录模型**

```javascript
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
    highlights: [{ type: String }],
    improvements: [{ type: String }],
    vocabulary: [{ type: String }],
    structures: [{ type: String }]
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

comparisonSchema.index({ studentId: 1, createdAt: -1 });
comparisonSchema.index({ essayId: 1, createdAt: -1 });

module.exports = mongoose.model('Comparison', comparisonSchema);
```

**Step 2: Commit**

```bash
git add backend/src/models/Comparison.js
git commit -m "feat: add Comparison MongoDB model"
```

---

### Task 6: 注册后端路由

**Files:**
- Modify: `backend/src/index.js`

**Step 1: 添加对比路由**

在 `backend/src/index.js` 中找到路由注册部分，添加：

```javascript
const comparisonRoutes = require('./routes/comparison');

app.use('/api/comparison', comparisonRoutes);
```

**Step 2: Commit**

```bash
git add backend/src/index.js
git commit -m "feat: register comparison routes"
```

---

### Task 7: 创建前端 API 服务

**Files:**
- Create: `services/comparison.ts`

**Step 1: 实现对比 API 服务**

```typescript
import api from './api';
import { ComparisonConfig, ModelEssay, ComparisonRecord } from '../types';

export interface PredictTopicResponse {
  topic: string;
}

export interface GenerateModelEssayResponse {
  comparisonId: string;
  config: ComparisonConfig;
  modelEssay: ModelEssay;
}

export const predictTopic = async (essayText: string): Promise<PredictTopicResponse> => {
  const response = await api.post('/comparison/predict-topic', { essayText });
  return response.data.data;
};

export const generateModelEssay = async (
  config: ComparisonConfig,
  studentId?: string
): Promise<GenerateModelEssayResponse> => {
  const response = await api.post('/comparison/generate', { config, studentId });
  return response.data.data;
};
```

**Step 2: Commit**

```bash
git add services/comparison.ts
git commit -m "feat: add comparison API service"
```

---

### Task 8: 创建 IndexedDB 存储工具

**Files:**
- Create: `utils/comparisonStorage.ts`

**Step 1: 实现 IndexedDB 存储**

```typescript
import { ComparisonRecord } from '../types';

const DB_NAME = 'EssayComparisonDB';
const DB_VERSION = 1;
const STORE_NAME = 'comparisons';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('essayId', 'essayId', { unique: false });
      }
    };
  });
};

export const saveComparison = async (record: ComparisonRecord): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(record);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getComparison = async (id: string): Promise<ComparisonRecord | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
```

**Step 2: Commit**

```bash
git add utils/comparisonStorage.ts
git commit -m "feat: add IndexedDB storage for comparisons"
```

---

### Task 9: 创建对比配置弹窗组件

**Files:**
- Create: `components/ComparisonModal.tsx`

**Step 1: 实现配置弹窗组件**

组件包含：
1. 题目输入/编辑区（带自动预测按钮）
2. 生成模式选择（润色/重写）
3. 难度调节（保持/提高/降低）
4. 写作风格选择（学术/叙事/议论）
5. 生成按钮

**Step 2: Commit**

```bash
git add components/ComparisonModal.tsx
git commit -m "feat: add comparison config modal component"
```

---

### Task 10: 创建范文展示组件

**Files:**
- Create: `components/ModelEssayDisplay.tsx`

**Step 1: 实现范文展示组件**

组件包含：
1. 并排显示原文和范文
2. 差异高亮（使用 diff 算法）
3. 亮点、改进点、推荐词汇展示

**Step 2: Commit**

```bash
git add components/ModelEssayDisplay.tsx
git commit -m "feat: add model essay display component with diff highlighting"
```

---

### Task 11: 在 Result 页面添加入口

**Files:**
- Modify: `views/Result.tsx`

**Step 1: 在 Result 页面添加"同题对比"按钮**

在专家点评区域下方添加按钮，点击后弹出 ComparisonModal。

**Step 2: Commit**

```bash
git add views/Result.tsx
git commit -m "feat: add comparison entry button in Result page"
```

---

### Task 12: 创建 Comparison 页面

**Files:**
- Create: `views/Comparison.tsx`

**Step 1: 实现对比页面**

页面包含：
1. 返回按钮
2. 配置摘要（显示当前配置）
3. ModelEssayDisplay 组件
4. 重新生成按钮

**Step 2: 在 App.tsx 添加路由**

```typescript
import Comparison from './views/Comparison';

// 在路由中添加
<Route path="/comparison/:id" element={<Comparison />} />
```

**Step 3: Commit**

```bash
git add views/Comparison.tsx App.tsx
git commit -m "feat: add Comparison page with routing"
```

---

## 测试验证

### 后端测试
1. 启动后端服务器
2. 测试题目预测 API：
   ```bash
   curl -X POST http://localhost:5000/api/comparison/predict-topic \
     -H "Content-Type: application/json" \
     -d '{"essayText": "My favorite season is summer..."}'
   ```
3. 测试范文生成 API

### 前端测试
1. 进入 Result 页面
2. 点击"同题对比"按钮
3. 验证题目预测功能
4. 选择不同配置生成范文
5. 验证对比展示效果

---

## 注意事项

1. **API Key**: 确保 `DEEPSEEK_API_KEY` 环境变量已设置
2. **MongoDB**: 确保 MongoDB 连接正常
3. **CORS**: 确保后端 CORS 配置允许前端访问
4. **Error Handling**: 所有 API 调用都需要错误处理
5. **Loading States**: 添加加载状态提示

---

## 后续优化

1. 添加历史记录查看功能
2. 支持保存多个版本的范文
3. 添加词汇本功能（收藏范文中的好词好句）
4. 支持导出对比报告为 PDF
