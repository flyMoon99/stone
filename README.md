# Stone 项目 - 独立服务部署

Stone 项目已成功拆分为3个独立的服务，每个服务都可以单独部署和扩展。

## 📁 项目结构

```
stone-projects/
├── stoneApi/           # 后端 API 服务
├── stoneAdmin/         # 管理后台前端
├── stoneUser/          # 用户前端服务
└── README.md          # 本文档
```

## 🚀 快速部署

### 方式一：独立部署每个服务

#### 1. 部署 API 服务
```bash
cd stoneApi
cp env.example .env
# 编辑 .env 配置数据库等信息
npm install
npm run docker:run
```

#### 2. 部署管理后台
```bash
cd stoneAdmin
cp env.example .env
# 编辑 .env 配置 API 地址
npm install
npm run docker:run
```

#### 3. 部署用户前端
```bash
cd stoneUser
cp env.example .env
# 编辑 .env 配置 API 地址
npm install
npm run docker:run
```

### 方式二：使用统一脚本部署

创建 `deploy-all.sh` 脚本：

```bash
#!/bin/bash

# 部署 API 服务
echo "部署 API 服务..."
cd stoneApi
docker-compose up -d
cd ..

# 部署管理后台
echo "部署管理后台..."
cd stoneAdmin
docker-compose up -d
cd ..

# 部署用户前端
echo "部署用户前端..."
cd stoneUser
docker-compose up -d
cd ..

echo "所有服务部署完成！"
echo "API 服务: http://localhost:3000"
echo "管理后台: http://localhost:5174"
echo "用户前端: http://localhost:8080"
```

## 🔧 服务配置

### 端口分配
- **stoneApi**: 3000 (API 服务)
- **stoneAdmin**: 5174 (管理后台)
- **stoneUser**: 8080 (用户前端)
- **PostgreSQL**: 5432 (数据库)
- **Redis**: 6379 (缓存)

### 环境变量配置

#### stoneApi (.env)
```env
NODE_ENV=production
DATABASE_URL=postgresql://stone:stone123@localhost:5432/stone
REDIS_URL=redis://localhost:6379
ADMIN_JWT_SECRET=your-admin-secret-key
MEMBER_JWT_SECRET=your-member-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
```

#### stoneAdmin (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=Stone 管理后台
VITE_DEV_PORT=5174
```

#### stoneUser (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=Stone 用户中心
VITE_DEV_PORT=5173
```

## 🌐 服务间通信

### 开发环境
- 前端服务通过 Vite 代理访问 API
- API 服务直接连接数据库和 Redis

### 生产环境
- 前端通过环境变量 `VITE_API_BASE_URL` 配置 API 地址
- 可以使用 Nginx 反向代理统一入口

## 📊 监控和日志

### API 服务
- 健康检查: `GET /api/public/health`
- 日志文件: `stoneApi/logs/`

### 前端服务
- 健康检查: `GET /health`
- Nginx 访问日志

## 🔄 更新部署

### 更新单个服务
```bash
cd [service-directory]
git pull
npm run docker:build
docker-compose up -d
```

### 更新所有服务
```bash
# 创建 update-all.sh
#!/bin/bash
services=("stoneApi" "stoneAdmin" "stoneUser")

for service in "${services[@]}"; do
    echo "更新 $service..."
    cd $service
    git pull
    npm run docker:build
    docker-compose up -d
    cd ..
done
```

## 🛠️ 故障排除

### 常见问题

1. **API 服务无法启动**
   - 检查数据库连接
   - 确认端口 3000 未被占用
   - 查看 `stoneApi/logs/` 中的错误日志

2. **前端无法访问 API**
   - 检查 `VITE_API_BASE_URL` 配置
   - 确认 API 服务正在运行
   - 检查网络连接和防火墙设置

3. **数据库连接失败**
   - 确认 PostgreSQL 服务运行正常
   - 检查 `DATABASE_URL` 配置
   - 验证数据库用户权限

### 日志查看
```bash
# 查看 API 服务日志
docker-compose -f stoneApi/docker-compose.yml logs -f api

# 查看前端服务日志
docker-compose -f stoneAdmin/docker-compose.yml logs -f admin
docker-compose -f stoneUser/docker-compose.yml logs -f web
```

## 🔐 安全建议

1. **生产环境配置**
   - 修改默认的 JWT 密钥
   - 使用强密码配置数据库
   - 启用 HTTPS

2. **网络安全**
   - 配置防火墙规则
   - 使用 Nginx 反向代理
   - 启用访问日志监控

3. **数据备份**
   - 定期备份 PostgreSQL 数据
   - 备份应用配置文件

## 📄 许可证

Apache-2.0 License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。
