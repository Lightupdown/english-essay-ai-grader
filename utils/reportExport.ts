import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ComparisonRecord, EssayRecord, GRADE_CONFIGS, FeedbackItem, VocabularyItem, StructureItem } from '../types';

// 导出格式类型
export type ExportFormat = 'pdf' | 'docx' | 'md' | 'html';

// 导出数据接口
export interface ExportReportData {
  comparison: ComparisonRecord;
  essayRecord?: EssayRecord;
}

/**
 * 生成安全的文件名（移除特殊字符，限制长度）
 */
function generateSafeFilename(topic: string, extension: string): string {
  // 移除特殊字符，保留中文、英文、数字
  const safeTopic = topic
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 20);
  
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${safeTopic}_同题对比_${date}.${extension}`;
}

/**
 * 格式化日期
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 获取年级标签
 */
function getGradeLabel(gradeLevel: string): string {
  return GRADE_CONFIGS[gradeLevel as keyof typeof GRADE_CONFIGS]?.label || gradeLevel;
}

/**
 * 生成报告HTML内容
 */
function generateReportHTML(data: ExportReportData): string {
  const { comparison, essayRecord } = data;
  const { config, modelEssay } = comparison;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>同题对比报告 - ${config.topic}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 60px 50px;
      width: 794px;
      margin: 0;
      box-sizing: border-box;
    }
    .page-wrapper {
      page-break-after: always;
      padding-bottom: 40px;
    }
    .page-wrapper:last-child {
      page-break-after: auto;
    }
    .container {
      max-width: 100%;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #3498db;
    }
    .header h1 {
      color: #2c3e50;
      font-size: 24px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .header h2 {
      color: #7f8c8d;
      font-size: 16px;
      font-weight: normal;
    }
    .info-section {
      background: #ecf0f1;
      padding: 12px 15px;
      border-radius: 6px;
      margin-bottom: 25px;
    }
    .info-section p {
      margin: 4px 0;
      color: #555;
      font-size: 13px;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #2980b9;
      font-size: 16px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #3498db;
      font-weight: bold;
    }
    .section h3 {
      color: #34495e;
      font-size: 14px;
      margin: 15px 0 8px 0;
      font-weight: bold;
    }
    .score-grid {
      display: flex;
      gap: 15px;
      margin: 12px 0;
    }
    .score-item {
      flex: 1;
      background: #3498db;
      color: white;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
    }
    .score-item .label {
      font-size: 11px;
      opacity: 0.9;
    }
    .score-item .value {
      font-size: 18px;
      font-weight: bold;
    }
    .content-box {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #3498db;
      margin: 8px 0;
    }
    .essay-text {
      white-space: pre-wrap;
      line-height: 1.7;
      font-size: 13px;
    }
    .highlight-list, .improvement-list {
      list-style: none;
      padding: 0;
    }
    .highlight-list li, .improvement-list li {
      padding: 8px 12px;
      margin: 6px 0;
      border-radius: 4px;
      font-size: 13px;
    }
    .highlight-list li {
      background: #d4edda;
      border-left: 3px solid #28a745;
    }
    .improvement-list li {
      background: #fff3cd;
      border-left: 3px solid #ffc107;
    }
    .vocab-table {
      width: 100%;
      margin-top: 12px;
      border-collapse: collapse;
      font-size: 12px;
    }
    .vocab-table th, .vocab-table td {
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
    .vocab-table th {
      background: #e9ecef;
      font-weight: bold;
      color: #495057;
    }
    .structure-item {
      background: #f8f9fa;
      padding: 10px 12px;
      margin: 8px 0;
      border-radius: 4px;
      border-left: 3px solid #9b59b6;
    }
    .structure-item .structure-text {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
      font-size: 13px;
    }
    .structure-item .translation {
      color: #555;
      font-size: 12px;
    }
    .structure-item .usage {
      color: #777;
      font-size: 11px;
      margin-top: 3px;
      font-style: italic;
    }
    .commentary {
      background: #e8f4f8;
      padding: 12px;
      border-radius: 6px;
      line-height: 1.7;
      font-size: 13px;
    }
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>英语作文AI分析报告</h1>
      <h2>同题对比报告</h2>
    </div>
    
    <div class="info-section">
      <p><strong>作文主题：</strong>${config.topic}</p>
      <p><strong>导出日期：</strong>${formatDate(Date.now())}</p>
      <p><strong>年级水平：</strong>${getGradeLabel(config.gradeLevel)}</p>
    </div>

    <div class="section">
      <h2>一、原始作文分析</h2>
      ${essayRecord?.result ? `
      <div class="score-grid">
        <div class="score-item">
          <div class="label">总体评分</div>
          <div class="value">${essayRecord.result.totalScore}</div>
        </div>
        <div class="score-item">
          <div class="label">语法得分</div>
          <div class="value">${essayRecord.result.grammarScore}</div>
        </div>
        <div class="score-item">
          <div class="label">词汇得分</div>
          <div class="value">${essayRecord.result.vocabScore}</div>
        </div>
      </div>
      
      <h3>专家点评</h3>
      <div class="commentary">${essayRecord.result.commentary}</div>
      ` : ''}
      
      <h3>原文内容</h3>
      <div class="content-box">
        <div class="essay-text">${config.originalText}</div>
      </div>
    </div>

    <div class="section">
      <h2>二、AI范文</h2>
      
      <h3>英文范文</h3>
      <div class="content-box">
        <div class="essay-text">${modelEssay.text}</div>
      </div>
      
      <h3>中文翻译</h3>
      <div class="content-box" style="border-left-color: #27ae60;">
        <div class="essay-text">${modelEssay.translation}</div>
      </div>
      
      ${modelEssay.highlights.length > 0 ? `
      <h3>写作亮点</h3>
      <ul class="highlight-list">
        ${modelEssay.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
      ` : ''}
      
      ${modelEssay.improvements.length > 0 ? `
      <h3>改进点</h3>
      <ul class="improvement-list">
        ${modelEssay.improvements.map(i => `<li>${i}</li>`).join('')}
      </ul>
      ` : ''}
    </div>

    ${modelEssay.vocabulary.length > 0 ? `
    <div class="section">
      <h2>三、核心词汇</h2>
      <table class="vocab-table">
        <thead>
          <tr>
            <th>单词</th>
            <th>词性</th>
            <th>释义</th>
            <th>语境</th>
          </tr>
        </thead>
        <tbody>
          ${modelEssay.vocabulary.map(v => `
          <tr>
            <td><strong>${v.word}</strong></td>
            <td>${v.partOfSpeech}</td>
            <td>${v.translation}</td>
            <td>${v.context || '-'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${modelEssay.structures.length > 0 ? `
    <div class="section">
      <h2>四、重点句型</h2>
      <div>
        ${modelEssay.structures.map(s => `
        <div class="structure-item">
          <div class="structure-text">${s.structure}</div>
          <div class="translation">翻译：${s.translation}</div>
          ${s.usage ? `<div class="usage">场景：${s.usage}</div>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

/**
 * 导出为 PDF（使用 html2canvas 渲染 HTML 为图片）
 */
export async function exportToPDF(data: ExportReportData): Promise<void> {
  const { comparison } = data;
  const { config } = comparison;
  
  // 生成HTML内容
  const htmlContent = generateReportHTML(data);
  
  // 创建临时容器
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = 'white';
  document.body.appendChild(container);
  
  try {
    // 等待字体加载和渲染
    await document.fonts.ready;
    
    // 等待一下确保布局完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 使用 html2canvas 渲染完整内容
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // 创建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // PDF 页面尺寸 (A4: 210mm x 297mm)
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // 页边距 (单位: mm)
    const margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    };
    
    // 内容区域尺寸
    const contentWidth = pdfWidth - margin.left - margin.right;
    const contentHeight = pdfHeight - margin.top - margin.bottom;
    
    // A4 尺寸在 96 DPI 下的像素值
    const a4WidthPx = 794;
    const a4HeightPx = 1123;
    
    // 计算缩放比例 - 让内容适应页边距内的宽度
    const scale = contentWidth / a4WidthPx;
    const pageHeightInCanvas = (contentHeight / contentWidth) * canvas.width;
    
    let currentPage = 0;
    let position = 0;
    
    // 循环添加页面直到所有内容都被包含
    while (position < canvas.height) {
      if (currentPage > 0) {
        pdf.addPage();
      }
      
      // 计算当前页应该截取的区域
      const sourceY = position;
      const sourceHeight = Math.min(pageHeightInCanvas, canvas.height - position);
      
      // 创建一个临时的 canvas 来截取当前页的内容
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = sourceHeight;
      const ctx = tempCanvas.getContext('2d');
      
      if (ctx) {
        // 截取原 canvas 的相应部分
        ctx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );
        
        const tempImgData = tempCanvas.toDataURL('image/png');
        // 计算图片在 PDF 中的高度，保持宽高比
        const imgHeightInPdf = (sourceHeight / canvas.width) * contentWidth;
        // 添加到 PDF，应用页边距
        pdf.addImage(tempImgData, 'PNG', margin.left, margin.top, contentWidth, imgHeightInPdf);
      }
      
      position += pageHeightInCanvas;
      currentPage++;
      
      // 安全检查，防止无限循环
      if (currentPage > 100) {
        console.warn('PDF generation stopped after 100 pages');
        break;
      }
    }
    
    // 保存文件
    const filename = generateSafeFilename(config.topic, 'pdf');
    pdf.save(filename);
  } finally {
    // 清理临时容器
    document.body.removeChild(container);
  }
}

/**
 * 导出为 Word 文档
 */
export async function exportToDOCX(data: ExportReportData): Promise<void> {
  const { comparison, essayRecord } = data;
  const { config, modelEssay } = comparison;

  const children: Paragraph[] = [];

  // 标题
  children.push(
    new Paragraph({
      text: '英语作文AI分析报告',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: '同题对比报告',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // 基本信息
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '作文主题：', bold: true }),
        new TextRun({ text: config.topic })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '导出日期：', bold: true }),
        new TextRun({ text: formatDate(Date.now()) })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '年级水平：', bold: true }),
        new TextRun({ text: getGradeLabel(config.gradeLevel) })
      ],
      spacing: { after: 300 }
    })
  );

  // 第一部分：原始作文分析
  children.push(
    new Paragraph({
      text: '一、原始作文分析',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 }
    })
  );

  if (essayRecord?.result) {
    const result = essayRecord.result;
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '总体评分：', bold: true }),
          new TextRun({ text: `${result.totalScore}/100` })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '语法得分：', bold: true }),
          new TextRun({ text: `${result.grammarScore}/100` })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '词汇得分：', bold: true }),
          new TextRun({ text: `${result.vocabScore}/100` })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: '专家点评：',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: result.commentary,
        spacing: { after: 200 }
      })
    );
  }

  children.push(
    new Paragraph({
      text: '原文内容：',
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: config.originalText,
      spacing: { after: 300 }
    })
  );

  // 第二部分：AI范文
  children.push(
    new Paragraph({
      text: '二、AI范文',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 }
    }),
    new Paragraph({
      text: '英文范文：',
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: modelEssay.text,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: '中文翻译：',
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 100 }
    }),
    new Paragraph({
      text: modelEssay.translation,
      spacing: { after: 200 }
    })
  );

  // 写作亮点
  if (modelEssay.highlights.length > 0) {
    children.push(
      new Paragraph({
        text: '写作亮点：',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 }
      })
    );
    
    modelEssay.highlights.forEach((highlight, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${highlight}`,
          spacing: { after: 100 }
        })
      );
    });
    
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // 改进点
  if (modelEssay.improvements.length > 0) {
    children.push(
      new Paragraph({
        text: '改进点：',
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 100 }
      })
    );
    
    modelEssay.improvements.forEach((improvement, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${improvement}`,
          spacing: { after: 100 }
        })
      );
    });
    
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // 第三部分：核心词汇
  if (modelEssay.vocabulary.length > 0) {
    children.push(
      new Paragraph({
        text: '三、核心词汇',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );
    
    modelEssay.vocabulary.forEach((item, index) => {
      const parts: (string | TextRun)[] = [
        `${index + 1}. ${item.word} `,
        new TextRun({ text: `(${item.partOfSpeech})`, italics: true }),
        ` - ${item.translation}`
      ];
      
      children.push(
        new Paragraph({
          children: parts.map(p => typeof p === 'string' ? new TextRun(p) : p),
          spacing: { after: 50 }
        })
      );
      
      if (item.context) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '语境：', bold: true, size: 20 }),
              new TextRun({ text: item.context, size: 20 })
            ],
            spacing: { after: 150 },
            indent: { left: 360 }
          })
        );
      }
    });
  }

  // 第四部分：重点句型
  if (modelEssay.structures.length > 0) {
    children.push(
      new Paragraph({
        text: '四、重点句型',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );
    
    modelEssay.structures.forEach((item, index) => {
      children.push(
        new Paragraph({
          text: `${index + 1}. ${item.structure}`,
          spacing: { after: 50 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '翻译：', bold: true, size: 20 }),
            new TextRun({ text: item.translation, size: 20 })
          ],
          spacing: { after: 50 },
          indent: { left: 360 }
        })
      );
      
      if (item.usage) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '场景：', bold: true, size: 20 }),
              new TextRun({ text: item.usage, size: 20 })
            ],
            spacing: { after: 150 },
            indent: { left: 360 }
          })
        );
      } else {
        children.push(new Paragraph({ spacing: { after: 100 } }));
      }
    });
  }

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children
    }]
  });

  // 生成并下载
  const blob = await Packer.toBlob(doc);
  const filename = generateSafeFilename(config.topic, 'docx');
  saveAs(blob, filename);
}

/**
 * 导出为 Markdown
 */
export function exportToMarkdown(data: ExportReportData): void {
  const { comparison, essayRecord } = data;
  const { config, modelEssay } = comparison;

  let markdown = `# 英语作文AI分析报告\n\n`;
  markdown += `## 同题对比报告\n\n`;

  // 基本信息
  markdown += `### 基本信息\n\n`;
  markdown += `- **作文主题**：${config.topic}\n`;
  markdown += `- **导出日期**：${formatDate(Date.now())}\n`;
  markdown += `- **年级水平**：${getGradeLabel(config.gradeLevel)}\n\n`;

  // 第一部分：原始作文分析
  markdown += `---\n\n`;
  markdown += `## 一、原始作文分析\n\n`;

  if (essayRecord?.result) {
    const result = essayRecord.result;
    
    markdown += `### 评分信息\n\n`;
    markdown += `- **总体评分**：${result.totalScore}/100\n`;
    markdown += `- **语法得分**：${result.grammarScore}/100\n`;
    markdown += `- **词汇得分**：${result.vocabScore}/100\n\n`;
    
    markdown += `### 专家点评\n\n`;
    markdown += `${result.commentary}\n\n`;
  }

  markdown += `### 原文内容\n\n`;
  markdown += '```\n';
  markdown += config.originalText;
  markdown += '\n```\n\n';

  // 第二部分：AI范文
  markdown += `---\n\n`;
  markdown += `## 二、AI范文\n\n`;

  markdown += `### 英文范文\n\n`;
  markdown += modelEssay.text;
  markdown += '\n\n';

  markdown += `### 中文翻译\n\n`;
  markdown += modelEssay.translation;
  markdown += '\n\n';

  // 写作亮点
  if (modelEssay.highlights.length > 0) {
    markdown += `### 写作亮点\n\n`;
    modelEssay.highlights.forEach((highlight, index) => {
      markdown += `${index + 1}. ${highlight}\n`;
    });
    markdown += '\n';
  }

  // 改进点
  if (modelEssay.improvements.length > 0) {
    markdown += `### 改进点\n\n`;
    modelEssay.improvements.forEach((improvement, index) => {
      markdown += `${index + 1}. ${improvement}\n`;
    });
    markdown += '\n';
  }

  // 第三部分：核心词汇
  if (modelEssay.vocabulary.length > 0) {
    markdown += `---\n\n`;
    markdown += `## 三、核心词汇\n\n`;
    
    markdown += '| 序号 | 单词 | 词性 | 释义 | 语境 |\n';
    markdown += '|------|------|------|------|------|\n';
    
    modelEssay.vocabulary.forEach((item, index) => {
      const context = item.context || '-';
      markdown += `| ${index + 1} | ${item.word} | ${item.partOfSpeech} | ${item.translation} | ${context} |\n`;
    });
    
    markdown += '\n';
  }

  // 第四部分：重点句型
  if (modelEssay.structures.length > 0) {
    markdown += `---\n\n`;
    markdown += `## 四、重点句型\n\n`;
    
    modelEssay.structures.forEach((item, index) => {
      markdown += `${index + 1}. **${item.structure}**\n`;
      markdown += `   - 翻译：${item.translation}\n`;
      if (item.usage) {
        markdown += `   - 场景：${item.usage}\n`;
      }
      markdown += '\n';
    });
  }

  // 下载文件
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const filename = generateSafeFilename(config.topic, 'md');
  saveAs(blob, filename);
}

/**
 * 导出为 HTML
 */
export function exportToHTML(data: ExportReportData): void {
  const { comparison, essayRecord } = data;
  const { config, modelEssay } = comparison;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>同题对比报告 - ${config.topic}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3498db;
    }
    .header h1 {
      color: #2c3e50;
      font-size: 28px;
      margin-bottom: 8px;
    }
    .header h2 {
      color: #7f8c8d;
      font-size: 18px;
      font-weight: normal;
    }
    .info-section {
      background: #ecf0f1;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .info-section p {
      margin: 5px 0;
      color: #555;
    }
    .section {
      margin-bottom: 35px;
    }
    .section h2 {
      color: #2980b9;
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #3498db;
    }
    .section h3 {
      color: #34495e;
      font-size: 16px;
      margin: 20px 0 10px 0;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .score-item {
      background: #3498db;
      color: white;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .score-item .label {
      font-size: 12px;
      opacity: 0.9;
    }
    .score-item .value {
      font-size: 20px;
      font-weight: bold;
    }
    .content-box {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3498db;
      margin: 10px 0;
    }
    .essay-text {
      white-space: pre-wrap;
      line-height: 1.8;
    }
    .highlight-list, .improvement-list {
      list-style: none;
      padding: 0;
    }
    .highlight-list li, .improvement-list li {
      padding: 10px 15px;
      margin: 8px 0;
      border-radius: 6px;
    }
    .highlight-list li {
      background: #d4edda;
      border-left: 4px solid #28a745;
    }
    .improvement-list li {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
    }
    .vocab-table, .structure-list {
      width: 100%;
      margin-top: 15px;
    }
    .vocab-table {
      border-collapse: collapse;
    }
    .vocab-table th, .vocab-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
    .vocab-table th {
      background: #e9ecef;
      font-weight: 600;
      color: #495057;
    }
    .vocab-table tr:hover {
      background: #f8f9fa;
    }
    .structure-item {
      background: #f8f9fa;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      border-left: 4px solid #9b59b6;
    }
    .structure-item .structure-text {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }
    .structure-item .translation {
      color: #7f8c8d;
      font-size: 14px;
    }
    .structure-item .usage {
      color: #95a5a6;
      font-size: 13px;
      margin-top: 5px;
      font-style: italic;
    }
    .commentary {
      background: #e8f4f8;
      padding: 15px;
      border-radius: 8px;
      line-height: 1.8;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>英语作文AI分析报告</h1>
      <h2>同题对比报告</h2>
    </div>
    
    <div class="info-section">
      <p><strong>作文主题：</strong>${config.topic}</p>
      <p><strong>导出日期：</strong>${formatDate(Date.now())}</p>
      <p><strong>年级水平：</strong>${getGradeLabel(config.gradeLevel)}</p>
    </div>

    <div class="section">
      <h2>一、原始作文分析</h2>
      ${essayRecord?.result ? `
      <div class="score-grid">
        <div class="score-item">
          <div class="label">总体评分</div>
          <div class="value">${essayRecord.result.totalScore}</div>
        </div>
        <div class="score-item">
          <div class="label">语法得分</div>
          <div class="value">${essayRecord.result.grammarScore}</div>
        </div>
        <div class="score-item">
          <div class="label">词汇得分</div>
          <div class="value">${essayRecord.result.vocabScore}</div>
        </div>
      </div>
      
      <h3>专家点评</h3>
      <div class="commentary">${essayRecord.result.commentary}</div>
      ` : ''}
      
      <h3>原文内容</h3>
      <div class="content-box">
        <div class="essay-text">${config.originalText}</div>
      </div>
    </div>

    <div class="section">
      <h2>二、AI范文</h2>
      
      <h3>英文范文</h3>
      <div class="content-box">
        <div class="essay-text">${modelEssay.text}</div>
      </div>
      
      <h3>中文翻译</h3>
      <div class="content-box" style="border-left-color: #27ae60;">
        <div class="essay-text">${modelEssay.translation}</div>
      </div>
      
      ${modelEssay.highlights.length > 0 ? `
      <h3>写作亮点</h3>
      <ul class="highlight-list">
        ${modelEssay.highlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
      ` : ''}
      
      ${modelEssay.improvements.length > 0 ? `
      <h3>改进点</h3>
      <ul class="improvement-list">
        ${modelEssay.improvements.map(i => `<li>${i}</li>`).join('')}
      </ul>
      ` : ''}
    </div>

    ${modelEssay.vocabulary.length > 0 ? `
    <div class="section">
      <h2>三、核心词汇</h2>
      <table class="vocab-table">
        <thead>
          <tr>
            <th>单词</th>
            <th>词性</th>
            <th>释义</th>
            <th>语境</th>
          </tr>
        </thead>
        <tbody>
          ${modelEssay.vocabulary.map(v => `
          <tr>
            <td><strong>${v.word}</strong></td>
            <td>${v.partOfSpeech}</td>
            <td>${v.translation}</td>
            <td>${v.context || '-'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${modelEssay.structures.length > 0 ? `
    <div class="section">
      <h2>四、重点句型</h2>
      <div class="structure-list">
        ${modelEssay.structures.map(s => `
        <div class="structure-item">
          <div class="structure-text">${s.structure}</div>
          <div class="translation">翻译：${s.translation}</div>
          ${s.usage ? `<div class="usage">场景：${s.usage}</div>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>`;

  // 下载文件
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const filename = generateSafeFilename(config.topic, 'html');
  saveAs(blob, filename);
}

/**
 * 主导出函数
 */
export async function exportReport(data: ExportReportData, format: ExportFormat): Promise<void> {
  switch (format) {
    case 'pdf':
      await exportToPDF(data);
      break;
    case 'docx':
      await exportToDOCX(data);
      break;
    case 'md':
      exportToMarkdown(data);
      break;
    case 'html':
      exportToHTML(data);
      break;
    default:
      throw new Error(`不支持的导出格式: ${format}`);
  }
}
