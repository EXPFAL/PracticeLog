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

export async function generateKnowledgeList(materials: string[]): Promise<GeneratedKnowledgeItem[]> {
  const c = getClient()
  const combinedText = materials.join('\n\n---\n\n').slice(0, 12000)

  const response = await c.chat.completions.create({
    model: getModel(),
    temperature: 0.3,
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

  const content = response.choices[0]?.message?.content ?? '{}'
  try {
    const parsed = JSON.parse(content) as { items?: GeneratedKnowledgeItem[] }
    return parsed.items ?? []
  } catch {
    throw new Error('AI 返回的内容格式异常，请重试。原始内容: ' + content.slice(0, 200))
  }
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
