import OpenAI from 'openai'
import type { ProjectScanResult } from '../utils/project-scanner'
import { getSettings } from '../settings'

let client: OpenAI | null = null

function getApiKey(): string | null {
  return getSettings().apiKey || process.env.DEEPSEEK_API_KEY || null
}

function getModel(): string {
  return getSettings().apiModel || 'deepseek-chat'
}

/** (Re)build the OpenAI client from persisted settings. Call after settings change or at startup. */
export function applyApiConfig(): void {
  const key = getApiKey()
  client = key ? new OpenAI({ baseURL: getSettings().apiBaseUrl, apiKey: key }) : null
}

export function isConfigured(): boolean {
  return !!getApiKey()
}

function getClient(): OpenAI {
  if (client) return client
  const key = getApiKey()
  if (!key) throw new Error('未配置 API Key。请在「设置」中配置 API Key。')
  client = new OpenAI({ baseURL: getSettings().apiBaseUrl, apiKey: key })
  return client
}

export interface GeneratedKnowledgeItem {
  concept: string
  one_line_explain: string
  importance: '必问' | '加分' | '了解'
  resource: string
}

/** Build the project context string shared by the items and plan prompts. */
function buildProjectContext(projectInfo: ProjectScanResult): string {
  return [
    `项目名: ${projectInfo.name}`,
    projectInfo.readme ? `README:\n${projectInfo.readme.slice(0, 4000)}` : '',
    `文件结构:\n${projectInfo.fileTree.slice(0, 2500)}`,
    projectInfo.keySources ? `关键文件源码:\n${projectInfo.keySources}` : '',
    projectInfo.gitLog ? `Git 提交记录:\n${projectInfo.gitLog}` : '',
    projectInfo.packageJson ? `package.json:\n${projectInfo.packageJson.slice(0, 2000)}` : '',
    projectInfo.stats ? `语言统计:\n${JSON.stringify(projectInfo.stats.languages)}` : ''
  ].filter(Boolean).join('\n\n')
}

/** Parse `{ "items": [...] }` and drop malformed entries (e.g. models that return
 *  items as plain strings) instead of letting `undefined` leak into DB binds. */
function parseGeneratedItems(content: string): GeneratedKnowledgeItem[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('AI 返回的内容格式异常，请重试。原始内容: ' + content.slice(0, 200))
  }
  const raw = (parsed as { items?: unknown }).items
  if (!Array.isArray(raw)) {
    throw new Error('AI 返回的内容格式异常（缺少 items 数组），请重试。原始内容: ' + content.slice(0, 200))
  }
  const items = raw.filter((it): it is GeneratedKnowledgeItem =>
    typeof it === 'object' && it !== null && typeof (it as GeneratedKnowledgeItem).concept === 'string'
  )
  if (items.length === 0) {
    throw new Error('AI 返回的内容格式异常（无有效知识点），请重试。原始内容: ' + content.slice(0, 200))
  }
  return items
}

export async function generateKnowledgeList(materials: string[]): Promise<GeneratedKnowledgeItem[]> {
  const c = getClient()
  const combinedText = materials.join('\n\n---\n\n').slice(0, 12000)

  const response = await c.chat.completions.create({
    model: getModel(),
    temperature: 0.3,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `你是一个学习助手。根据提供的老师资料，生成分层学习清单。
输出 JSON 格式：{ "items": [ { "concept": "...", "one_line_explain": "...", "importance": "必问|加分|了解", "resource": "推荐学习资源" } ] }
- 必问：核心概念，老师几乎一定会问
- 加分：进阶知识，能展现深度
- 了解：拓展内容，有时间再学
每层 3-8 项，总共 15-30 项。用中文。`
      },
      { role: 'user', content: `请根据以下资料生成学习清单：\n\n${combinedText}` }
    ]
  })

  return parseGeneratedItems(response.choices[0]?.message?.content ?? '')
}

/** Generate a catch-up learning checklist from a completed local project's scanned contents. */
export async function generateKnowledgeListFromProject(projectInfo: ProjectScanResult): Promise<GeneratedKnowledgeItem[]> {
  const c = getClient()
  const context = buildProjectContext(projectInfo)

  const response = await c.chat.completions.create({
    model: getModel(),
    temperature: 0.4,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `你是一个学习规划助手。用户完成了一个本地项目，但当初是照葫芦画瓢做出来的，对里面的核心概念并不真正理解，需要补课。
请根据项目代码、README、依赖与提交记录，识别该项目用到的主要技术/概念，生成一份分层补课学习清单。
输出 JSON 格式：{ "items": [ { "concept": "...", "one_line_explain": "...", "importance": "必问|加分|了解", "resource": "推荐学习资源" } ] }
- 必问：完成这个项目时一定接触过、被追问时几乎必答的核心概念
- 加分：进阶知识，能展现深度
- 了解：拓展内容，有时间再学
每层 3-8 项，总共 15-30 项。
要求：
- concept 要具体（如 "Action Chunking"、"FTS5 全文检索"、"contextIsolation"），不要泛泛的 "机器学习"
- one_line_explain 用一两句话讲清楚，尽量结合项目里的实际用法（如某个参数/文件）
- resource 给出可直接搜索的关键词或资料名
用中文。`
      },
      { role: 'user', content: `请根据以下项目信息生成补课学习清单：\n\n${context}` }
    ]
  })

  return parseGeneratedItems(response.choices[0]?.message?.content ?? '')
}

/** Generate both a catch-up knowledge list AND a day-by-day study plan from a completed project.
 *  Uses two sequential API calls: items (JSON) then plan (plain markdown) —
 *  embedding a 200-line markdown inside a JSON string is unreliable for LLMs. */
export async function generateStudyPlanAndItems(
  projectInfo: ProjectScanResult
): Promise<{ items: GeneratedKnowledgeItem[]; planMd: string }> {
  // --- Call 1: generate items (JSON) ---
  const items = await generateKnowledgeListFromProject(projectInfo)

  // --- Call 2: generate plan as plain markdown (no JSON wrapping) ---
  const c = getClient()
  const context = buildProjectContext(projectInfo)
  const itemsSummary = items
    .map((it, i) => `${i + 1}. [${it.importance}] ${it.concept} — ${it.one_line_explain}`)
    .join('\n')

  const planResponse = await c.chat.completions.create({
    model: getModel(),
    temperature: 0.4,
    max_tokens: 8192,
    messages: [
      {
        role: 'system',
        content: `你是一个学习规划助手。用户完成了一个本地项目，但当初是照葫芦画瓢做出来的，对里面的核心概念并不真正理解，需要补课。

我会给你"项目信息"和"已识别的补课知识点清单"。请基于这些内容，生成一份两周可执行补课计划。

直接输出 Markdown 格式，不要输出 JSON，不要输出多余的说明文字。格式严格遵守：

## 两周补课计划

### 第一周：搞懂你用过的每个东西是什么

#### Day 1：主题名（2 小时）

**目标**：能用一两句话解释清楚

**做什么**：
- 搜索关键词：\`关键词1\`、\`关键词2\`
- 重点理解：
  1. 要点1（结合项目里具体文件/参数/配置来解释，如"你 train.py 里的 BATCH_SIZE=8 为什么是 8 而不是 32？显存不够"）
  2. 要点2
- 看完后回答：
  1. 问题1？
  2. 问题2？

**产出**：在笔记里写下你的答案

---

（每天一个主题，6 天学习 + Day7 回顾，概念按难度递进排列）

### 第二周：能讲清楚、能被追问

（Day8 训练参数逐条解释 / Day9 Loss 含义 / Day10 评测协议设计 / Day11 Sim-to-Real / Day12 代码调用链 / Day13-14 模拟面试）

### 模拟面试

（10 个具体问题，基于项目实际，要求不看笔记 1-2 分钟回答，答不上来的记下来当天补）

### 每天学习的固定格式

1. 搜索关键词（用百度/B站/知乎，中文就行）
2. 读/看 1-2 篇内容
3. 回答当天的"产出"问题（写在笔记里）
4. 尝试用自己的话复述一遍

### 关于"能不能看懂"的标准

能看懂的标准不是推公式，而是：
- 别人问你某个概念，你能用**自己的话**说清楚
- 别人问你某个设计决策，你能说出**原因**
- 别人问你某个指标，你能说出**大致含义**

**这就够了。** 老师/面试官不会让你推公式，但会看你**是否理解自己做过的事情**。

---

写作风格：
- 用"你"直接对话，像耐心的学长给学弟讲解
- 每个概念用类比或直觉解释（如"Action Chunking 类比：开车不是每毫秒打方向盘"）
- 直接引用项目里的文件名、参数、提交记录（如"你 train_smolvla_3cam.py 里的 LEARNING_RATE=5e-5"）
- 搜索关键词要具体可搜索（百度/B站/知乎/CSDN）
- 产出问题要能检验理解，不能只看不练
- 中文为主

两周后你会发现：原来这些东西没那么难，只是之前没人用你能听懂的方式解释过。`
      },
      {
        role: 'user',
        content: `项目信息：\n\n${context}\n\n\n已识别的补课知识点：\n${itemsSummary}\n\n请基于以上项目信息和知识点，生成两周补课计划。直接输出 Markdown。`
      }
    ]
  })

  const planMd = planResponse.choices[0]?.message?.content ?? ''
  return { items, planMd }
}

export interface GeneratedProjectArchive {
  name: string
  tech_stack: string
  role: string
  summary: string
  real_involvement: string
  problems_solved: string
  lessons: string
  unknowns: string
  interview_script: string
}

export async function generateProjectArchive(projectInfo: ProjectScanResult): Promise<GeneratedProjectArchive> {
  const c = getClient()

  const context = [
    `项目名: ${projectInfo.name}`,
    projectInfo.readme ? `README:\n${projectInfo.readme.slice(0, 3000)}` : '',
    `文件结构:\n${projectInfo.fileTree.slice(0, 2000)}`,
    projectInfo.gitLog ? `Git 提交记录:\n${projectInfo.gitLog}` : '',
    projectInfo.packageJson ? `package.json:\n${projectInfo.packageJson.slice(0, 2000)}` : ''
  ].filter(Boolean).join('\n\n')

  const response = await c.chat.completions.create({
    model: getModel(),
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `你是一个项目复盘助手。根据项目信息生成结构化复盘草稿。
输出 JSON 格式：
{
  "name": "项目名称",
  "tech_stack": "技术栈",
  "role": "参与者可能的角色",
  "summary": "项目一句话总结",
  "real_involvement": "根据代码/提交推测的真实参与度，诚实标注不确定性",
  "problems_solved": "可能遇到并解决的问题",
  "lessons": "可能学到的东西",
  "unknowns": "可能还不懂的（面试诚实素材）",
  "interview_script": "面试话术建议"
}
用中文，诚实客观，不夸大。real_involvement 要标注推测依据。`
      },
      { role: 'user', content: `请根据以下项目信息生成复盘草稿：\n\n${context}` }
    ]
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  try {
    return JSON.parse(content) as GeneratedProjectArchive
  } catch {
    throw new Error('AI 返回的内容格式异常，请重试。原始内容: ' + content.slice(0, 200))
  }
}
