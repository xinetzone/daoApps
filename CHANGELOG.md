# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.5] - 2026-04-06

本版本从 tao 仓库分离前端应用和 Monorepo 资源，建立独立的前端项目仓库。

### Added

- **新增 9 个前端应用**（React 18 + TypeScript + Vite + Tailwind CSS，纯 ESM）
  - `apps/forum/`：Nexus 社区讨论论坛
  - `apps/habit-tracker/`：习惯养成追踪（Zustand 持久化、成就系统）
  - `apps/time-capsule/`：数字时间胶囊（加密存储、多媒体附件）
  - `apps/growth-tracker/`：个人成长记录（技能追踪、目标管理）
  - `apps/moodflow/`：情绪记录分析（AES 客户端加密、日记功能）
  - `apps/xinyu/`：心灵寄语（话题引导、情感回应指南）
  - `apps/qrcode-studio/`：二维码生成工具（批量生成、Logo 嵌入、CSV 导入）
  - `apps/config-center/`：配置中心管理面板（JWT 认证、API 代理）
  - `apps/oauth-admin/`：OAuth 提供商管理面板
- **图片资源管理**：建立 `assets/images/` 单一真实来源 + `sync_images.py` 同步脚本

### Changed

- `.gitignore` 更新：增加前端构建产物和日志文件忽略规则
- 容器构建配置重组：服务容器文件移至 `deploy/services/` 目录
