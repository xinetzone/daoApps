# daoApps 前端 Monorepo 项目完整技术分析报告

> **报告生成日期**：2026-04-08
> **项目版本**：v0.5.5
> **报告范围**：前端 Monorepo 完整技术架构、工程体系、部署方案

---

## 目录

1. [执行摘要](#1-执行摘要)
2. [项目架构概览](#2-项目架构概览)
3. [技术栈详情](#3-技术栈详情)
4. [前端应用功能描述](#4-前端应用功能描述)
5. [共享包架构](#5-共享包架构)
6. [包管理方案](#6-包管理方案)
7. [构建与部署流程](#7-构建与部署流程)
8. [CI/CD 配置](#8-cicd-配置)
9. [代码规范与最佳实践](#9-代码规范与最佳实践)
10. [配置文件说明](#10-配置文件说明)
11. [API 网关架构](#11-api-网关架构)
12. [工程工具与脚本](#12-工程工具与脚本)
13. [当前状态与优化建议](#13-当前状态与优化建议)
14. [文件路径速查表](#14-文件路径速查表)

---

## 1. 执行摘要

### 1.1 项目概述

**daoApps** 是"道源（Taolib）"平台的独立前端 Monorepo 仓库，于 2026-04-06 从 `tao` 后端仓库分离而来（v0.5.5）。项目以 pnpm workspace 为基础，统一管理 9 个 React 前端应用及 3 个共享包，服务于个人写作平台、工具应用、管理后台等多个业务场景。

### 1.2 核心定位

| 维度 | 描述 |
|------|------|
| 项目性质 | 前端独立 Monorepo，与后端 `tao` 仓库解耦 |
| 应用数量 | 9 个前端应用 + 3 个共享包 |
| 目标用户 | 个人用户（工具类应用）、平台管理员（后台管理类应用） |
| 部署目标 | 容器化（Podman/Docker）、Kubernetes、Systemd |
| 包命名规范 | 统一使用 `@tao/` 作用域 |

### 1.3 核心特征

- **纯 ESM 代码库**：所有应用和包强制使用 ECMAScript Modules，无 CommonJS 代码
- **类型安全优先**：全量 TypeScript，配合 OpenAPI 自动生成 API 类型
- **多阶段容器构建**：统一 `Containerfile.pnpm` + 参数化 `APP_NAME`，一套 Dockerfile 覆盖所有前端应用
- **前后端完全分离**：前端通过 API 网关（Nginx）访问独立部署的后端微服务
- **工程工具完备**：18 个自动化脚本覆盖构建、部署、图片同步、类型生成等全流程

---

## 2. 项目架构概览

### 2.1 顶层目录结构

```
daoApps/
├── apps/                    # 9 个前端应用（React + Vite）
│   ├── forum/               # Nexus 社区论坛
│   ├── config-center/       # 配置中心管理面板
│   ├── oauth-admin/         # OAuth 提供商管理
│   ├── growth-tracker/      # 个人成长追踪
│   ├── habit-tracker/       # 习惯养成追踪
│   ├── moodflow/            # 情绪记录分析
│   ├── xinyu/               # 心灵寄语
│   ├── time-capsule/        # 数字时间胶囊
│   └── qrcode-studio/       # 二维码生成工具
├── packages/                # 3 个共享包
│   ├── shared/              # @tao/shared：工具函数、通用类型
│   ├── ui/                  # @tao/ui：通用 UI 组件库
│   └── api-client/          # @tao/api-client：API 客户端 + 生成类型
├── deploy/                  # 部署配置
│   ├── frontend/            # 前端容器构建文件 + Nginx 配置
│   ├── gateway/             # API 网关容器 + Nginx 配置
│   ├── compose/             # Podman Compose 编排
│   ├── k8s/                 # Kubernetes Kustomize 配置
│   ├── services/            # 后端服务容器配置
│   └── systemd/             # Systemd 服务单元
├── schemas/                 # OpenAPI JSON Schema（后端导出）
│   ├── config_center.json
│   ├── data_sync.json
│   └── email_service.json
├── scripts/                 # 18 个工程自动化脚本
├── assets/                  # 图片资源集中管理（单一真实来源）
│   └── images/
├── package.json             # Monorepo 根配置
├── pnpm-workspace.yaml      # pnpm 工作空间声明
├── pnpm-lock.yaml           # 依赖锁文件（152.5 KB）
├── .npmrc                   # pnpm 行为配置
├── .editorconfig            # 编辑器规范
├── .env.example             # 环境变量模板
└── config-template.toml     # 项目配置模板（含里程碑）
```

### 2.2 架构理念

**分层解耦架构**：

```
[用户浏览器]
      ↓
[前端应用容器] (nginx:alpine, 静态文件服务)
      ↓ /api/*
[API 网关] (nginx:1.27-alpine)
      ↓ 路由分发
┌─────────────────────────────────────────┐
│  config-center(:8000)  data-sync(:8001) │
│  log-platform(:8100)   qrcode(:5174)    │
└─────────────────────────────────────────┘
      ↓
[基础设施] MongoDB / Redis / Elasticsearch
```

### 2.3 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| Monorepo 工具 | pnpm workspace | 原生支持、性能好、无额外框架依赖 |
| 构建工具 | Vite | 开发时极速 HMR，生产构建基于 Rollup |
| UI 框架 | React 18 | 成熟生态，团队熟悉度高 |
| 模块规范 | 纯 ESM | 现代标准，避免 CJS/ESM 互操作问题 |
| 容器引擎 | Podman（优先）/ Docker | 无 daemon 进程，rootless 更安全 |
| 类型生成 | openapi-typescript | 从 OpenAPI Schema 自动生成，类型安全 |

---

## 3. 技术栈详情

### 3.1 核心技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **运行时** | Node.js | >=20 | 构建环境要求 |
| **包管理** | pnpm | 9.15.4（锁定） | Monorepo 依赖管理 |
| **UI 框架** | React | ^18.3.0 | 所有前端应用 |
| **语言** | TypeScript | ^5.6.0 | 类型安全 |
| **构建工具** | Vite | （各应用配置） | 开发服务器 + 生产构建 |
| **样式框架** | Tailwind CSS | （各应用配置） | 原子化 CSS |
| **路由** | React Router 7 | （forum 应用） | 页面路由（仅 forum 使用） |
| **状态管理** | Zustand | （config-center） | 轻量状态管理 |
| **表单** | React Hook Form | （config-center） | 表单状态管理 |
| **图表** | Recharts | （growth-tracker） | 数据可视化 |
| **日期处理** | date-fns | ^3.6.0 | 日期工具函数 |
| **图标库** | lucide-react | ^0.400.0 | UI 图标 |

### 3.2 工程化工具

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **测试框架** | Vitest | ^2.0.0 | 单元测试 |
| **测试工具** | @testing-library/react | ^16.0.0 | React 组件测试 |
| **DOM 模拟** | jsdom | ^25.0.0 | 测试环境 DOM |
| **类型生成** | openapi-typescript | ^7.0.0 | OpenAPI → TS 类型 |
| **类变体** | class-variance-authority | ^0.7.0 | 组件样式变体管理 |
| **类名合并** | clsx + tailwind-merge | ^2.1.1 / ^2.6.0 | 条件类名合并 |

### 3.3 部署技术栈

| 分类 | 技术 | 用途 |
|------|------|------|
| **Web 服务器** | Nginx (nginx:alpine) | 前端静态文件服务 + SPA 路由 |
| **API 网关** | Nginx (nginx:1.27-alpine) | 反向代理 + 路由分发 + 安全头 |
| **容器引擎** | Podman / Docker | 容器构建与运行 |
| **编排工具** | Podman Compose | 本地多容器编排 |
| **K8s 配置** | Kustomize | Kubernetes 资源管理 |
| **系统服务** | Systemd | 服务器 Pod 生命周期管理 |

### 3.4 CI/CD 技术栈

| 工具 | 用途 |
|------|------|
| GitHub Actions | 自动化 CI/CD 流水线 |
| actions/checkout@v4 | 代码检出 |
| actions/setup-node@v4 | Node.js 环境配置 |
| pnpm/action-setup@v4 | pnpm 安装 |
| actions/cache@v4 | pnpm store 缓存 |
| docker/setup-buildx-action@v3 | Docker Buildx 构建环境 |
| docker/build-push-action@v6 | 容器镜像构建 |
| aquasecurity/trivy-action | 容器镜像安全扫描 |

---

## 4. 前端应用功能描述

所有应用统一使用 React 18 + TypeScript + Vite + Tailwind CSS 技术栈，纯 ESM 模块规范，包名统一采用 `@tao/<app-name>` 格式。

### 4.1 应用总览

| 应用名 | 目录 | 中文名 | 类型 |
|--------|------|--------|------|
| forum | `apps/forum/` | Nexus 社区论坛 | 社区类 |
| config-center | `apps/config-center/` | 配置中心管理面板 | 管理后台 |
| oauth-admin | `apps/oauth-admin/` | OAuth 提供商管理 | 管理后台 |
| growth-tracker | `apps/growth-tracker/` | 个人成长追踪 | 工具类 |
| habit-tracker | `apps/habit-tracker/` | 习惯养成追踪 | 工具类 |
| moodflow | `apps/moodflow/` | 情绪记录分析 | 工具类 |
| xinyu | `apps/xinyu/` | 心灵寄语 | 工具类 |
| time-capsule | `apps/time-capsule/` | 数字时间胶囊 | 工具类 |
| qrcode-studio | `apps/qrcode-studio/` | 二维码生成工具 | 工具类 |

### 4.2 各应用详细描述

#### forum — Nexus 社区论坛

- **功能定位**：社区讨论平台，支持话题发布、评论互动
- **特殊技术选型**：
  - **React Router 7**（项目中唯一使用路由库的应用），支持多页面导航
  - Tailwind CSS 进行样式定制
- **说明**：9 个应用中路由复杂度最高的应用

#### config-center — 配置中心管理面板

- **功能定位**：JWT 认证的后台管理面板，用于管理 Config Center 服务的配置
- **特殊技术选型**：
  - **Zustand**：全局状态管理（JWT Token 等认证状态）
  - **React Hook Form**：复杂表单场景的受控表单管理
  - **API 代理**：通过 Nginx 代理到后端 config-center 服务（`:8000`）
- **容器化支持**：已在 CI/CD 和 Podman Compose 中配置容器构建

#### oauth-admin — OAuth 提供商管理面板

- **功能定位**：管理 OAuth 认证提供商配置（GitHub、Google 等）
- **技术选型**：React + TypeScript 标准栈
- **容器化支持**：已在 CI/CD 和 Podman Compose 中配置容器构建

#### growth-tracker — 个人成长追踪

- **功能定位**：技能追踪、目标管理、个人成长数据可视化
- **特殊技术选型**：
  - **Recharts**：数据图表可视化（成长趋势、技能雷达图等）
  - **date-fns**：日期格式化与计算

#### habit-tracker — 习惯养成追踪

- **功能定位**：习惯养成记录、打卡、成就系统
- **特殊技术选型**：
  - **Zustand 持久化**：习惯数据本地持久化存储
  - **成就系统**：游戏化设计，提升用户粘性

#### moodflow — 情绪记录分析

- **功能定位**：情绪记录、日记功能、情绪趋势分析
- **特殊技术选型**：
  - **AES 客户端加密**：日记内容在客户端加密后存储，保护用户隐私

#### xinyu — 心灵寄语

- **功能定位**：心灵话题引导、情感回应指南，提供情感支持类内容
- **技术选型**：React + TypeScript 标准栈

#### time-capsule — 数字时间胶囊

- **功能定位**：创建数字时间胶囊，支持加密存储和多媒体附件
- **特殊技术选型**：
  - **加密存储**：胶囊内容加密保护
  - **多媒体附件**：支持图片等多媒体内容

#### qrcode-studio — 二维码生成工具

- **功能定位**：专业二维码生成工具
- **特殊技术选型**：
  - **批量生成**：支持批量创建多个二维码
  - **Logo 嵌入**：支持在二维码中心嵌入品牌 Logo
  - **CSV 导入**：支持从 CSV 文件批量导入数据生成二维码

---

## 5. 共享包架构

### 5.1 包依赖关系图

```
@tao/api-client
    └── depends on → @tao/shared

@tao/ui
    └── depends on → @tao/shared
    └── peer depends on → react, react-dom, lucide-react

@tao/shared
    └── depends on → clsx, tailwind-merge, date-fns
```

### 5.2 @tao/shared — 基础共享库

| 属性 | 值 |
|------|-----|
| **版本** | 0.1.0 |
| **模块规范** | ESM（`"type": "module"`） |
| **入口** | `./src/index.ts` |
| **测试** | Vitest（`vitest run`） |

**核心依赖**：

| 依赖 | 版本 | 用途 |
|------|------|------|
| clsx | ^2.1.1 | 条件类名构建 |
| tailwind-merge | ^2.6.0 | Tailwind 类名冲突解决 |
| date-fns | ^3.6.0 | 日期工具函数 |
| typescript (peer) | ^5.0.0 | TypeScript 支持 |

**导出结构**：
```json
{
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  }
}
```

**包职责**：工具函数（cn() 类名合并）、通用 TypeScript 类型定义、日期处理工具

### 5.3 @tao/ui — 通用 UI 组件库

| 属性 | 值 |
|------|-----|
| **版本** | 0.1.0 |
| **模块规范** | ESM（`"type": "module"`） |
| **入口** | `./src/index.ts` |

**核心依赖**：

| 依赖 | 版本 | 类型 | 用途 |
|------|------|------|------|
| @tao/shared | workspace:* | 生产依赖 | 基础工具函数 |
| class-variance-authority | ^0.7.0 | 生产依赖 | 组件样式变体（CVA 模式） |
| react | ^18.3.0 | 对等依赖 | React 运行时 |
| react-dom | ^18.3.0 | 对等依赖 | React DOM |
| lucide-react | ^0.400.0 | 对等依赖 | 图标组件 |
| typescript | ^5.0.0 | 对等依赖 | TypeScript 支持 |

**包职责**：跨应用复用的 UI 组件（Button、Input、Card 等），采用 CVA（class-variance-authority）模式管理组件样式变体

### 5.4 @tao/api-client — API 客户端

| 属性 | 值 |
|------|-----|
| **版本** | 0.1.0 |
| **模块规范** | ESM（`"type": "module"`） |
| **入口** | `./src/index.ts` |

**核心依赖**：

| 依赖 | 版本 | 类型 | 用途 |
|------|------|------|------|
| @tao/shared | workspace:* | 生产依赖 | 基础工具函数 |
| typescript | ^5.0.0 | 对等依赖 | TypeScript 支持 |

**包职责**：
- 封装后端 API 请求逻辑
- 存放由 `gen:types` 命令自动生成的 OpenAPI TypeScript 类型（`src/generated/` 目录）
- 生成文件：`config_center.ts`、`data_sync.ts`、`email_service.ts`

### 5.5 共享包使用模式

```typescript
// 在任意应用中使用共享包（workspace 协议引用）
import { cn } from '@tao/shared'
import { Button } from '@tao/ui'
import type { paths } from '@tao/api-client/generated/config_center'
```

---

## 6. 包管理方案

### 6.1 pnpm Workspace 配置

**pnpm-workspace.yaml**：
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

声明了两个工作空间区域：`apps/`（前端应用）和 `packages/`（共享包）。

### 6.2 .npmrc 行为配置

```ini
shamefully-hoist=true        # 将依赖提升到根 node_modules（兼容某些工具）
strict-peer-dependencies=false  # 不强制对等依赖版本严格匹配
auto-install-peers=true      # 自动安装缺失的对等依赖
link-workspace-packages=true # 工作空间包使用软链接引用
```

**关键说明**：`shamefully-hoist=true` 是对某些不支持 pnpm 严格模式的工具（如部分 Vite 插件）的兼容性妥协。

### 6.3 依赖版本策略

| 策略 | 描述 |
|------|------|
| **workspace:*** | 共享包之间引用使用 workspace 协议，始终引用最新本地版本 |
| **^version** | 生产依赖允许小版本更新（语义化版本） |
| **精确锁定** | pnpm-lock.yaml（152.5 KB）锁定所有依赖的精确版本 |
| **packageManager 字段** | 根 package.json 中锁定 `pnpm@9.15.4`，防止版本不一致 |

### 6.4 根级 Scripts

```json
{
  "dev":           "pnpm -r --parallel --filter './apps/*' run dev",
  "build":         "pnpm -r --filter './apps/*' run build",
  "build:packages":"pnpm -r --filter './packages/*' run build",
  "test":          "pnpm -r --filter './packages/*' run test",
  "typecheck":     "pnpm -r run typecheck",
  "lint":          "pnpm -r run lint",
  "gen:types":     "node scripts/gen-types.mjs"
}
```

**说明**：
- `dev` 使用 `--parallel` 并行启动所有应用开发服务器
- `build` 仅构建 apps（不含 packages）
- `build:packages` 单独构建共享包（CI 中优先执行）
- `test` 只运行 packages 测试（apps 无独立测试）
- `gen:types` 从 OpenAPI schemas 生成 TypeScript 类型

---

## 7. 构建与部署流程

### 7.1 本地开发流程

```bash
# 1. 安装依赖
pnpm install

# 2. 并行启动所有应用开发服务器
pnpm dev

# 3. 或单独启动某个应用
cd apps/config-center
pnpm dev

# 4. 类型检查
pnpm typecheck

# 5. 更新 API 类型（需先导出 OpenAPI Schema）
python scripts/export_openapi.py
pnpm gen:types
```

### 7.2 生产构建流程

```bash
# 1. 构建共享包（应用依赖共享包，需先构建）
pnpm build:packages

# 2. 构建所有前端应用
pnpm build

# 3. 或构建单个应用
cd apps/config-center && pnpm build
```

### 7.3 容器化构建方案

#### 7.3.1 多阶段构建 Containerfile（`deploy/frontend/Containerfile.pnpm`）

```dockerfile
ARG NODE_VERSION=20
ARG APP_NAME

# 阶段一：构建阶段（node:20-alpine）
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# 利用 Docker 层缓存：先复制依赖描述文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/

# 仅安装目标应用及其依赖（--filter @tao/${APP_NAME}...）
RUN pnpm install --frozen-lockfile --filter @tao/${APP_NAME}...

COPY apps/${APP_NAME} ./apps/${APP_NAME}/

RUN pnpm run build

# 阶段二：生产阶段（nginx:alpine）
FROM nginx:alpine
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**设计亮点**：
- 参数化 `APP_NAME`，一套 Containerfile 构建全部 9 个应用
- 利用层缓存优化（先复制 package.json，再复制源码）
- `--filter @tao/${APP_NAME}...` 仅安装目标应用所需依赖，避免全量安装
- 最终镜像基于 nginx:alpine，体积极小

#### 7.3.2 批量构建脚本

```bash
# 构建所有应用
bash scripts/build-frontend-images.sh

# 构建指定应用
bash scripts/build-frontend-images.sh config-center oauth-admin

# 支持自定义容器引擎（默认 podman，可覆盖为 docker）
CONTAINER_ENGINE=docker bash scripts/build-frontend-images.sh
```

### 7.4 Podman Compose 部署

文件：`deploy/compose/podman-compose.yml`

**部署的服务**：

| 服务名 | 镜像 | 端口映射 | 说明 |
|--------|------|----------|------|
| gateway | localhost/taolib-gateway:latest | 80:80 | API 网关，统一入口 |
| log-platform-frontend | localhost/taolib-log-platform-frontend:latest | 3000:80 | 日志平台前端 |
| config-center-ui | localhost/taolib-config-center-ui:latest | 3001:80 | 配置中心前端 |
| oauth-admin-ui | localhost/taolib-oauth-admin-ui:latest | 3002:80 | OAuth 管理前端 |

**说明**：所有服务共享 `taolib-network`（bridge 网络），日志驱动为 json-file，健康检查基于 `/health` 端点。

### 7.5 Kubernetes 部署（Kustomize）

**命名空间**：`taolib`

**资源结构**（`deploy/k8s/base/kustomization.yaml`）：

```yaml
resources:
  - namespace.yaml
  - secrets.yaml
  # 基础设施
  - infra/mongodb.yaml
  - infra/redis.yaml
  - infra/elasticsearch.yaml
  # 应用服务
  - apps/config-center.yaml
  - apps/data-sync.yaml
  - apps/log-platform.yaml
  - apps/qrcode.yaml
  - apps/gateway.yaml
  # 前端
  - frontend/frontend.yaml
  # 网络
  - ingress.yaml

commonLabels:
  app.kubernetes.io/managed-by: kustomize
  app.kubernetes.io/part-of: taolib
```

### 7.6 Systemd 服务

文件：`deploy/systemd/taolib-pod.service`

**配置要点**：
- 工作目录：`/opt/taolib`
- 服务类型：`oneshot`（一次性），`RemainAfterExit=yes`
- 管理对象：Podman Pod（`taolib-pod`）
- 健康检查：启动后 60 秒执行 `podman-healthcheck.sh`
- 重启策略：`on-failure`，间隔 30 秒

---

## 8. CI/CD 配置

### 8.1 Frontend CI（`ci.yml`）

**触发条件**：push 或 PR 到 `main` 分支

**执行环境**：ubuntu-latest，Node.js 22

**流水线步骤**：

```
checkout
  → setup Node.js 22
    → setup pnpm 9.15.4
      → 获取 pnpm store 路径
        → 缓存 pnpm store（key: pnpm-lock.yaml hash）
          → pnpm install --frozen-lockfile
            → typecheck packages
              → test packages
                → build packages
                  → typecheck apps
                    → build apps
```

**关键配置**：
- 缓存 key 基于 `pnpm-lock.yaml` 的哈希值，锁文件变化时自动失效
- 包的 `build` 步骤加 `|| echo "No build script"` 容错（部分包未配置 build）
- 分两阶段类型检查：先 packages，再 apps（保证依赖顺序）

### 8.2 Frontend Container Build（`container.yml`）

**触发条件**（路径过滤）：以下路径变更时触发
- `apps/**`
- `packages/**`
- `deploy/frontend/**`
- `pnpm-lock.yaml`

**构建矩阵**：仅构建需要容器化的应用（`config-center`、`oauth-admin`）

**流水线步骤**：

```
checkout
  → setup Docker Buildx
    → 构建镜像（不推送，仅本地 load）
      → Trivy 漏洞扫描（CRITICAL + HIGH 退出码 1）
```

**镜像命名规范**：
```
ghcr.io/{owner}/dao-{app-name}-ui:ci
```

**安全扫描**：使用 Trivy 扫描 CRITICAL 和 HIGH 级别漏洞，发现则 CI 失败

---

## 9. 代码规范与最佳实践

### 9.1 ESM 纯化规范

所有前端应用强制为**纯 ESM 代码库**，需在三个层面同时声明：

| 层面 | 配置项 | 值 |
|------|--------|-----|
| **package.json** | `"type"` | `"module"` |
| **tsconfig.app.json** | `"module"` | `"ESNext"` |
| **index.html** | `<script>` 标签 | `type="module"` |

**禁止**：不得在前端源码中使用 `require()`、`module.exports` 等 CommonJS 语法。

### 9.2 TypeScript 严格模式

- 所有包和应用均配置 `"strict": true`
- 共享包提供 `typecheck` 脚本（`tsc --noEmit`）
- CI 中对 packages 和 apps 分别执行 typecheck

### 9.3 EditorConfig 规范（`.editorconfig`）

| 规则 | 全局默认 | 特殊覆盖 |
|------|----------|----------|
| 字符集 | UTF-8 | — |
| 行尾符 | LF | — |
| 末尾换行 | 是 | — |
| 尾随空格修剪 | 是 | Markdown 文件不修剪 |
| 缩进风格 | 空格 | Makefile 用 Tab |
| 缩进大小 | 4 | YAML/JSON/TOML 用 2 |
| Python | 4 + 最大行长 88 | — |

### 9.4 测试规范

- 测试框架：Vitest ^2.0.0（根级 devDependency）
- 测试工具：@testing-library/react ^16.0.0 + @testing-library/jest-dom ^6.0.0
- DOM 环境：jsdom ^25.0.0
- 覆盖范围：仅 `packages/` 目录（shared 包有测试，ui 和 api-client 暂无）
- CI 中通过 `pnpm -r --filter './packages/*' run test` 执行

### 9.5 图片资源管理规范

- **单一真实来源**：`assets/images/` 为所有图片资源的统一管理目录
- **禁止直接修改**：不得直接修改 `apps/*/public/images/` 下的图片
- **同步机制**：通过 `python scripts/sync_images.py` 将图片分发到各应用
- **原始图片隔离**：`assets/images/originals/` 目录不纳入 Git 版本控制

---

## 10. 配置文件说明

### 10.1 config-template.toml — 项目配置模板

这是项目的**中心化配置描述文件**，记录了项目的目录结构、端口规划、应用列表和里程碑，可通过 `scripts/load_config.py` 读取。

**核心配置段**：

| 配置段 | 内容 |
|--------|------|
| `[python]` | Python 环境路径配置 |
| `[ports]` | 服务端口分配（config-center: 8000, data-sync: 8001, analytics: 8002） |
| `[directories]` | 项目目录结构映射 |
| `[[frontend.apps]]` | 9 个前端应用的名称、路径、技术栈（数组） |
| `[env]` | 远程工具环境变量模板 |
| `[milestones.phase_*]` | 项目里程碑（A: 安全修复、B: Monorepo 基础设施、C: 共享前端包、D: 类型安全与质量提升，均已完成） |

### 10.2 .env.example — 环境变量模板

**配置分类**：

| 分类 | 变量前缀 | 说明 |
|------|----------|------|
| 网站基础信息 | `TAOLIB_SITE_*` | 标题、副标题、描述、作者、URL、数据库、管理员账号 |
| OAuth 认证 | `TAOLIB_OAUTH_*` | JWT 密钥、GitHub OAuth、Google OAuth |
| 邮件服务 | `TAOLIB_EMAIL_*` | 邮件服务商、API Key、发件地址 |
| 文件存储 | `TAOLIB_FILE_STORAGE_*` | 存储服务商、Bucket、访问密钥 |
| 分析服务 | `TAOLIB_ANALYTICS_*` | 分析开关（默认关闭） |
| 数据同步 | `TAOLIB_DATA_SYNC_*` | 同步开关（默认关闭） |
| 速率限制 | `TAOLIB_RATE_LIMIT_*` | 开关、最大请求数(100)、时间窗口(60s) |
| 环境标识 | `TAOLIB_ENV` | development / production |

### 10.3 OpenAPI Schemas（`schemas/`）

| 文件 | 服务 | OpenAPI 版本 |
|------|------|--------------|
| `config_center.json` | 配置中心（`"title": "Config Center"`） | 3.1.0 |
| `data_sync.json` | 数据同步服务 | 3.1.0 |
| `email_service.json` | 邮件服务 | 3.1.0 |

**使用流程**：
1. `python scripts/export_openapi.py` → 从后端导出最新 schema
2. `pnpm gen:types` → 从 schema 生成 TypeScript 类型到 `packages/api-client/src/generated/`

### 10.4 .gitignore 关键规则

| 类别 | 忽略规则 |
|------|----------|
| 构建输出 | `dist/`, `build/`, `out/`, `*.tsbuildinfo` |
| 依赖 | `node_modules/`, `.pnpm-store/` |
| 环境变量 | `.env`, `.env.local`（保留 `.env.example`） |
| 数据库文件 | `*.db`, `*.sqlite3` 等 |
| 图片原始文件 | `assets/images/originals/` |
| IDE | `.vscode/`（注意：根目录 .vscode 实际已提交，此规则为各子包准备） |
| Python | `__pycache__/`, `*.pyc` |
| Vite 缓存 | `vite.config.*.timestamp-*` |

### 10.5 .containerignore 规则

容器构建时排除的内容（相比 .gitignore 更精简）：

- Python 环境、虚拟环境
- 测试文件（`tests/`, `.coverage`, `htmlcov/`）
- 文档（`doc/`）
- **前端应用源码**（`apps/`, `assets/`）——构建产物不依赖源码，已通过多阶段构建处理
- 脚本（`scripts/`）、Compose 配置（`deploy/compose/`）

---

## 11. API 网关架构

### 11.1 网关架构概述

API 网关基于 `nginx:1.27-alpine` 构建，作为所有后端服务的统一入口，提供路由分发、安全防护、速率限制和健康检查。

### 11.2 上游服务定义

| 上游名称 | 默认地址 | 对应服务 |
|----------|----------|----------|
| `config-center` | `127.0.0.1:8000` | 配置中心服务 |
| `data-sync-api` | `127.0.0.1:8001` | 数据同步服务 |
| `log-platform-api` | `127.0.0.1:8100` | 日志平台服务 |
| `qrcode-api` | `127.0.0.1:5174` | QR 码服务 |

**环境适配说明**：开发环境使用 `localhost + 端口`，生产环境替换为实际主机名，容器化部署可通过 `envsubst` 注入环境变量。

### 11.3 路由规则表

| 路径前缀 | 代理目标 | 速率限制 | 说明 |
|----------|----------|----------|------|
| `GET /api/v1/config/` | `config-center/api/v1/` | 30r/s，burst=20 | 配置中心 API |
| `GET /ws/push/` | `config-center/api/v1/push/ws` | 无（WebSocket） | 配置推送 WebSocket |
| `GET /api/v1/sync/` | `data-sync-api/api/v1/` | 30r/s，burst=10 | 数据同步 API |
| `GET /api/v1/logs/` | `log-platform-api/api/v1/` | 30r/s，burst=20 | 日志平台 API |
| `GET /api/v1/qrcode/` | `qrcode-api/api/` | 30r/s，burst=10 | QR 码服务 |
| `GET /health` | 本地返回 200 | — | 网关自身健康检查 |
| `GET /health/backends` | config-center/health | — | 聚合后端健康状态 |
| `GET /health/config-center` | config-center/health | — | 配置中心健康检查 |
| `GET /health/data-sync` | data-sync/health | — | 数据同步健康检查 |
| `GET /health/log-platform` | log-platform/health | — | 日志平台健康检查 |
| `GET /health/qrcode` | qrcode/health | — | QR 码服务健康检查 |
| `/*` | — | — | 返回 404 JSON |

### 11.4 安全策略

**HTTP 安全头**：
```nginx
X-Frame-Options: SAMEORIGIN        # 防止点击劫持
X-Content-Type-Options: nosniff    # 防止 MIME 类型嗅探
X-XSS-Protection: 1; mode=block   # XSS 保护
Referrer-Policy: strict-origin-when-cross-origin  # 来源策略
```

**速率限制**：
- 限流区域：`api_limit`（10MB 内存）
- 基准速率：30 请求/秒（每 IP）
- 不同路径配置不同 burst：配置中心 burst=20，QR 码和数据同步 burst=10

**其他限制**：
- 请求体大小上限：50MB（适应文件上传场景）
- 超时配置：连接 10s / 发送 30s / 读取 30s
- WebSocket 长连接超时：3600s

### 11.5 网关容器健康检查

```dockerfile
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=5s \
    CMD wget -qO- http://localhost/health || exit 1
```

---

## 12. 工程工具与脚本

项目共有 **18 个工程自动化脚本**，分布在 `scripts/` 目录。

### 12.1 前端工具脚本

| 脚本 | 语言 | 功能描述 |
|------|------|----------|
| `gen-types.mjs` | Node.js (ESM) | 从 `schemas/*.json` 批量生成 TypeScript 类型到 `packages/api-client/src/generated/`，调用 `openapi-typescript` |
| `build-frontend-images.sh` | Bash | 批量构建前端容器镜像，支持参数指定应用，可切换 podman/docker 引擎 |
| `sync_images.py` | Python | 图片资源同步：从 `assets/images/` 同步到 `apps/*/public/images/`，支持 `--check` 干跑模式 |
| `compress_images.py` | Python | 图片压缩处理工具 |
| `export_openapi.py` | Python | 从后端服务导出 OpenAPI JSON Schema 到 `schemas/` 目录 |

### 12.2 Podman 容器管理脚本

| 脚本 | 语言 | 功能描述 |
|------|------|----------|
| `podman-build.sh` | Bash | 构建服务容器镜像 |
| `podman-start.sh` | Bash | 启动 Podman Pod 及所有容器服务 |
| `podman-stop.sh` | Bash | 停止 Podman Pod 及所有容器服务 |
| `podman-logs.sh` | Bash | 查看容器日志 |
| `podman-healthcheck.sh` | Bash | 检查所有容器健康状态 |
| `podman-test.sh` | Bash | 测试容器服务连通性 |

### 12.3 项目维护脚本

| 脚本 | 语言 | 功能描述 |
|------|------|----------|
| `load_config.py` | Python | 读取 `config-template.toml` 配置，为其他脚本提供配置数据 |
| `update_milestones.py` | Python | 更新 `config-template.toml` 中的里程碑状态 |
| `check_file_size.py` | Python | 检查文件大小，防止大文件被提交到仓库 |
| `remove_future_annotations.py` | Python | 移除 Python 代码中的 `from __future__ import annotations` 语句（向 Python 3.10+ 迁移辅助） |

### 12.4 仓库分析脚本

| 脚本 | 语言 | 功能描述 |
|------|------|----------|
| `repo_size_analyzer.py` | Python | 分析 Git 仓库体积，识别大文件，生成详细报告 |
| `run_repo_analysis.bat` | Batch | Windows 下运行仓库分析的批处理脚本 |
| `schedule_analysis.md` | Markdown | 定期分析调度计划文档 |

### 12.5 关键脚本流程：类型生成

```
后端运行 → export_openapi.py → schemas/*.json
                                      ↓
                               gen-types.mjs
                                      ↓
             packages/api-client/src/generated/*.ts
                                      ↓
                          前端应用导入类型使用
```

---

## 13. 当前状态与优化建议

### 13.1 项目成熟度

**里程碑完成情况**（截至 2026-04-07，全部完成）：

| 里程碑 | 名称 | 状态 | 完成日期 |
|--------|------|------|----------|
| Phase A | 安全修复 | ✅ 完成 | 2026-04-07 |
| Phase B | Monorepo 基础设施 | ✅ 完成 | 2026-04-07 |
| Phase C | 共享前端包 | ✅ 完成 | 2026-04-07 |
| Phase D | 类型安全与质量提升 | ✅ 完成 | 2026-04-07 |

**当前项目版本**：v0.5.5（初始独立前端仓库版本）

### 13.2 已实现的工程特性

- [x] pnpm Monorepo 工作空间
- [x] 纯 ESM 代码规范（全量）
- [x] TypeScript 类型检查（packages + apps）
- [x] OpenAPI → TypeScript 类型自动生成
- [x] 多阶段容器构建（参数化 APP_NAME）
- [x] API 网关统一入口
- [x] GitHub Actions CI（类型检查 + 测试 + 构建）
- [x] 容器安全扫描（Trivy）
- [x] 图片资源单一来源管理
- [x] 多部署方式（Compose / K8s / Systemd）

### 13.3 已知限制

| 限制 | 描述 |
|------|------|
| 共享包无独立构建步骤 | `@tao/ui` 和 `@tao/api-client` 无 `build` 脚本，直接引用 TS 源文件 |
| apps 无测试覆盖 | 仅 `@tao/shared` 有单元测试，9 个 apps 均无测试 |
| CI 容器构建仅覆盖 2 个应用 | container.yml 矩阵仅含 `config-center` 和 `oauth-admin` |
| `shamefully-hoist=true` | 依赖提升降低了 pnpm 隔离性，可能引入幽灵依赖风险 |
| 网关地址硬编码 | 上游服务地址为 `127.0.0.1`，需手动修改或 envsubst 注入 |
| README.md 为空 | 根目录 README 尚未撰写 |

### 13.4 优化建议

#### 短期优化

1. **为共享包添加构建步骤**：为 `@tao/ui` 和 `@tao/api-client` 添加 `build` 脚本（`tsc --declaration --emitDeclarationOnly` 或 Vite 库模式），解耦源码引用
2. **扩展 CI 矩阵**：将 container.yml 的矩阵扩展为所有 9 个应用
3. **添加 apps 组件测试**：为关键应用（如 config-center、forum）添加 Vitest + Testing Library 测试

#### 中期优化

4. **消除 shamefully-hoist**：逐步清理幽灵依赖，改用 `public-hoist-pattern` 精确控制提升
5. **网关环境变量化**：为 `deploy/gateway/Containerfile` 添加 `envsubst` 支持，上游地址通过环境变量注入
6. **添加 Changeset 版本管理**：引入 `@changesets/cli` 管理包版本发布

#### 长期优化

7. **引入 Turborepo 任务编排**：利用 Turborepo 的任务依赖图和远程缓存提升构建速度
8. **统一 ESLint 配置**：在根级创建共享 ESLint Flat Config，统一所有应用的代码规范
9. **完善 K8s 配置**：补充 HPA（水平自动扩缩）和 NetworkPolicy 配置

---

## 14. 文件路径速查表

### 14.1 核心配置文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 根 package.json | `package.json` | Monorepo 根配置，Scripts 入口 |
| pnpm 工作空间 | `pnpm-workspace.yaml` | 声明 apps/* 和 packages/* |
| pnpm 行为配置 | `.npmrc` | hoist、peer 依赖等策略 |
| 依赖锁文件 | `pnpm-lock.yaml` | 全量依赖精确版本（152.5 KB） |
| 编辑器规范 | `.editorconfig` | 缩进、行尾符、字符集规范 |
| 环境变量模板 | `.env.example` | 所有环境变量的说明模板 |
| 项目配置模板 | `config-template.toml` | 端口、目录、应用、里程碑 |
| 项目说明 | `AGENTS.md` | 开发者指南（AI Agent 友好格式） |
| 变更日志 | `CHANGELOG.md` | 版本历史记录 |
| Git 忽略规则 | `.gitignore` | 版本控制忽略规则 |
| 容器忽略规则 | `.containerignore` | 容器构建忽略规则 |

### 14.2 共享包

| 包 | 路径 | 说明 |
|----|------|------|
| @tao/shared | `packages/shared/package.json` | 工具函数、通用类型 |
| @tao/ui | `packages/ui/package.json` | React UI 组件库 |
| @tao/api-client | `packages/api-client/package.json` | API 客户端 + 生成类型 |

### 14.3 部署配置

| 文件 | 路径 | 说明 |
|------|------|------|
| 前端容器构建文件 | `deploy/frontend/Containerfile.pnpm` | 多阶段构建，参数化 APP_NAME |
| 前端 Nginx 配置 | `deploy/frontend/nginx.conf` | SPA 路由 + gzip + API 代理 |
| 网关容器构建文件 | `deploy/gateway/Containerfile` | nginx:1.27-alpine 基础镜像 |
| 网关 Nginx 配置 | `deploy/gateway/nginx.conf` | 路由分发 + 安全头 + 速率限制 |
| Compose 配置 | `deploy/compose/podman-compose.yml` | 本地多容器编排 |
| K8s Kustomize | `deploy/k8s/base/kustomization.yaml` | Kubernetes 资源清单 |
| Systemd 服务 | `deploy/systemd/taolib-pod.service` | Podman Pod 系统服务 |

### 14.4 CI/CD 配置

| 文件 | 路径 | 说明 |
|------|------|------|
| 前端 CI | `.github/workflows/ci.yml` | 类型检查 + 测试 + 构建 |
| 容器构建 CI | `.github/workflows/container.yml` | 容器构建 + Trivy 安全扫描 |

### 14.5 关键脚本

| 脚本 | 路径 | 说明 |
|------|------|------|
| 类型生成 | `scripts/gen-types.mjs` | OpenAPI → TypeScript 类型 |
| 批量构建镜像 | `scripts/build-frontend-images.sh` | 批量构建前端容器 |
| 图片同步 | `scripts/sync_images.py` | 图片资源分发到各应用 |
| OpenAPI 导出 | `scripts/export_openapi.py` | 从后端导出 Schema |
| 仓库分析 | `scripts/repo_size_analyzer.py` | 仓库体积分析 |
| 配置加载 | `scripts/load_config.py` | 读取 config-template.toml |

### 14.6 OpenAPI Schemas

| 文件 | 路径 | 对应服务 |
|------|------|----------|
| 配置中心 Schema | `schemas/config_center.json` | Config Center API |
| 数据同步 Schema | `schemas/data_sync.json` | Data Sync API |
| 邮件服务 Schema | `schemas/email_service.json` | Email Service API |

### 14.7 VSCode 配置

| 文件 | 路径 | 说明 |
|------|------|------|
| 工作区设置 | `.vscode/settings.json` | 保存时格式化、Ruff 修复、Python 测试配置 |
| 推荐扩展 | `.vscode/extensions.json` | Ruff、Python、Pylance、YAML、TOML 等 7 个扩展 |

---

*报告基于 daoApps v0.5.5 实际文件内容生成，所有数据均来自源文件，未作推测性添加。*
