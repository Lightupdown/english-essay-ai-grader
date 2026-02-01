# 阿里云部署操作指南

## 📦 已准备的文件

在 `E:\english-essay-ai-grader\` 目录下已生成：
- `frontend.tar.gz` - 前端构建文件（已配置生产环境 API 地址）
- `backend.tar.gz` - 后端源代码（不含 node_modules，将在服务器安装）
- `deploy-scripts/` - 部署脚本目录

---

## 🚀 部署步骤（按顺序执行）

### 步骤 1：连接服务器

打开 PowerShell 或 CMD：

```bash
ssh root@47.110.240.179
# 输入密码：love456852
```

### 步骤 2：上传文件到服务器

**在本地 PowerShell 中执行（不要关闭 SSH 会话）：**

```bash
cd E:\english-essay-ai-grader

# 上传后端代码
scp backend.tar.gz root@47.110.240.179:/var/www/essay-grader/

# 上传前端代码
scp frontend.tar.gz root@47.110.240.179:/var/www/essay-grader/
```

### 步骤 3：在服务器上执行部署

**回到 SSH 会话中执行：**

```bash
# 1. 服务器优化（配置 SWAP、安装 Node.js、Nginx、PM2）
curl -fsSL https://raw.githubusercontent.com/nodesource/distributions/master/rpm/setup_20.x | bash -
yum update -y
yum install -y nodejs nginx git
npm install -g pm2

# 配置 SWAP
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 创建项目目录
mkdir -p /var/www/essay-grader
cd /var/www/essay-grader

# 2. 部署后端
tar -xzvf backend.tar.gz
cd backend

# 配置环境变量
cat > .env << 'EOF'
PORT=5000
MONGODB_URI=mongodb+srv://zx1411239060_db_user:love456852@cluster0.apbxmso.mongodb.net/?appName=Cluster0
JWT_SECRET=english_essay_grader_secret_2024
ZHIPU_API_KEY=7ce21e080259436e85c2f101912a10e8.iG7qtJF7VHYViMa4
DEEPSEEK_API_KEY=sk-448dd57f271742b39fc616543ceb7c33
EMAIL_USER=zx1411239060@163.com
EMAIL_PASS=DWf2gD4kZh4ZmWG6
EOF

# 安装依赖并启动
npm install
pm2 start src/index.js --name essay-backend
pm2 save
pm2 startup systemd

# 3. 部署前端
cd /var/www/essay-grader
tar -xzvf frontend.tar.gz
mv dist frontend

# 4. 配置 Nginx
cat > /etc/nginx/conf.d/essay-grader.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        root /var/www/essay-grader/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    client_max_body_size 10M;
    gzip on;
}
EOF

# 测试并启动 Nginx
nginx -t
systemctl enable nginx
systemctl restart nginx

# 5. 开放防火墙端口
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --reload

echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo "访问地址：http://47.110.240.179"
echo ""
echo "检查服务状态："
pm2 status
echo ""
echo "查看后端日志："
pm2 logs essay-backend
```

---

## ✅ 验证部署

1. **浏览器访问**：http://47.110.240.179
2. **测试 API**：
   ```bash
   curl http://47.110.240.179/api/feedback/count
   ```

---

## 🔧 常用维护命令

```bash
# 查看后端状态
pm2 status

# 查看后端日志
pm2 logs essay-backend

# 重启后端
pm2 restart essay-backend

# 重启 Nginx
systemctl restart nginx

# 查看 Nginx 日志
tail -f /var/log/nginx/error.log
```

---

## 📋 部署清单

- [ ] SSH 连接到服务器
- [ ] 上传 backend.tar.gz
- [ ] 上传 frontend.tar.gz
- [ ] 执行服务器优化命令
- [ ] 解压并部署后端
- [ ] 解压并部署前端
- [ ] 配置 Nginx
- [ ] 开放防火墙端口
- [ ] 浏览器访问验证

---

**遇到问题？** 
1. 检查各步骤的输出信息
2. 查看日志：`pm2 logs` 和 `nginx -t`
3. 确认端口是否开放

**预计部署时间：10-15 分钟**