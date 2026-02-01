#!/bin/bash
# 服务器优化与基础配置脚本
# 在 Alibaba Cloud Linux 3 上执行

echo "=========================================="
echo "英语作文AI批改系统 - 服务器优化脚本"
echo "=========================================="

# 1. 配置 SWAP（2GB）
echo "[1/6] 配置 SWAP 内存..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ SWAP 配置完成"
else
    echo "✅ SWAP 已存在"
fi

# 2. 更新系统
echo "[2/6] 更新系统..."
yum update -y

# 3. 安装 Node.js 20.x
echo "[3/6] 安装 Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs
node -v
npm -v

# 4. 安装 PM2
echo "[4/6] 安装 PM2..."
npm install -g pm2

# 5. 安装 Nginx 和 Git
echo "[5/6] 安装 Nginx 和 Git..."
yum install -y nginx git

# 6. 创建项目目录
echo "[6/6] 创建项目目录..."
mkdir -p /var/www/essay-grader
cd /var/www/essay-grader

echo ""
echo "=========================================="
echo "✅ 服务器优化完成！"
echo "=========================================="
echo ""
echo "请继续执行后端部署脚本"
