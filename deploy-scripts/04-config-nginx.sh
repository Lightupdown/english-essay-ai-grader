#!/bin/bash
# Nginx 配置脚本

echo "=========================================="
echo "英语作文AI批改系统 - Nginx 配置"
echo "=========================================="

# 1. 创建 Nginx 配置文件
echo "[1/3] 创建 Nginx 配置..."
cat > /etc/nginx/conf.d/essay-grader.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # 前端静态文件
    location / {
        root /var/www/essay-grader/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 反向代理到 Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 文件上传大小限制
    client_max_body_size 10M;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
}
EOF
echo "✅ Nginx 配置创建完成"

# 2. 测试配置
echo "[2/3] 测试 Nginx 配置..."
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置测试通过"
else
    echo "❌ Nginx 配置有误，请检查"
    exit 1
fi

# 3. 启动 Nginx
echo "[3/3] 启动 Nginx..."
systemctl enable nginx
systemctl restart nginx
echo "✅ Nginx 已启动"

echo ""
echo "=========================================="
echo "✅ Nginx 配置完成！"
echo "=========================================="
echo ""
echo "访问地址：http://47.110.240.179"
