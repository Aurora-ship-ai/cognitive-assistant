import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  try {
    const { documentContent, documentTitle } = await request.json();
    const apiKey = request.headers.get("x-api-key") || undefined;

    const systemPrompt = `你是一位严谨的知识审查员。请为以下知识内容生成一份"真实性与实用性审视报告"。

报告分5个部分：
1. 🔍 来源审视：这个知识最初来自哪里？传播链路是否可靠？
2. ⚖️ 争议地图：学界/业界对此有没有不同意见？
3. ⏳ 时效性检查：有没有过时？有没有新研究推翻它？
4. 🛠️ 实用性评估：在什么真实场景下能用到？有哪些边界条件？
5. 🤔 逻辑自洽性：内部有没有自相矛盾的地方？

重要：提供多角度分析但不下定论。信息不足时诚实说明。语言中立理性。
请用清晰中文输出，部分之间用 --- 分隔线隔开。`;

    const result = await chatCompletion(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `知识点：${documentTitle || ""}\n\n内容：${(documentContent || "").slice(0, 10000)}` },
        ],
        temperature: 0.4,
        maxTokens: 3072,
      },
      "deepseek",
      apiKey
    );

    return NextResponse.json({ content: result.content, reportType: "scrutiny" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "审视报告生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
