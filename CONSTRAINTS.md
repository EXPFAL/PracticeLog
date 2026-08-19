# PracticeLog — 项目约束文档

> 所有参与本项目的 Agent 必须遵守以下规则。

---

## 1. 路径约束（最高优先级）

### 1.1 禁止污染外部目录
- **所有项目相关文件、依赖、工具、缓存必须存放在 `E:\Work\PracticeLog\` 内部**
- 禁止在 `E:\`、`C:\Users\`、桌面、文档等外部目录创建任何文件夹或文件
- 禁止在项目目录之外安装任何开发工具或依赖

### 1.2 依赖存储规范
| 内容 | 位置 | 说明 |
|---|---|---|
| 项目代码 | `E:\Work\PracticeLog\` | 项目根目录 |
| Node 依赖 | `E:\Work\PracticeLog\node_modules\` | npm install 自动处理 |
| Electron 缓存 | `E:\Work\PracticeLog\.electron-cache\` | 设置 electron_config_cache 环境变量 |
| better-sqlite3 预编译 | `E:\Work\PracticeLog\node_modules\` 内 | @electron/rebuild 自动处理 |
| 数据库文件 | `E:\Work\PracticeLog\data\practice.db` | SQLite 单文件 |
| 导出文件 | `E:\Work\PracticeLog\exports\` | 用户手动导出的 Markdown/PDF |
| 日志/临时文件 | `E:\Work\PracticeLog\.tmp\` | 开发过程中的临时文件 |

### 1.3 全局安装的例外
以下工具允许全局安装（因为它们本身需要在系统 PATH 中）：
- Node.js LTS（通过 nvm-windows 或官网安装器）
- npm（随 Node 附带）
- git（已安装）

**不允许**全局安装的：
- 任何 Android SDK / NDK / Gradle
- 任何 Java JDK（除非项目明确需要）
- 任何 Python 包（本项目不使用 Python）

---

## 2. 开发约束

### 2.1 命令执行
- 所有 `npm` 命令必须在 `E:\Work\PracticeLog\` 目录下执行
- 使用 `workdir` 参数指定工作目录，不要用 `cd` 切换
- 安装依赖时使用 `--save` 或 `--save-dev`，确保写入 package.json

### 2.2 环境变量
- `DEEPSEEK_API_KEY`：通过 PowerShell `$env:` 设置，不写入任何文件
- `electron_config_cache`：如需设置，指向 `E:\Work\PracticeLog\.electron-cache`
- `npm_config_cache`：如需自定义，指向 `E:\Work\PracticeLog\.npm-cache`
- **禁止**将 API Key 写入 `.env` 文件、代码、或任何会被提交的文件

### 2.3 配置文件
- `.gitignore` 必须包含：`node_modules/`、`*.db`、`.env`、`.electron-cache/`、`.npm-cache/`、`.tmp/`
- `electron.vite.config.ts` 中 `better-sqlite3` 必须加入 `external` 配置
- 数据库路径使用相对于项目根目录的路径，不使用绝对路径

---

## 3. 安全约束

### 3.1 敏感信息
- API Key 只在主进程中使用，不暴露给渲染进程
- preload 脚本只暴露最小必要的 IPC 接口
- 不在前端代码中硬编码任何密钥或 token

### 3.2 文件操作
- 扫描本地项目目录时，只读取，不修改用户项目文件
- 导出功能只写入 `E:\Work\PracticeLog\exports\` 目录
- 数据库备份功能将 `.db` 复制到 `exports/backup/` 下

---

## 4. 代码规范

### 4.1 TypeScript
- 严格模式（`strict: true`）
- 所有 IPC 通道定义 TypeScript 接口
- 数据库操作封装为 async 函数（虽然 better-sqlite3 是同步的，但 IPC 是异步的）

### 4.2 Vue 3
- 使用 Composition API（`<script setup>`）
- 组件文件名 PascalCase（如 `KnowledgeList.vue`）
- 使用 Pinia 管理状态，不在组件间直接传数据

### 4.3 命名规范
- 数据库表名：snake_case（如 `knowledge_item`）
- TypeScript 变量/函数：camelCase
- Vue 组件：PascalCase
- IPC 频道：`模块:操作`（如 `knowledge:generate`）

---

## 5. 禁止事项

- ❌ 在 `E:\` 根目录或项目外创建任何文件夹
- ❌ 安装 Android SDK、Java JDK、Gradle 等与本项目无关的工具
- ❌ 使用 `npm install -g` 全局安装项目依赖
- ❌ 将 API Key 写入代码或配置文件
- ❌ 修改用户的其他项目文件（LeRobot、OpenEvidence 等）
- ❌ 安装超过 500MB 的单个依赖（需先确认必要性）
- ❌ 使用 `rm -rf` 或 `Remove-Item -Recurse` 删除 `node_modules` 以外的目录

---

## 6. 依赖安装检查清单

每次安装新依赖前，Agent 必须确认：
1. 该依赖是否真的必要？有没有更轻量的替代？
2. 安装后是否会影响项目外的目录？
3. 是否需要原生编译？（优先选择有 prebuilt 的包）
4. 包的体积是否合理？

---

_文档版本：v1.0 | 创建日期：2026-08-19_
