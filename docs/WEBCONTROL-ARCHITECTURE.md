# LobsterAI WebControl 架构设计

## 目标

构建一个类似 OpenClaw 的本地 WebChat 系统：
- **主服务**：Node.js 后端，提供完整功能（文件访问、SQLite、Claude SDK）
- **WebChat**：浏览器访问的 Web UI，支持所有功能
- **无 Electron UI**：移除 Electron 渲染进程
- **无 IM 集成**：移除 Telegram/WhatsApp 等第三方 IM

## 架构图

```
┌────────────────────────────────────────────────────────────────┐
│                      WebChat (Browser)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React SPA (localhost:3001)                              │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │  │
│  │  │ Cowork UI  │ │ Settings   │ │ Skills/MCP/Task    │   │  │
│  │  │ (Chat)     │ │ Panel      │ │ Management         │   │  │
│  │  └────────────┘ └────────────┘ └────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────┘
                             │ HTTP REST + WebSocket
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                   Main Service (Node.js)                       │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Express Server (port 3001)                             │  │
│  │  ├─ REST API (/api/*)                                   │  │
│  │  ├─ WebSocket (/ws)                                     │  │
│  │  └─ Static Files (serve WebChat)                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                 │
│  ┌───────────────────────────┴─────────────────────────────┐  │
│  │                    Core Services                         │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │  │
│  │  │ SqliteStore │ │CoworkRunner │ │  SkillManager   │   │  │
│  │  │ (sql.js)    │ │(Claude SDK) │ │  (file-based)   │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │  │
│  │  │  McpStore   │ │  Scheduler  │ │ Memory System   │   │  │
│  │  │ (SQLite)    │ │ (cron jobs) │ │ (extract/judge) │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  Data: ~/.lobsterai/lobsterai.sqlite                          │
│  Skills: ~/.lobsterai/skills/                                 │
└────────────────────────────────────────────────────────────────┘
```

## 功能模块

### 1. Cowork (核心对话)
- 会话管理：创建、删除、重命名、置顶
- 消息流：发送 prompt、接收流式响应
- 权限控制：工具调用审批
- 记忆系统：自动提取和管理用户记忆
- 沙盒执行：VM 隔离运行

### 2. Skills (技能管理)
- 技能列表、启用/禁用
- 技能配置、下载
- 自动路由

### 3. MCP (模型上下文协议)
- 服务器管理：创建、编辑、删除
- 启用/禁用
- 市场浏览

### 4. Scheduled Tasks (定时任务)
- 任务 CRUD
- 手动执行、停止
- 运行历史

### 5. Settings (设置)
- API 配置（模型选择、API Key）
- Cowork 配置（工作目录、系统提示）
- 外观设置（主题、语言）

## API 设计

### REST Endpoints

```
# Cowork
POST   /api/cowork/sessions/start        # 开始新会话
POST   /api/cowork/sessions/:id/continue # 继续会话
POST   /api/cowork/sessions/:id/stop     # 停止会话
GET    /api/cowork/sessions              # 列出会话
GET    /api/cowork/sessions/:id          # 获取会话详情
DELETE /api/cowork/sessions/:id          # 删除会话
PATCH  /api/cowork/sessions/:id/pin      # 置顶/取消置顶
PATCH  /api/cowork/sessions/:id/rename   # 重命名
GET    /api/cowork/config                # 获取配置
PUT    /api/cowork/config                # 更新配置
POST   /api/cowork/permission/respond    # 响应权限请求
GET    /api/cowork/memory/entries        # 记忆列表
POST   /api/cowork/memory/entries        # 创建记忆
PUT    /api/cowork/memory/entries/:id    # 更新记忆
DELETE /api/cowork/memory/entries/:id    # 删除记忆
GET    /api/cowork/sandbox/status        # 沙盒状态
POST   /api/cowork/sandbox/install       # 安装沙盒

# Skills
GET    /api/skills                       # 列出技能
POST   /api/skills/enabled               # 启用/禁用
GET    /api/skills/:id/config            # 获取配置
PUT    /api/skills/:id/config            # 更新配置
POST   /api/skills/download              # 下载技能

# MCP
GET    /api/mcp/servers                  # 列出服务器
POST   /api/mcp/servers                  # 创建服务器
PUT    /api/mcp/servers/:id              # 更新服务器
DELETE /api/mcp/servers/:id              # 删除服务器
POST   /api/mcp/servers/:id/toggle       # 启用/禁用

# Scheduled Tasks
GET    /api/scheduled-tasks              # 列出任务
POST   /api/scheduled-tasks              # 创建任务
GET    /api/scheduled-tasks/:id          # 获取任务
PUT    /api/scheduled-tasks/:id          # 更新任务
DELETE /api/scheduled-tasks/:id          # 删除任务
POST   /api/scheduled-tasks/:id/run      # 手动运行
POST   /api/scheduled-tasks/:id/stop     # 停止运行
GET    /api/scheduled-tasks/:id/runs     # 运行历史

# Settings
GET    /api/store/:key                   # 获取配置
PUT    /api/store/:key                   # 保存配置
DELETE /api/store/:key                   # 删除配置

# API Proxy (for external LLM calls)
POST   /api/proxy/fetch                  # 普通 API 调用
POST   /api/proxy/stream                 # SSE 流式调用

# App
GET    /api/app/version                  # 版本信息
GET    /api/app/locale                   # 系统语言
POST   /api/dialog/directory             # 选择目录 (web fallback)
POST   /api/dialog/file                  # 上传文件
POST   /api/shell/open                   # 打开外部链接
```

### WebSocket Events

```typescript
// Server → Client
'cowork:message'           // 新消息
'cowork:messageUpdate'     // 消息更新（流式）
'cowork:permission'        // 权限请求
'cowork:complete'          // 会话完成
'cowork:error'             // 错误
'task:statusUpdate'        // 任务状态变化
'task:runUpdate'           // 任务运行更新
'skills:changed'           // 技能变化
'sandbox:downloadProgress' // 沙盒下载进度
'proxy:stream:data'        // API 流式数据
'proxy:stream:done'        // API 流式完成
'proxy:stream:error'       // API 流式错误

// Client → Server
'subscribe'                // 订阅房间
'unsubscribe'              // 取消订阅
```

## 开发任务分配

### Agent 1: Backend Core Server
- Express 服务器搭建
- SQLite 初始化
- 核心中间件（CORS、JSON、错误处理）
- 静态文件服务

### Agent 2: Cowork API
- 会话管理 API
- 消息流 WebSocket
- 权限处理
- 记忆系统 API

### Agent 3: Skills & MCP API
- 技能管理 API
- MCP 服务器管理 API
- 文件操作辅助

### Agent 4: Scheduler API
- 定时任务 CRUD
- 任务执行引擎
- 运行历史

### Agent 5: Frontend Core
- React 应用入口
- 路由配置
- 状态管理（Redux）
- API 客户端

### Agent 6: Frontend Cowork UI
- 会话列表
- 聊天界面
- 消息渲染（Markdown）
- 权限弹窗

### Agent 7: Frontend Settings & Management
- 设置面板
- 技能管理 UI
- MCP 管理 UI
- 定时任务 UI

## 启动命令

```bash
# 开发模式
pnpm run web:dev           # 启动主服务 + Vite 开发服务器

# 生产模式
pnpm run web:build         # 构建 WebChat
pnpm run web:start         # 启动主服务（serve 构建产物）

# 仅后端
pnpm run server:dev        # 仅启动后端服务
```

## 文件结构

```
server/
├── index.ts              # 入口
├── websocket.ts          # WebSocket 服务
├── routes/
│   ├── cowork.ts         # Cowork API
│   ├── skills.ts         # Skills API
│   ├── mcp.ts            # MCP API
│   ├── tasks.ts          # Scheduled Tasks API
│   ├── store.ts          # Key-Value Store API
│   ├── proxy.ts          # API Proxy
│   └── app.ts            # App Info API
└── services/             # 复用 src/main/libs

src/web/                  # 新的 Web 前端
├── index.html
├── main.tsx              # 入口
├── App.tsx               # 主应用
├── api/
│   ├── client.ts         # HTTP 客户端
│   └── websocket.ts      # WebSocket 客户端
├── store/                # Redux (复用 renderer/store)
├── components/
│   ├── cowork/           # Cowork UI
│   ├── settings/         # Settings UI
│   ├── skills/           # Skills UI
│   ├── mcp/              # MCP UI
│   └── tasks/            # Tasks UI
└── utils/
    └── platform.ts       # 平台检测
```
