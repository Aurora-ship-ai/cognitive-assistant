import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges } = await request.json();
    const apiKey = request.headers.get("x-api-key") || undefined;

    if (!nodes?.length) {
      return NextResponse.json({ error: "知识树为空，没有节点可分析" }, { status: 400 });
    }

    const nodesSummary = nodes
      .map((n: any) => `- "${n.title}" [${n.category || "未分类"}] ${n.description || ""}`)
      .join("\n");

    const edgesSummary = edges?.length
      ? edges
          .map((e: any) => {
            const src = nodes.find((n: any) => n.id === e.sourceNodeId);
            const tgt = nodes.find((n: any) => n.id === e.targetNodeId);
            return `- "${src?.title || e.sourceNodeId}" → "${tgt?.title || e.targetNodeId}" (${e.relationshipType || "相关"})`;
          })
          .join("\n")
      : "（暂无连线）";

    const systemPrompt = `你是一位知识图谱分析师。用户有一个个人的知识树，包含节点（学过的概念）和连线（概念间的关系）。请找出知识树中的"薄弱环节"。

重点关注：
1. 孤立节点或孤立节点群（与其他节点没有任何连线的节点）
2. 两个看似相关但缺少中间桥梁概念的节点对
3. 缺少前置知识的节点（学习B之前应该先学A，但A不在知识树中）

请输出 ONLY JSON（不要包含 markdown 代码块标记）：
{
  "gaps": [
    {
      "type": "isolated|missing_bridge|missing_prerequisite",
      "title": "这个缺口的简短标题（15字以内）",
      "islandA": "节点名或概念A",
      "islandB": "节点名或概念B",
      "bridgeConcept": "缺失的桥梁概念名称",
      "explanation": "为什么这两个之间缺少了连接？（100字以内）",
      "capsule": "一段600-800字的解释，把这个桥梁概念讲清楚，让读者能够理解A和B之间的关系。用通俗易懂的中文。",
      "analogy": "一个生活化的类比来帮助理解",
      "reviewQuestion": "一个检验理解的思考题"
    }
  ]
}

最多返回3个缺口。如果知识树很完整没有明显缺口，返回空数组。`;

    const result = await chatCompletion(
      {
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `我的知识树：\n\n节点：\n${nodesSummary}\n\n连线：\n${edgesSummary}\n\n请分析我的知识盲区和薄弱连接。`,
          },
        ],
        temperature: 0.4,
        maxTokens: 3072,
      },
      "deepseek",
      apiKey
    );

    const cleaned = result.content.replace(/```json\n?|\n?```/g, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error("AI 返回格式异常");
    }
    const json = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));

    return NextResponse.json({
      gaps: json.gaps || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "缺口检测失败";
    console.error("Gap detection error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
