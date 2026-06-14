/**
 * 客户端 AI 调用 — 直接从浏览器调用 DeepSeek/通义千问/智谱。
 * 无需后端 API。用户密钥从 localStorage 读取。
 */

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("ai_key_deepseek") || localStorage.getItem("ai_key_qwen") || localStorage.getItem("ai_key_zhipu") || "";
}

function getConfig(): { baseUrl: string; model: string } {
  if (typeof window === "undefined") return { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" };
  if (localStorage.getItem("ai_key_deepseek")) return { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" };
  if (localStorage.getItem("ai_key_qwen")) return { baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" };
  if (localStorage.getItem("ai_key_zhipu")) return { baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" };
  return { baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" };
}

async function chat(messages: ChatMessage[], opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("请先在设置页填入 AI 密钥");
  const { baseUrl, model } = getConfig();

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: opts?.temperature ?? 0.7, max_tokens: opts?.maxTokens ?? 4096, stream: false }),
  });
  if (!res.ok) { const err = await res.text().catch(() => ""); throw new Error(`AI 调用失败 (${res.status}): ${err.slice(0, 200)}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJson(text: string): any {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(cleaned.slice(a, b + 1));
  throw new Error("No JSON");
}

// F3: 解释截取文字
export async function explainCapturedText(text: string): Promise<{ title: string; explanation: string; takeaways: string; tags: string[] }> {
  const c = await chat([{ role: "system", content: '分析截取文字。输出JSON(不含代码块)：{"title":"标题(10字)","explanation":"通俗解释","takeaways":"一句话要点","tags":["标签"]}' }, { role: "user", content: text.slice(0, 8000) }], { temperature: 0.5, maxTokens: 2048 });
  try { return parseJson(c); } catch { return { title: text.slice(0, 30), explanation: c, takeaways: "", tags: [] }; }
}

// F1/F2: 结构化文档
export async function structureDocument(text: string): Promise<string> {
  return chat([{ role: "system", content: "你是教育内容组织专家。将文本整理为结构化Markdown文档。提取标题、分节、术语定义。输出Markdown格式。" }, { role: "user", content: text.slice(0, 15000) }], { temperature: 0.3, maxTokens: 4096 });
}

// F6: 提取知识图谱
export async function extractGraph(content: string): Promise<{ nodes: Array<{ title: string; description: string; category: string }>; edges: Array<{ source: string; target: string; relationship: string; label: string }> }> {
  const c = await chat([{ role: "system", content: '从文档提取知识节点和连线。输出JSON(不含代码块)：{"nodes":[{"title":"概念","description":"一句话","category":"学科"}],"edges":[{"source":"A","target":"B","relationship":"prerequisite_of|related_to|example_of|sub_concept_of","label":"说明"}]}。最多20个节点。' }, { role: "user", content: content.slice(0, 15000) }], { temperature: 0.2, maxTokens: 3072 });
  try { return parseJson(c); } catch { return { nodes: [], edges: [] }; }
}

// F8: 检测知识缺口
export async function detectGaps(nodes: Array<{ id: string; title: string; category?: string; description?: string }>, edges: Array<{ sourceNodeId: string; targetNodeId: string; relationshipType?: string }>): Promise<Array<{ type: string; title: string; islandA: string; islandB: string; bridgeConcept: string; explanation: string; capsule: string; analogy: string; reviewQuestion: string }>> {
  const ns = nodes.map(n => `- "${n.title}" [${n.category || ""}] ${n.description || ""}`).join("\n");
  const es = edges.length > 0 ? edges.map(e => { const s = nodes.find(n => n.id === e.sourceNodeId); const t = nodes.find(n => n.id === e.targetNodeId); return `- "${s?.title || "?"}" → "${t?.title || "?"}"`; }).join("\n") : "（无连线）";
  const c = await chat([{ role: "system", content: '分析知识树缺口（孤立节点、缺桥梁概念、缺前置知识）。输出JSON(不含代码块)：{"gaps":[{"type":"isolated|missing_bridge|missing_prerequisite","title":"标题","islandA":"节点A","islandB":"节点B","bridgeConcept":"桥梁概念","explanation":"为何缺连接","capsule":"600-800字解释","analogy":"类比","reviewQuestion":"思考题"}]}。最多3个缺口，没有则空数组。' }, { role: "user", content: `知识树：\n节点：\n${ns}\n连线：\n${es}` }], { temperature: 0.4, maxTokens: 3072 });
  try { const json = parseJson(c); return json.gaps || []; } catch { return []; }
}

// F9: 形象化解释报告
export async function generateUnderstandingReport(title: string, content_text: string): Promise<string> {
  return chat([{ role: "system", content: "生成全景解读报告：🗺️知识全景图 🎨形象化比喻 🔗关联揭示 🧩拆解重构 ❓常见误解澄清。用清晰中文，各部分用 --- 分隔。" }, { role: "user", content: `知识点：${title}\n内容：${content_text.slice(0, 10000)}` }], { temperature: 0.6, maxTokens: 3072 });
}

// F10: 真实性审视报告
export async function generateScrutinyReport(title: string, content_text: string): Promise<string> {
  return chat([{ role: "system", content: "生成真实性与实用性审视报告：🔍来源审视 ⚖️争议地图 ⏳时效性检查 🛠️实用性评估 🤔逻辑自洽性。多角度分析不下定论，信息不足时诚实说明。清晰中文，各部分用 --- 分隔。" }, { role: "user", content: `知识点：${title}\n内容：${content_text.slice(0, 10000)}` }], { temperature: 0.4, maxTokens: 3072 });
}
