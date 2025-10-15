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
容器安装时需考虑-npm run docker:run


数据库初始化：
npx prisma generate
先确保本地安装了postgresql，然后创建好数据库及对应访问的用户及用户密码

登陆进本地postgresql的命令行，
-- 登陆命令
psql postgres
-- 创建用户（如果还不存在）
CREATE USER stone WITH PASSWORD 'your_password';
-- 创建数据库
CREATE DATABASE stone OWNER stone;
-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE stone TO stone;
--退出

--项目文件夹下命令：-执行数据库命令
npx prisma db push
npx prisma generate
npx prisma db seed

新环境，需新构建shared包
npm run build:shared
```

#### 2. 部署管理后台
```bash
cd stoneAdmin
cp env.example .env
# 编辑 .env 配置 API 地址
npm install
npm run build:shared
npm run dev

容器-npm run docker:run
```

#### 3. 部署用户前端
```bash
cd stoneUser
cp env.example .env
# 编辑 .env 配置 API 地址
npm install
npm run build:shared
npm run dev

容器-npm run docker:run
```


## 🔧 服务配置

### 端口分配
- **stoneApi**: 3000 (API 服务)
- **stoneAdmin**: 5174 (管理后台)
- **stoneUser**: 8080 (用户前端)
- **PostgreSQL**: 5432 (数据库)
- **Redis**: 6379 (缓存)


## 📄 许可证

Apache-2.0 License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。
