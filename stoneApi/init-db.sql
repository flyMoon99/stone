-- 初始化数据库脚本
-- 这个脚本会在PostgreSQL容器启动时自动执行
-- Stone项目 - 数据库初始化

-- 创建数据库（如果不存在）
-- 注意：在Docker环境中，主数据库已由POSTGRES_DB环境变量创建
CREATE DATABASE IF NOT EXISTS stone_dev;
CREATE DATABASE IF NOT EXISTS stone_test;

-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID生成
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- 加密函数
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- 全文搜索

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建应用专用用户（可选，增强安全性）
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'stone_app') THEN
--         CREATE ROLE stone_app WITH LOGIN PASSWORD 'your_app_password';
--         GRANT CONNECT ON DATABASE stone TO stone_app;
--         GRANT USAGE ON SCHEMA public TO stone_app;
--         GRANT CREATE ON SCHEMA public TO stone_app;
--     END IF;
-- END $$;

-- 创建审计日志函数（用于数据变更追踪）
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    -- 这里可以添加审计逻辑
    -- 记录数据变更到audit表
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 创建通用的更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 输出初始化信息
DO $$
BEGIN
    RAISE NOTICE '=== Stone项目数据库初始化完成 ===';
    RAISE NOTICE '- 时区已设置为: Asia/Shanghai';
    RAISE NOTICE '- 已创建开发和测试数据库';
    RAISE NOTICE '- 已安装必要的PostgreSQL扩展';
    RAISE NOTICE '- 已创建通用触发器函数';
    RAISE NOTICE '- Prisma将负责表结构管理';
    RAISE NOTICE '- 种子数据请运行: pnpm --filter api db:seed';
    RAISE NOTICE '==================================';
END $$;
