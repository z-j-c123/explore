# 探店备忘

记录美团等平台吃过的店铺：截图、评分、备注，下次点餐前先查，避免重复踩雷。

## 功能

- 手动输入店名、平台、地址
- 上传店铺截图（本地存 `uploads/`，Vercel 上用 Blob 存储）
- 1–5 星评分与备注
- 搜索、按评分筛选、标记「愿意再去」
- 统计：总店数、均分、雷区（≤2 分）数量

## 本地开发

需要 **Node.js 20+** 与 **PostgreSQL**。

```bash
cp .env.example .env
# 编辑 DATABASE_URL

npm install
npx prisma migrate dev
npm run start:dev
```

浏览器打开 http://localhost:3000

## 部署到 Vercel

1. 将本目录推送到 GitHub（仓库根目录即本项目，或把 `prom` 设为 Vercel 的 Root Directory）。

2. 在 [Vercel](https://vercel.com) 导入项目，**Framework Preset** 选 **Other** 或让 Vercel 自动识别 NestJS。

3. 添加 **Postgres**（Storage → Create Database → Postgres），会自动设置 `DATABASE_URL`。

4. （推荐）添加 **Blob** 存储，用于生产环境截图；会自动设置 `BLOB_READ_WRITE_TOKEN`。未配置时仅本地 `uploads` 可用，无持久化。

5. 环境变量（若未自动注入）：
   - `DATABASE_URL` — PostgreSQL 连接串
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob 令牌（可选）

6. 部署。构建命令使用 `npm run vercel-build`（已写在 `vercel.json`），会自动执行 `prisma migrate deploy` 与 `nest build`。

7. 访问分配的域名即可使用 Web 界面；API 前缀为 `/api/shops`。

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/shops` | 列表，支持 `q`、`minRating`、`maxRating`、`wouldRetry` |
| GET | `/api/shops/stats` | 统计 |
| GET | `/api/shops/:id` | 详情 |
| POST | `/api/shops` | 新增（`multipart/form-data`，字段 `image` 可选） |
| PATCH | `/api/shops/:id` | 更新 |
| DELETE | `/api/shops/:id` | 删除 |

## 技术栈

NestJS · Prisma · PostgreSQL · Vercel Blob · 静态前端（`public/`）
