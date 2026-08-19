# PracticeLog — 实践学习助手 设计文档

> 解决"打满全场却啥都没学到"的问题：实践前提前学习，实践中每日记录，实践后结构化复盘。

---

## 1. 产品定位

- **形态**：桌面应用（本地运行，数据在本机）
- **AI**：半自动 — AI 出草稿，人工改（审核过程 = 学习过程）
- **存储**：SQLite + 本地目录引用（项目文件留在原位，工具只记录路径和摘要）
- **定位**：私人记录为主 + 可导出项目卡片（Markdown/PDF，用于联系老师/简历）

---

## 2. 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 桌面壳 | Electron 33+ | 主进程 Node.js |
| 前端 | Vue 3 + TypeScript + Vite | 渲染进程，electron-vite 脚手架 |
| 数据库 | better-sqlite3 | SQLite，@electron/rebuild 预编译（无需 VS Build Tools） |
| 状态管理 | Pinia | Vue 3 官方推荐 |
| 路由 | Vue Router | SPA 页面导航 |
| AI | openai SDK | DeepSeek API（OpenAI 兼容），主进程调用 |
| PDF 提取 | pdf-parse | Node.js 纯 JS，无原生编译 |
| UI 组件库 | Naive UI | 现代 Vue 3 组件库，中文文档完善 |
| 导出 | markdown-it + puppeteer(可选) | Markdown 渲染 + 可选 PDF 导出 |

---

## 3. 核心流程（三阶段）

### 阶段 0：实践配置
- 新建实践记录：标题、地点、时间范围、指导老师、方向标签
- 上传/粘贴老师资料：支持本地文件（PDF/TXT/MD）、URL、GitHub 仓库地址
- 资料进入资料库（SQLite 存文本摘要 + 文件路径引用）

### 阶段 1：实践前准备（学习清单）
- AI 分析老师资料 → 生成分层学习清单（第一层必问 / 第二层加分 / 第三层了解）
- 每项：概念名称、一句话解释、为什么重要、推荐学习资源、掌握状态
- 人工逐条确认/修改/删除
- 每日打卡：勾选已学条目，写学习笔记

### 阶段 2：实践中记录
- 每日日志：今天做了什么、遇到什么问题、怎么解决的
- 问题卡片：不懂的概念/报错 → 记录 → 后续 AI 辅助解答
- 强制每日反思模板（解决"打满全场却啥都没学到"的痛点）

### 阶段 3：实践后复盘
- 关联本地项目文件夹
- AI 扫描项目（README、代码结构、git log、关键文件）→ 生成复盘草稿
- 复盘模板：
  - 项目一句话总结
  - 我实际做了什么（真实参与度，诚实标注）
  - 技术栈与我的角色
  - 遇到的问题与解决
  - 学到的东西
  - 还不懂的（面试诚实素材）
  - 面试话术
- 人工确认修改 → 生成"项目卡片"

### 导出
- 项目卡片 → Markdown/PDF（用于联系老师）
- 整体学习轨迹导出

---

## 4. 数据库设计（SQLite）

### practice（实践记录）
```sql
CREATE TABLE practice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  location TEXT,
  advisor TEXT,
  direction_tags TEXT,        -- JSON 数组，如 ["具身智能","边缘计算"]
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### material（老师资料）
```sql
CREATE TABLE material (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  practice_id INTEGER NOT NULL REFERENCES practice(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('file', 'url', 'github')),
  path_or_url TEXT NOT NULL,
  extracted_text TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### knowledge_item（学习清单）
```sql
CREATE TABLE knowledge_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  practice_id INTEGER NOT NULL REFERENCES practice(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  one_line_explain TEXT,
  importance TEXT CHECK(importance IN ('必问', '加分', '了解')),
  status TEXT DEFAULT '未学' CHECK(status IN ('未学', '学习中', '已掌握')),
  resource TEXT,
  note TEXT,
  order_index INTEGER DEFAULT 0,
  ai_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### daily_log（每日日志）
```sql
CREATE TABLE daily_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  practice_id INTEGER NOT NULL REFERENCES practice(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  what_done TEXT,
  problems TEXT,
  solutions TEXT,
  reflection TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### project_archive（项目卡片）
```sql
CREATE TABLE project_archive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  practice_id INTEGER NOT NULL REFERENCES practice(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  local_path TEXT,
  tech_stack TEXT,
  role TEXT,
  summary TEXT,
  real_involvement TEXT,      -- 真实参与度（诚实标注）
  problems_solved TEXT,
  lessons TEXT,
  unknowns TEXT,              -- 还不懂的
  interview_script TEXT,      -- 面试话术
  ai_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## 5. 页面结构

```
App
├── Dashboard（总览）
│   ├── 实践列表（卡片式，按时间排序）
│   ├── 最近日志（最近 5 条）
│   └── 学习进度统计（已学/学习中/未学 饼图）
│
├── 实践详情（三阶段标签页）
│   ├── 配置 Tab
│   │   ├── 实践信息编辑
│   │   └── 资料上传区（拖拽/粘贴/URL 输入）
│   │
│   ├── 学习清单 Tab
│   │   ├── AI 生成按钮 + 手动添加
│   │   ├── 清单列表（分层：必问/加分/了解）
│   │   ├── 每条：概念 | 解释 | 状态切换 | 笔记
│   │   └── 每日打卡区
│   │
│   ├── 每日日志 Tab
│   │   ├── 日历视图（哪天有记录）
│   │   ├── 日志编辑器（今日做了什么/问题/解决/反思）
│   │   └── 问题卡片列表
│   │
│   └── 项目复盘 Tab
│       ├── 关联项目文件夹选择器
│       ├── AI 扫描按钮
│       ├── 复盘表单（AI 草稿预填，人工修改）
│       └── 项目卡片预览 + 导出
│
└── 导出页
    ├── 选择实践/项目
    ├── 预览 Markdown
    └── 导出按钮（Markdown / PDF）
```

---

## 6. IPC 通信设计

使用 `ipcRenderer.invoke` / `ipcMain.handle`（请求-响应模式），preload 脚本通过 `contextBridge` 暴露安全 API。

| 频道 | 方向 | 说明 |
|---|---|---|
| `practice:list` | Renderer → Main | 获取所有实践 |
| `practice:create` | Renderer → Main | 创建实践 |
| `practice:update` | Renderer → Main | 更新实践 |
| `practice:delete` | Renderer → Main | 删除实践 |
| `material:list` | Renderer → Main | 获取某实践的资料列表 |
| `material:add` | Renderer → Main | 添加资料（文件路径/URL） |
| `material:extract` | Renderer → Main | 提取 PDF/TXT 文本 |
| `knowledge:list` | Renderer → Main | 获取学习清单 |
| `knowledge:generate` | Renderer → Main | AI 生成学习清单草稿 |
| `knowledge:update` | Renderer → Main | 更新单条知识项 |
| `log:list` | Renderer → Main | 获取日志列表 |
| `log:create` | Renderer → Main | 创建/更新日志 |
| `project:list` | Renderer → Main | 获取项目卡片列表 |
| `project:scan` | Renderer → Main | AI 扫描项目目录 |
| `project:generate` | Renderer → Main | AI 生成复盘草稿 |
| `export:markdown` | Renderer → Main | 导出 Markdown |
| `export:pdf` | Renderer → Main | 导出 PDF |
| `ai:config` | Renderer → Main | 设置/获取 API Key |

---

## 7. AI 集成设计

### DeepSeek 调用（主进程）
```typescript
// electron/main/ai/deepseek.ts
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

// 生成学习清单
export async function generateKnowledgeList(materials: string[]): Promise<KnowledgeItem[]>

// 生成复盘草稿
export async function generateProjectArchive(projectInfo: ProjectScanResult): Promise<ProjectArchive>
```

### AI Prompt 设计要点
- 学习清单：输入老师资料文本 → 输出分层知识点（必问/加分/了解），每项含概念+解释+重要性
- 复盘草稿：输入项目 README + 代码结构 + git log → 输出结构化复盘，特别标注"真实参与度"
- 所有 AI 输出标记 `ai_generated = 1`，用户修改后可清除标记

---

## 8. 项目目录结构

```
PracticeLog/
├── electron/
│   ├── main.ts                  # Electron 主进程入口
│   ├── preload.ts               # preload 脚本（IPC 桥接）
│   ├── database/
│   │   ├── index.ts             # 数据库连接 + 初始化
│   │   ├── schema.ts            # 建表 SQL
│   │   ├── practice.ts          # Practice CRUD
│   │   ├── material.ts          # Material CRUD
│   │   ├── knowledge.ts         # KnowledgeItem CRUD
│   │   ├── daily-log.ts         # DailyLog CRUD
│   │   └── project.ts           # ProjectArchive CRUD
│   ├── ai/
│   │   └── deepseek.ts          # DeepSeek API 调用
│   ├── handlers/
│   │   ├── practice.ts          # IPC handlers: practice:*
│   │   ├── material.ts          # IPC handlers: material:*
│   │   ├── knowledge.ts         # IPC handlers: knowledge:*
│   │   ├── log.ts               # IPC handlers: log:*
│   │   ├── project.ts           # IPC handlers: project:*
│   │   ├── export.ts            # IPC handlers: export:*
│   │   └── ai-config.ts         # IPC handlers: ai:config
│   └── utils/
│       ├── file-extract.ts      # PDF/TXT 文本提取
│       └── project-scanner.ts   # 扫描本地项目目录
│
├── src/                         # Vue 3 前端（渲染进程）
│   ├── App.vue
│   ├── main.ts
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   ├── practice.ts          # Pinia store
│   │   ├── knowledge.ts
│   │   ├── log.ts
│   │   └── project.ts
│   ├── views/
│   │   ├── Dashboard.vue
│   │   ├── PracticeList.vue
│   │   ├── PracticeDetail.vue
│   │   └── ExportView.vue
│   ├── components/
│   │   ├── practice/
│   │   │   ├── PracticeCard.vue
│   │   │   ├── PracticeForm.vue
│   │   │   └── MaterialUpload.vue
│   │   ├── knowledge/
│   │   │   ├── KnowledgeList.vue
│   │   │   ├── KnowledgeItem.vue
│   │   │   └── DailyCheckin.vue
│   │   ├── log/
│   │   │   ├── DailyLogEditor.vue
│   │   │   ├── LogCalendar.vue
│   │   │   └── ProblemCard.vue
│   │   ├── project/
│   │   │   ├── ProjectArchiveForm.vue
│   │   │   ├── ProjectCard.vue
│   │   │   └── FolderPicker.vue
│   │   └── common/
│   │       ├── AppLayout.vue
│   │       └── AiGenerateButton.vue
│   └── types/
│       └── index.ts             # TypeScript 类型定义
│
├── package.json
├── electron.vite.config.ts
├── tsconfig.json
└── DESIGN.md                    # 本文件
```

---

## 9. 环境安装与启动

```bash
# 1. 创建项目（electron-vite 脚手架）
npm create @quick-start/electron@latest . -- --template vue-ts

# 2. 安装依赖
npm install better-sqlite3 openai pdf-parse pinia vue-router naive-ui
npm install -D @electron/rebuild

# 3. 重建 better-sqlite3 预编译二进制
npx @electron/rebuild -m ./node_modules/better-sqlite3

# 4. 配置 DeepSeek API Key
# PowerShell:
$env:DEEPSEEK_API_KEY = "sk-xxxx"

# 5. 启动开发模式
npm run dev
```

---

## 10. 待定事项

- [ ] UI 组件库最终选择：Naive UI vs Element Plus（开发时根据手感决定）
- [ ] PDF 导出方案：puppeteer vs electron-pdf 或直接用 Markdown
- [ ] 是否支持 PPT 文本提取（目前不支持，提示用户导出为 PDF/TXT）
- [ ] 学习清单的 AI Prompt 细化（基于实际使用迭代）
- [ ] 打包分发：electron-builder 打包成 .exe 安装程序

---

## 11. 设计决策记录

| 决策 | 选择 | 理由 |
|---|---|---|
| 技术栈 | Electron + Vue 3 + TS | 用户选择，纯 JS 全栈，AI 辅助开发最顺畅，无需 VS Build Tools |
| 数据库 | better-sqlite3 | @electron/rebuild 提供预编译二进制，零原生编译 |
| AI 调用位置 | 主进程 | API Key 不暴露给渲染进程，避免 CORS |
| AI 模式 | 半自动 | 审核过程 = 学习过程，避免"打满全场却啥都没学到" |
| 项目文件 | 本地目录引用 | 项目留在原位，工具只记录路径，不复制文件 |
| 导出格式 | Markdown 为主 | 简单、可编辑、可版本控制，可选 PDF |
