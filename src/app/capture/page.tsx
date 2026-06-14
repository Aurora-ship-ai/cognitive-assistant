"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDocumentStore, type Document } from "@/lib/store/documents";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Link, FileText, Video, ArrowRight, PenLine } from "lucide-react";
import { generateId } from "@/lib/utils";

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ai_key_deepseek") || null;
}

function CaptureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, userId } = useAuthStore();
  const { addDocument } = useDocumentStore();

  const sharedTitle = searchParams.get("title") || "";
  const sharedText = searchParams.get("text") || "";
  const sharedUrl = searchParams.get("url") || "";

  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Pre-fill from shared content
  useEffect(() => {
    if (sharedText) setInputText(sharedText);
    if (sharedUrl) setInputUrl(sharedUrl);
    if (!sharedText && !sharedUrl && sharedTitle) setInputText(sharedTitle);
  }, [sharedTitle, sharedText, sharedUrl]);

  const isVideoLink = (url: string) => {
    return /bilibili\.com|b23\.tv|douyin\.com|youtube\.com|youtu\.be|tiktok\.com/.test(url);
  };

  const handleProcess = async () => {
    const content = inputText.trim();
    const url = inputUrl.trim();
    if (!content && !url) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setError("请先在设置页填入 DeepSeek API 密钥");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Build the prompt based on what we have
      let promptText = "";
      let sourceType: Document["sourceType"] = "capture";

      if (isVideoLink(url)) {
        sourceType = "video";
        promptText = `请分析这个视频链接中可能包含的知识内容：\n链接：${url}\n${content ? `\n补充说明：${content}` : ""}\n\n请提取视频可能涉及的核心知识点，并生成一份结构化的学习笔记。如果无法访问链接内容，请根据链接中的标题/主题推断并生成相关知识文档。`;
      } else if (url) {
        promptText = `请分析以下链接中的内容：\n链接：${url}\n${content ? `\n文字内容：${content}` : ""}\n\n请提取核心知识并生成结构化文档。`;
      } else {
        promptText = content;
      }

      const response = await fetch("/api/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ text: promptText }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "处理失败");

      const markdown = `# ${sharedTitle || inputText.slice(0, 30) || "捕获的知识"}\n\n> 来源：${url || "手动输入"}\n\n${data.explanation || data.contentMarkdown || ""}\n\n## 关键要点\n\n${data.takeaways || ""}`;

      setResult(markdown);

      // Auto-save as document
      const doc: Document = {
        id: generateId(),
        userId: userId ?? "",
        title: sharedTitle || inputText.slice(0, 50) || "捕获的知识",
        sourceType,
        sourceUrl: url || undefined,
        contentMarkdown: markdown,
        summary: data.takeaways || inputText.slice(0, 100),
        keyTopics: data.tags || [],
        digestionStage: "ingested",
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addDocument(doc);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 处理失败");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <PenLine size={40} className="text-[var(--border)] mb-4" />
        <p className="text-[var(--muted)] mb-4">请先创建知识空间</p>
        <Button onClick={() => router.push("/")}>去登录</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <PenLine size={20} /> 快速捕获
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {sharedUrl ? "已收到分享内容，AI 正在准备分析" : "粘贴文字或链接，AI 帮你提取知识"}
        </p>
      </div>

      <div className="card p-4 space-y-3">
        {/* URL input */}
        <div>
          <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
            <Link size={12} /> 链接（视频、文章等）
          </label>
          <Input
            placeholder="粘贴抖音/B站/网页链接…"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
          />
          {inputUrl && isVideoLink(inputUrl) && (
            <p className="text-xs text-[var(--accent)] mt-1 flex items-center gap-1">
              <Video size={12} /> 检测到视频链接，AI 将提取其中的知识内容
            </p>
          )}
        </div>

        {/* Text input */}
        <div>
          <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
            <FileText size={12} /> 文字内容（可选）
          </label>
          <textarea
            placeholder="补充文字说明，或直接粘贴文本…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
            {error}
          </div>
        )}

        <Button
          onClick={handleProcess}
          disabled={(!inputText.trim() && !inputUrl.trim()) || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <><Loader2 size={16} className="animate-spin" /> AI 分析中…</>
          ) : sharedUrl ? (
            <><Sparkles size={16} /> 分析分享的内容</>
          ) : (
            <><Sparkles size={16} /> AI 分析并保存</>
          )}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-4 space-y-3 border-l-2 border-green-400">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-700">✅ 已保存到知识库</span>
          </div>
          <div className="bg-[var(--muted-bg)] rounded-lg p-3 max-h-60 overflow-y-auto">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">{result}</pre>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => router.push("/")}>
              回到首页
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              setInputText("");
              setInputUrl("");
              setResult(null);
              setSaved(false);
            }}>
              继续捕获
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
      </div>
    }>
      <CaptureContent />
    </Suspense>
  );
}
