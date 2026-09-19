# nano·banana·pie

> 一个个人学习性质的项目，通过统一的 Web 界面调用多个 AI 平台的 API。

前端提供对话、文生图 / 图生图、视频生成、TTS 等交互界面；后端（Rust + axum）
负责对话历史持久化与生成图片的本地存储。

## 功能特性

- 多平台 API 聚合：CometAPI、OpenRouter、阿里云 DashScope、火山引擎（字节）、MiloraAPI
- 多种能力：LLM 对话、Gemini 图像、GPT-Image、Qwen-Image、Seedream、视频生成、TTS
- 多用户 API Key 管理（浏览器 `localStorage`）
- 流式（SSE）响应解析与实时渲染
- 对话历史本地保存 + 后端 SQLite 持久化
- 图片通过后端文件守护进程落盘，经 `/storage` 静态服务访问
- 内置浏览器日志面板

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3、Vue Router、TypeScript、Vite 7、viewerjs、markdown-it |
| 后端 | Rust (edition 2024)、axum 0.8、tokio、sqlx (SQLite)、tower-http、uuid v7 |
| 数据库 | SQLite（`backend/data/data.db`） |

## 架构与数据流

```
浏览器 (Vue SPA, :5173)
  ├─ 直接调用各平台 API（API Key 由用户在界面录入）
  ├─ /api/dashscope  ──proxy──▶ dashscope.aliyuncs.com
  ├─ /api/openrouter ──proxy──▶ openrouter.ai
  └─ /server         ──proxy──▶ 本地后端 (:3030)
                                   ├─ POST /save  保存对话消息（multipart，含图片）
                                   ├─ POST /query 查询对话列表 / 对话 / 单条消息
                                   └─ GET  /storage/* 静态图片服务
```

## 目录结构

```
nano_banana_api/
├─ src/                     # 前端源码
│  ├─ page/                 # 页面：GeneratePage、IdentifyPage
│  ├─ component/            # 组件：display / panel / select / manager
│  ├─ core/
│  │  ├─ model/             # 各平台模型封装与请求实现
│  │  ├─ dialog/            # 对话与消息抽象、历史管理
│  │  ├─ request/           # 请求体类型
│  │  ├─ apikey/            # API Key / 用户管理
│  │  └─ util/              # 路由、日志、工具函数
│  ├─ App.vue / main.ts / Log.vue
├─ backend/                 # Rust 后端
│  ├─ src/
│  │  ├─ main.rs            # 入口、路由注册、优雅退出
│  │  ├─ config.rs          # 服务端口 (3030)
│  │  ├─ data/              # 数据库、对话、文件、状态
│  │  ├─ tool/              # 路由常量、日志、路径
│  │  ├─ localresponse/     # 统一响应封装
│  │  └─ util/              # 错误类型等
│  ├─ data/data.db          # SQLite 数据库
│  └─ .env                  # DATABASE_URL
├─ public/                  # 静态资源
├─ vite.config.ts           # 端口与代理配置
└─ package.json
```

## 快速开始

### 环境要求

- Node.js `^20.19.0 || >=22.12.0`
- Rust（支持 edition 2024 的稳定版工具链）
- Cargo

### 安装

```bash
npm install
```

### 启动（前后端同时）

```bash
npm run dev
```

或分别启动：

```bash
npm run dev:frontend   # Vite 开发服务器，默认 http://localhost:5173
npm run dev:backend    # cargo run，后端监听 127.0.0.1:3030
```

也可以直接运行 `./start.ps1`（等价于 `npm run dev`）。

### 构建

```bash
npm run build          # 类型检查 + 打包
npm run preview        # 预览构建产物
```

## 配置

### 前端代理（`vite.config.ts`）

- `/api/dashscope` → `https://dashscope.aliyuncs.com`
- `/api/openrouter` → `https://openrouter.ai`
- `/server` → `http://127.0.0.1:3030`

### 后端应用
（尚在施工阶段）

### API Key 管理

在 **Identify** 页面按用户录入各平台的 API Key，数据保存在浏览器 `localStorage`，
请求时由前端携带，不经后端转发。

## 支持的模型平台

| 来源 (`ModelSourceType`) | 说明 |
| --- | --- |
| `cometapi` | 聚合平台，支持 Chat / Gemini / 图像 / Grok 视频 |
| `openrouter` | 聚合平台，支持 Chat / 图像 / 视频 |
| `aliyun` | 阿里云 DashScope：Qwen-Image、HappyHorse / Wan 视频 |
| `bytedance` | 火山引擎：Seedream 图像 |
| `miloraapi` | MiloraAPI：TTS |

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 同时启动前端与后端 |
| `npm run dev:frontend` | 仅启动 Vite |
| `npm run dev:backend` | 仅启动 Rust 后端 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run build-only` | 仅生产构建 |
| `npm run type-check` | `vue-tsc` 类型检查 |
| `npm run preview` | 预览构建产物 |

`betool.ps1` 提供后端数据清理：`./betool.ps1 clean`。

## 说明与限制

- 本项目仅用于个人学习与实验，请自行保管 API Key，不要提交到仓库。
- 对话历史的后端数据库持久化（`localStorage`）目前仍在完善中，部分逻辑尚未启用。
- 各平台模型名称 / ID 可能随官方调整而变化，需在 `src/component/select/ModelSelect.vue` 中维护。
