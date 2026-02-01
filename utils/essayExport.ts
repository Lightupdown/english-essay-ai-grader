import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { EssayRecord, AnalyzeResult, GRADE_CONFIGS, FeedbackItem } from '../types';

export type ExportFormat = 'pdf' | 'docx' | 'md' | 'html';

function generateSafeFilename(title: string, extension: string): string {
  const safeTitle = title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 20);
  
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${safeTitle}_批阅报告_${date}.${extension}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getGradeLabel(gradeLevel: string): string {
  return GRADE_CONFIGS[gradeLevel as keyof typeof GRADE_CONFIGS]?.label || gradeLevel;
}

function generateReportHTML(record: EssayRecord, result: AnalyzeResult): string {
  const feedbacks = result.feedbacks || [];
  const errors = feedbacks.filter(f => f.type === 'error');
  const improvements = feedbacks.filter(f => f.type === 'improvement');
  const highlights = feedbacks.filter(f => f.type === 'highlight');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>英语作文批阅报告</title>
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
    .score-section {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
    }
    .score-card {
      flex: 1;
      background: #3498db;
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .score-card .label {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .score-card .value {
      font-size: 28px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h2 {
      color: #2980b9;
      font-size: 16px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #3498db;
      font-weight: bold;
    }
    .commentary {
      background: #e8f4f8;
      padding: 15px;
      border-radius: 6px;
      line-height: 1.7;
      font-size: 13px;
    }
    .essay-content {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid #3498db;
      white-space: pre-wrap;
      line-height: 1.8;
      font-size: 13px;
    }
    .feedback-item {
      background: #f8f9fa;
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      border-left: 3px solid #3498db;
    }
    .feedback-item.error {
      border-left-color: #e74c3c;
      background: #fdf2f2;
    }
    .feedback-item.improvement {
      border-left-color: #f39c12;
      background: #fef9e7;
    }
    .feedback-item.highlight {
      border-left-color: #27ae60;
      background: #eafaf1;
    }
    .feedback-item .segment {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
    }
    .feedback-item .explanation {
      color: #555;
      font-size: 12px;
      margin-bottom: 3px;
    }
    .feedback-item .suggestion {
      color: #2980b9;
      font-size: 12px;
      font-style: italic;
    }
    .stats {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    .stat-item {
      flex: 1;
      text-align: center;
      padding: 10px;
      background: #ecf0f1;
      border-radius: 6px;
    }
    .stat-item .number {
      font-size: 20px;
      font-weight: bold;
      color: #2c3e50;
    }
    .stat-item .label {
      font-size: 11px;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>英语作文AI批阅报告</h1>
      <h2>${record.imageName || '作文批阅'}</h2>
    </div>

    <div class="score-section">
      <div class="score-card">
        <div class="label">总体评分</div>
        <div class="value">${result.totalScore}</div>
      </div>
      <div class="score-card">
        <div class="label">语法得分</div>
        <div class="value">${result.grammarScore}</div>
      </div>
      <div class="score-card">
        <div class="label">词汇得分</div>
        <div class="value">${result.vocabScore}</div>
      </div>
    </div>

    <div class="section">
      <h2>专家点评</h2>
      <div class="commentary">${result.commentary || '暂无点评'}</div>
    </div>

    <div class="section">
      <h2>作文原文</h2>
      <div class="essay-content">${result.rawText}</div>
    </div>

    ${feedbacks.length > 0 ? `
    <div class="section">
      <h2>详细反馈 (${feedbacks.length}条)</h2>
      
      <div class="stats">
        <div class="stat-item">
          <div class="number">${errors.length}</div>
          <div class="label">语法错误</div>
        </div>
        <div class="stat-item">
          <div class="number">${improvements.length}</div>
          <div class="label">改进建议</div>
        </div>
        <div class="stat-item">
          <div class="number">${highlights.length}</div>
          <div class="label">精彩亮点</div>
        </div>
      </div>

      ${feedbacks.map((f, i) => `
      <div class="feedback-item ${f.type}">
        <div class="segment">${i + 1}. "${f.segment}"</div>
        <div class="explanation">${f.explanation}</div>
        ${f.suggestion ? `<div class="suggestion">💡 建议：${f.suggestion}</div>` : ''}
      </div>
      `).join('')}
    </div>
    ` : ''}

    <div style="margin-top: 30px; text-align: center; color: #95a5a6; font-size: 11px;">
      导出日期：${formatDate(Date.now())} | 年级水平：${getGradeLabel(result.gradeLevel)}
    </div>
  </div>
</body>
</html>`;
}

export async function exportEssayToPDF(record: EssayRecord, result: AnalyzeResult): Promise<void> {
  const htmlContent = generateReportHTML(record, result);
  
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = 'white';
  document.body.appendChild(container);
  
  try {
    await document.fonts.ready;
    
    // 等待一下确保布局完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
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
    
    const filename = generateSafeFilename(record.imageName || 'essay', 'pdf');
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportEssayToDOCX(record: EssayRecord, result: AnalyzeResult): Promise<void> {
  const feedbacks = result.feedbacks || [];
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: '英语作文AI批阅报告',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '作文名称：', bold: true }),
        new TextRun({ text: record.imageName || '未命名' })
      ],
      spacing: { after: 100 }
    }),
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
    })
  );

  children.push(
    new Paragraph({
      text: '专家点评',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 }
    }),
    new Paragraph({
      text: result.commentary || '暂无点评',
      spacing: { after: 200 }
    })
  );

  children.push(
    new Paragraph({
      text: '作文原文',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 }
    }),
    new Paragraph({
      text: result.rawText,
      spacing: { after: 200 }
    })
  );

  if (feedbacks.length > 0) {
    children.push(
      new Paragraph({
        text: `详细反馈 (${feedbacks.length}条)`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 }
      })
    );

    feedbacks.forEach((f, i) => {
      const typeLabel = f.type === 'error' ? '【语法错误】' : 
                       f.type === 'improvement' ? '【改进建议】' : '【精彩亮点】';
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. ${typeLabel} `, bold: true }),
            new TextRun({ text: `"${f.segment}"` })
          ],
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: f.explanation,
          spacing: { after: 50 },
          indent: { left: 360 }
        })
      );

      if (f.suggestion) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '建议：', bold: true, size: 20 }),
              new TextRun({ text: f.suggestion, size: 20 })
            ],
            spacing: { after: 150 },
            indent: { left: 360 }
          })
        );
      }
    });
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  const filename = generateSafeFilename(record.imageName || 'essay', 'docx');
  saveAs(blob, filename);
}

export function exportEssayToMarkdown(record: EssayRecord, result: AnalyzeResult): void {
  const feedbacks = result.feedbacks || [];
  let markdown = `# 英语作文AI批阅报告\n\n`;
  
  markdown += `## 基本信息\n\n`;
  markdown += `- **作文名称**：${record.imageName || '未命名'}\n`;
  markdown += `- **总体评分**：${result.totalScore}/100\n`;
  markdown += `- **语法得分**：${result.grammarScore}/100\n`;
  markdown += `- **词汇得分**：${result.vocabScore}/100\n`;
  markdown += `- **年级水平**：${getGradeLabel(result.gradeLevel)}\n\n`;

  markdown += `## 专家点评\n\n`;
  markdown += `${result.commentary || '暂无点评'}\n\n`;

  markdown += `## 作文原文\n\n`;
  markdown += '\`\`\`\n';
  markdown += result.rawText;
  markdown += '\n\`\`\`\n\n';

  if (feedbacks.length > 0) {
    markdown += `## 详细反馈 (${feedbacks.length}条)\n\n`;
    
    feedbacks.forEach((f, i) => {
      const typeLabel = f.type === 'error' ? '语法错误' : 
                       f.type === 'improvement' ? '改进建议' : '精彩亮点';
      markdown += `### ${i + 1}. ${typeLabel}\n\n`;
      markdown += `**原文**："${f.segment}"\n\n`;
      markdown += `**说明**：${f.explanation}\n\n`;
      if (f.suggestion) {
        markdown += `**建议**：${f.suggestion}\n\n`;
      }
    });
  }

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const filename = generateSafeFilename(record.imageName || 'essay', 'md');
  saveAs(blob, filename);
}

export function exportEssayToHTML(record: EssayRecord, result: AnalyzeResult): void {
  const htmlContent = generateReportHTML(record, result);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const filename = generateSafeFilename(record.imageName || 'essay', 'html');
  saveAs(blob, filename);
}

export async function exportEssayReport(record: EssayRecord, result: AnalyzeResult, format?: ExportFormat): Promise<void> {
  // 如果没有指定格式，默认使用 PDF
  const exportFormat = format || 'pdf';
  
  switch (exportFormat) {
    case 'pdf':
      await exportEssayToPDF(record, result);
      break;
    case 'docx':
      await exportEssayToDOCX(record, result);
      break;
    case 'md':
      exportEssayToMarkdown(record, result);
      break;
    case 'html':
      exportEssayToHTML(record, result);
      break;
    default:
      await exportEssayToPDF(record, result);
  }
}
