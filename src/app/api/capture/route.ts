import { NextRequest, NextResponse } from "next/server";
import { explainCapturedText } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "请提供要分析的文本内容" }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json({ error: "文本长度不能超过10000字" }, { status: 400 });
    }

    // Support client-provided API key
    const apiKey = request.headers.get("x-api-key") || undefined;

    const result = await explainCapturedText(text, "deepseek", apiKey);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 分析失败";
    console.error("Capture API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
