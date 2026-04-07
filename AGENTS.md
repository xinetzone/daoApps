# AGENTS.md

本文档为在 daoApps 代码仓库中工作的开发者提供使用指南。

## 项目概述

daoApps 是前端 Monorepo 项目，使用 pnpm 工作空间管理多个 React 应用和共享包。

## 前端应用 (`apps/`)

所有前端 Web 应用统一放在 `apps/` 目录下，使用 React + Vite + Tailwind CSS + TypeScript 技术栈，全部采用 ESM (ECMAScript Modules) 模块规范。

| 应用 | 目录 | 技术栈 |
|------|------|--------|
| Nexus 论坛 | `${directories.apps}/forum/` | React + TypeScript + Tailwind + React Router 7 |
| 配置中心 UI | `${directories.apps}/config-center/` | React + Zustand + React Hook Form |
| OAuth 管理 | `${directories.apps}/oauth-admin/` | React + TypeScript |
| 成长追踪器 | `${directories.apps}/growth-tracker/` | React + Recharts + date-fns |
| 习惯追踪器 | `${directories.apps}/habit-tracker/` | React + TypeScript |
| 情绪流 | `${directories.apps}/moodflow/` | React + TypeScript |
| 心语 | `${directories.apps}/xinyu/` | React + TypeScript |
| 时间胶囊 | `${directories.apps}/time-capsule/` | React + TypeScript |
| 二维码工作室 | `${directories.apps}/qrcode-studio/` | React + TypeScript |

**包名规范**：所有前端应用统一使用 `@tao/` 作用域命名。

### 前端常用命令

```bash
cd apps/<app-name>
npm install           # 安装依赖
npm run dev          # 启动开发服务器
npm run build        # 生产构建
```

### ESM 模块规范

所有前端应用均为**纯 ESM 代码库**，源码中不使用 CommonJS。

**模块声明**（三个层面缺一不可）：
- `package.json`：`"type": "module"`
- `tsconfig.app.json`：`"module": "ESNext"`
- `index.html`：`<script type="module">`

### 图片资源管理

所有前端应用的图片资源集中在 `${directories.assets}/images/` 目录下管理，运行 `python scripts/sync_images.py` 将图片同步到各应用 `public/images/`。

## Monorepo 经验

- **pnpm 工作空间**：核心配置文件包括 `package.json`、`pnpm-workspace.yaml`、`.npmrc`、`pnpm-lock.yaml`
- **共享包架构**：`packages/` 目录包含 `@tao/shared`、`@tao/ui`、`@tao/api-client` 三个共享包
- **前端构建优化**：使用 Vite 的按需编译和热更新，配置合理的缓存策略
