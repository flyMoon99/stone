# Stone API 服务

Stone 项目的后端 API 服务，提供管理员和会员的认证、管理等功能。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (可选)

### 本地开发

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

3. **初始化数据库**
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. **启动开发服务**
```bash
npm run dev
```

服务将在 http://localhost:3000 启动

### Docker 部署

1. **使用 Docker Compose 一键部署**
```bash
# 构建并启动所有服务（PostgreSQL + Redis + API）
npm run docker:run

# 或者直接使用 docker-compose
docker-compose up -d
```

2. **仅构建 API 镜像**
```bash
npm run docker:build
```

## 📁 项目结构

```
stoneApi/
├── src/                    # 源代码
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件
│   ├── routes/            # 路由
│   ├── services/          # 业务逻辑
│   ├── utils/             # 工具函数
│   └── app.ts             # 应用入口
├── shared/                # 共享代码（类型定义、常量等）
├── prisma/                # 数据库模型和迁移
├── tests/                 # 测试文件
├── logs/                  # 日志文件
├── Dockerfile             # Docker 配置
├── docker-compose.yml     # Docker Compose 配置
└── init-db.sql           # 数据库初始化脚本
```

## 🔧 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run test` - 运行测试
- `npm run lint` - 代码检查
- `npm run db:generate` - 生成 Prisma 客户端
- `npm run db:push` - 推送数据库模式
- `npm run db:migrate` - 运行数据库迁移
- `npm run db:studio` - 打开 Prisma Studio
- `npm run db:seed` - 填充测试数据

## 🌐 API 端点

### 公共接口
- `GET /api/public/health` - 健康检查

### 管理员接口
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/profile` - 获取管理员信息
- `GET /api/admin/list` - 管理员列表
- `POST /api/admin/create` - 创建管理员
- `PUT /api/admin/update` - 更新管理员
- `DELETE /api/admin/delete` - 删除管理员

### 会员接口
- `POST /api/member/login` - 会员登录
- `GET /api/member/profile` - 获取会员信息
- `GET /api/member/list` - 会员列表
- `POST /api/member/create` - 创建会员
- `PUT /api/member/update` - 更新会员
- `DELETE /api/member/delete` - 删除会员

## 🔐 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | 数据库连接字符串 | - |
| `REDIS_URL` | Redis 连接字符串 | - |
| `ADMIN_JWT_SECRET` | 管理员 JWT 密钥 | - |
| `MEMBER_JWT_SECRET` | 会员 JWT 密钥 | - |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |

## 🐳 Docker 部署说明

### 服务组件
- **PostgreSQL**: 主数据库，端口 5432
- **Redis**: 缓存服务，端口 6379  
- **API**: 后端服务，端口 3000

### 数据持久化
- PostgreSQL 数据存储在 `postgres_data` 卷中
- Redis 数据存储在 `redis_data` 卷中
- 应用日志映射到 `./logs` 目录

### 健康检查
所有服务都配置了健康检查，确保服务正常启动和运行。

## 📝 开发注意事项

1. **共享代码**: `shared/` 目录包含类型定义、常量等共享代码
2. **数据库**: 使用 Prisma ORM，模式定义在 `prisma/schema.prisma`
3. **日志**: 使用 Winston 进行日志记录，日志文件存储在 `logs/` 目录
4. **认证**: 使用 JWT 进行身份认证，管理员和会员使用不同的密钥

## 🔍 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 环境变量
   - 确保 PostgreSQL 服务正在运行

2. **Prisma 客户端错误**
   - 运行 `npm run db:generate` 重新生成客户端

3. **端口占用**
   - 检查端口 3000 是否被其他服务占用
   - 修改 `PORT` 环境变量使用其他端口

## 📄 许可证

Apache-2.0 License
