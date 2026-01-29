/**
 * 图片压缩工具
 * 将图片压缩为缩略图存储，减少 localStorage 占用
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: string;
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 400,
  maxHeight: 600,
  quality: 0.7,
  type: 'image/jpeg',
};

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的 base64 字符串
 */
export const compressImage = (
  file: File,
  options: CompressOptions = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 计算缩放后的尺寸
        let { width, height } = img;
        
        if (width > opts.maxWidth!) {
          height = (height * opts.maxWidth!) / width;
          width = opts.maxWidth!;
        }
        
        if (height > opts.maxHeight!) {
          width = (width * opts.maxHeight!) / height;
          height = opts.maxHeight!;
        }
        
        // 创建 canvas 进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        
        // 使用更好的图片质量
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 base64
        const compressedBase64 = canvas.toDataURL(opts.type, opts.quality);
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

/**
 * 获取文件大小（KB）
 */
export const getFileSizeKB = (base64String: string): number => {
  // base64 字符串长度 * 0.75 是实际字节数
  const bytes = base64String.length * 0.75;
  return Math.round(bytes / 1024);
};

/**
 * 检查 localStorage 剩余空间
 */
export const checkStorageSpace = (): { used: number; remaining: number; total: number } => {
  const total = 5 * 1024 * 1024; // 假设 5MB 限制
  let used = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length * 2; // UTF-16 编码，每个字符2字节
    }
  }
  
  return {
    used: Math.round(used / 1024), // KB
    remaining: Math.round((total - used) / 1024), // KB
    total: Math.round(total / 1024), // KB
  };
};
