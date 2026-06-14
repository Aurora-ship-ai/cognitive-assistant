/**
 * AI Provider abstraction layer for domestic Chinese models.
 * Supports: DeepSeek, 通义千问 (Qwen), 智谱GLM, 讯飞
 * API keys can be passed explicitly (from client localStorage) or from env vars.
 */

import type {
  AIProvider,
  AIConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";

const PROVIDER_DEFAULTS: Record<AIProvider, Omit<AIConfig, "apiKey">> = {
  deepseek: {
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  qwen: {
    provider: "qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
  },
  zhipu: {
    provider: "zhipu",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
  },
  iflytek: {
    provider: "iflytek",
    baseUrl: "https://raasr.xfyun.cn/v2/api",
    model: "iat",
  },
};

function resolveApiKey(provider: AIProvider, explicitKey?: string): string {
  // Priority: explicit key > env var
  if (explicitKey) return explicitKey;
  if (typeof process !== "undefined") {
    const envKey = process.env[`AI_KEY_${provider.toUpperCase()}`];
    if (envKey) return envKey;
  }
  throw new Error(
    `未配置 ${provider} 的 API 密钥。请在设置页面填入密钥，或在 .env.local 中设置 AI_KEY_${provider.toUpperCase()}。`
  );
}

function getConfig(provider: AIProvider, apiKey?: string): AIConfig {
  return { ...PROVIDER_DEFAULTS[provider], apiKey: resolveApiKey(provider, apiKey) };
}

// Chat completion
export async function chatCompletion(
  request: ChatCompletionRequest,
  provider: AIProvider = "deepseek",
  apiKey?: string
): Promise<ChatCompletionResponse> {
  const config = getConfig(provider, apiKey);
  const baseUrl = config.baseUrl;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API 调用失败 (${provider}): ${response.status} - ${error.slice(0, 200)}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

// Structure a raw transcript into a document
export async function structureDocument(
  rawText: string,
  provider: AIProvider = "deepseek",
  apiKey?: string
): Promise<string> {
  const systemPrompt = `你是一位专业的教育内容组织专家。请将以下原始文本整理成结构化的学习文档。

要求：
1. 提取一个简洁的标题
2. 识别3-7个关键主题作为章节
3. 每个主题写出清晰的解释
4. 提取所有专业术语并给出定义
5. 输出格式使用Markdown，包含合适的标题层级

请直接用中文输出结构化文档。`;

  const result = await chatCompletion(
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText.slice(0, 15000) },
      ],
      temperature: 0.3,
      maxTokens: 4096,
    },
    provider,
    apiKey
  );

  return result.content;
}

// Explain captured text
export async function explainCapturedText(
  text: string,
  provider: AIProvider = "deepseek",
  apiKey?: string
): Promise<{ explanation: string; takeaways: string; tags: string[]; title: string }> {
  const systemPrompt = `你是一位知识解读专家。用户从某处截取了一段文字，请你分析。

请以JSON格式输出（不要包含markdown代码块标记）：
{
  "title": "给这段内容起一个简洁的标题（10字以内）",
  "explanation": "用通俗易懂的中文解释这段文字的核心含义，补充必要的背景知识。如果有专业术语或特殊符号，逐一解释。",
  "takeaways": "一句话总结关键要点",
  "tags": ["标签1", "标签2", "标签3"]
}`;

  const result = await chatCompletion(
    {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `请分析以下内容：\n\n${text.slice(0, 8000)}` },
      ],
      temperature: 0.5,
      maxTokens: 2048,
    },
    provider,
    apiKey
  );

  try {
    const cleaned = result.content.replace(/```json\n?|\n?```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("No JSON found");
  } catch {
    return {
      title: text.slice(0, 30),
      explanation: result.content,
      takeaways: "",
      tags: [],
    };
  }
}
