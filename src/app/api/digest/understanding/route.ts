import { NextRequest, NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  try {
    const { documentContent, documentTitle } = await request.json();
    const apiKey = request.headers.get("x-api-key") || undefined;

    const systemPrompt = `你是一位知识解读大师。请为以下知识内容生成一份"全景解读报告"。

报告分5个部分：
1. 🗺️ 知识全景图：这个概念在整个知识体系中的位置
2. 🎨 形象化比喻：用一个生活场景或自然现象来类比
3. 🔗 关联揭示：与哪些看似无关的知识有隐藏联系
4. 🧩 拆解重构：将复杂概念拆成最小单元再重新组装
5. ❓ 常见误解澄清：学这个概念时最容易踩的坑

请用清晰优美的中文输出，部分之间用 --- 分隔线隔开。`;

    const result = await chatCompletion(
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `知识点：${documentTitle || ""}\n\n内容：${(documentContent || "").slice(0, 10000)}` },
        ],
        temperature: 0.6,
        maxTokens: 3072,
      },
      "deepseek",
      apiKey
    );

    return NextResponse.json({ content: result.content, reportType: "understanding" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "报告生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
