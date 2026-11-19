# AWS SSA 刷题平台

Monorepo：AWS Solutions Architect Associate 刷题练习系统。

## 结构

```
apps/
  web/     # React 18 + Vite 主站：刷题页面（逐选项解析 + 术语表 + 日夜主题）
  admin/   # 管理端（规划中）
  api/     # Python FastAPI + SQLAlchemy + MySQL 后端：题目/答题记录/统计
packages/
  shared/  # 共享题库 questions.json（30 道 SAA 题：逐选项解析 + 考点口诀）
```

## 快速开始

```bash
# 1. 启动 MySQL
docker compose up -d

# 2. 后端（FastAPI，端口 8000）
cd apps/api
pip3 install -r requirements.txt
uvicorn main:app --reload --app-dir src   # 首次启动自动建表 + 灌入题库

# 3. 前端（Vite，端口 3000，/api 自动代理到 8000）
pnpm install
pnpm dev:web
```

## 说明

- 题库唯一来源：`packages/shared/src/questions.json`，后端 seed 与前端降级兜底共用同一份
- MySQL 未启动时，Web 端自动降级为内置题库，功能不受影响
- 答题记录写入 MySQL（`answer_logs` 表），支持 `GET /api/stats/{user_key}` 查询正确率与错题
- API 文档：http://localhost:8000/docs
