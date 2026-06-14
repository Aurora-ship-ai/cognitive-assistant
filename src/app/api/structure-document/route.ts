import { NextRequest, NextResponse } from "next/server";
import { structureDocument } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "请提供要整理的内容" }, { status: 400 });
    }

    const apiKey = request.headers.get("x-api-key") || undefined;
    const contentMarkdown = await structureDocument(text, "deepseek", apiKey);

    return NextResponse.json({ contentMarkdown });
  } catch (error) {
    const message = error instanceof Error ? error.message : "文档结构化失败";
    console.error("Structure API error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
