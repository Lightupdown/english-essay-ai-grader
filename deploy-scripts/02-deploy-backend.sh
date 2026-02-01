#!/bin/bash
# 后端部署脚本
# 需要在 /var/www/essay-grader 目录下执行

cd /var/www/essay-grader

echo "=========================================="
echo "英语作文AI批改系统 - 后端部署"
echo "=========================================="

# 1. 上传后端代码（手动上传 backend.tar.gz 后解压）
echo "[1/4] 解压后端代码..."
if [ -f backend.tar.gz ]; then
    tar -xzvf backend.tar.gz -C backend --strip-components=1
    rm backend.tar.gz
    echo "✅ 后端代码解压完成"
else
    echo "❌ 未找到 backend.tar.gz，请先上传"
    exit 1
fi

# 2. 配置环境变量
echo "[2/4] 配置环境变量..."
cd backend
cat > .env << 'EOF'
PORT=5000
MONGODB_URI=mongodb+srv://zx1411239060_db_user:love456852@cluster0.apbxmso.mongodb.net/?appName=Cluster0
JWT_SECRET=english_essay_grader_secret_2024
ZHIPU_API_KEY=7ce21e080259436e85c2f101912a10e8.iG7qtJF7VHYViMa4
DEEPSEEK_API_KEY=sk-448dd57f271742b39fc616543ceb7c33
EMAIL_USER=zx1411239060@163.com
EMAIL_PASS=DWf2gD4kZh4ZmWG6
EOF
echo "✅ 环境变量配置完成"

# 3. 安装依赖
echo "[3/4] 安装后端依赖..."
npm install
echo "✅ 依赖安装完成"

# 4. 启动后端服务
echo "[4/4] 启动后端服务..."
pm2 start src/index.js --name essay-backend
pm2 save
pm2 startup systemd
echo "✅ 后端服务已启动"

echo ""
echo "=========================================="
echo "✅ 后端部署完成！"
echo "=========================================="
echo ""

# 显示状态
echo "PM2 状态："
pm2 status

echo ""
echo "测试 API："
curl -s http://localhost:5000/api/feedback/count | head -c 200
echo ""
