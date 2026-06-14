import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  try {
    const { documentContent, documentId } = await request.json();
    const apiKey = request.headers.get("x-api-key") || undefined;

    if (!documentContent) {
      return NextResponse.json({ error: "请提供文档内容" }, { status: 400 });
    }

    const systemPrompt = `你是一位知识图谱构建专家。根据以下文档内容，提取知识节点（概念）和连线（关系）。

输出 ONLY 有效的 JSON 格式（不要包含 markdown 代码块标记）：
{
  "nodes": [
    { "title": "概念名称", "description": "一句话解释", "category": "所属学科/领域" }
  ],
  "edges": [
    { "source": "概念A名称", "target": "概念B名称", "relationship": "prerequisite_of|related_to|example_of|sub_concept_of", "label": "关系说明" }
  ]
}

规则：
- 每个节点必须是独立、原子化的概念
- 最多提取20个节点
- 只包含文档中明确提到或清楚暗示的关系
- 节点标题使用规范的中文学术术语
- 不要重复提取相同的概念`;

    const result = await chatCompletion(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: documentContent.slice(0, 15000) },
        ],
        temperature: 0.2,
        maxTokens: 3072,
      },
      "deepseek",
      apiKey
    );

    // Parse JSON from response
    const cleaned = result.content.replace(/```json\n?|\n?```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error("AI 返回格式异常，请重试");
    }
    const json = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));

    return NextResponse.json({
      nodes: json.nodes || [],
      edges: json.edges || [],
      documentId: documentId ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "知识图谱提取失败";
    console.error("Graph extraction error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
