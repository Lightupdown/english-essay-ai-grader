#!/bin/bash
# 前端部署脚本
# 需要在 /var/www/essay-grader 目录下执行

cd /var/www/essay-grader

echo "=========================================="
echo "英语作文AI批改系统 - 前端部署"
echo "=========================================="

# 1. 解压前端代码
echo "[1/2] 解压前端代码..."
if [ -f frontend.tar.gz ]; then
    rm -rf frontend
    tar -xzvf frontend.tar.gz
    mv dist frontend
    rm frontend.tar.gz
    echo "✅ 前端代码部署完成"
else
    echo "❌ 未找到 frontend.tar.gz，请先上传"
    exit 1
fi

# 2. 设置权限
echo "[2/2] 设置文件权限..."
chmod -R 755 frontend
echo "✅ 权限设置完成"

echo ""
echo "=========================================="
echo "✅ 前端部署完成！"
echo "=========================================="
