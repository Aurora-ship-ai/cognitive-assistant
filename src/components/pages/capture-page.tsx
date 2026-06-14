"use client";

import { useState, useRef } from "react";
import { useDocumentStore, type Document } from "@/lib/store/documents";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PenLine, Link, Video, FileText, Upload, Sparkles, Loader2,
  Copy, Check, Trash2, BookOpen, ExternalLink, Type, FileUp,
} from "lucide-react";
import { explainCapturedText } from "@/lib/ai/client";
import { generateId, formatRelativeTime } from "@/lib/utils";

type InputMode = "text" | "link" | "file";

export function CapturePage() {
  const { isAuthenticated, userId } = useAuthStore();
  const { documents, addDocument } = useDocumentStore();

  // Input mode
  const [mode, setMode] = useState<InputMode>("text");

  // Text mode
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  // Link mode
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNote, setLinkNote] = useState("");

  // File mode
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string; explanation: string; takeaways: string; tags: string[];
  } | null>(null);
  const [saved, setSaved] = useState(false);

  const isVideoLink = (url: string) =>
    /bilibili\.com|b23\.tv|douyin\.com|youtube\.com|youtu\.be|tiktok\.com|ixigua\.com/.test(url);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
      reader.onload = (ev) => setFileContent(ev.target?.result as string);
      reader.readAsText(file);
    } else if (file.type === "application/pdf") {
      setFileContent(`[PDF 文件: ${file.name}]\n\nPDF 文件已上传。请将文件中的文字内容复制粘贴到「文字」标签页中进行 AI 分析。`);
    } else if (file.type.includes("word") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
      setFileContent(`[Word 文件: ${file.name}]\n\nWord 文件已上传。请将文件中的文字内容复制粘贴到「文字」标签页中进行 AI 分析。`);
    } else {
      setFileContent(`[文件: ${file.name}]\n\n此文件类型暂不支持直接解析。请将文件中的文字内容复制粘贴到「文字」标签页中。`);
    }
  };

  // Process handler
  const handleProcess = async () => {
    let content = "";
    let url = "";
    let sourceType: Document["sourceType"] = "capture";

    if (mode === "text") {
      content = text.trim();
      url = sourceUrl.trim();
    } else if (mode === "link") {
      url = linkUrl.trim();
      content = linkNote.trim();
      if (isVideoLink(url)) sourceType = "video";
    } else if (mode === "file") {
      content = fileContent || "";
    }

    if (!content && !url) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      let promptText = content;

      if (mode === "link" && isVideoLink(url)) {
        promptText = `请分析这个视频中可能包含的知识内容：\n视频链接：${url}\n${content ? `\n补充说明：${content}` : ""}\n\n请提取视频可能涉及的核心知识点，生成结构化的学习笔记。`;
      } else if (mode === "link" && url) {
        promptText = `请分析以下链接中的内容知识：\n链接：${url}\n${content ? `\n补充说明：${content}` : ""}`;
      } else if (mode === "file" && fileName) {
        promptText = `以下是从文件「${fileName}」中提取的内容，请整理为结构化文档：\n\n${content}`;
      }

      const data = await explainCapturedText(promptText);
	      setResult(data);

      // Save as document
      const title = mode === "link" ? (linkUrl.slice(0, 50) || "链接捕获") :
                    mode === "file" ? (fileName || "文件导入") :
                    text.slice(0, 50);

      const markdown = `# ${title}\n\n> 来源：${url || (mode === "file" ? fileName : "手动输入")}\n\n${data.explanation || ""}\n\n## 关键要点\n\n${data.takeaways || ""}`;

      const doc: Document = {
        id: generateId(), userId: userId ?? "", title,
        sourceType, sourceUrl: url || undefined,
        contentMarkdown: markdown,
        summary: data.takeaways || content.slice(0, 100),
        keyTopics: data.tags || [],
        digestionStage: "ingested", metadata: {},
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      addDocument(doc);
      setSaved(true);

      // Clear inputs
      if (mode === "text") { setText(""); setSourceUrl(""); }
      else if (mode === "link") { setLinkUrl(""); setLinkNote(""); }
      else { setFileContent(null); setFileName(null); }
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
        <p className="text-[var(--muted)]">请先创建知识空间</p>
      </div>
    );
  }

  const hasInput = mode === "text" ? !!text.trim() :
                   mode === "link" ? !!linkUrl.trim() :
                   !!fileContent;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">快速捕获</h1>
        <p className="text-sm text-[var(--muted)] mt-1">文字、链接、文件 —— 都能捕获并转化为知识文档</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-[var(--muted-bg)] rounded-lg p-1">
        {[
          { id: "text" as const, label: "文字", icon: Type },
          { id: "link" as const, label: "链接", icon: Link },
          { id: "file" as const, label: "文件", icon: FileUp },
        ].map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm transition-colors ${
                mode === opt.id
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={14} /> {opt.label}
            </button>
          );
        })}
      </div>

      {/* Input area */}
      <div className="card p-4 space-y-3">
        {mode === "text" && (
          <>
            <textarea
              placeholder="粘贴要分析的文本内容…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              className="w-full resize-none bg-transparent text-sm placeholder:text-[var(--muted)] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <Link size={14} className="text-[var(--muted)] shrink-0" />
              <Input placeholder="来源链接（可选）" value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)} className="flex-1 text-xs h-8" />
            </div>
          </>
        )}

        {mode === "link" && (
          <>
            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <Video size={12} /> 粘贴视频或文章链接
              </label>
              <Input
                placeholder="抖音/B站/YouTube/网页链接…"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              {linkUrl && isVideoLink(linkUrl) && (
                <p className="text-xs text-[var(--accent)] mt-1.5 flex items-center gap-1">
                  <Video size={12} /> 视频链接 — AI 将提取其中的知识内容
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                <FileText size={12} /> 补充说明（可选）
              </label>
              <textarea
                placeholder="对链接内容的补充描述…"
                value={linkNote}
                onChange={(e) => setLinkNote(e.target.value)}
                rows={3}
                className="w-full resize-none bg-transparent text-sm placeholder:text-[var(--muted)] focus:outline-none"
              />
            </div>
          </>
        )}

        {mode === "file" && (
          <>
            <div
              className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--accent)] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={28} className="mx-auto text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">
                {fileName ? fileName : "点击上传文件"}
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                支持 TXT、Markdown、PDF、Word
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {fileContent && (
              <div>
                <p className="text-xs font-medium mb-1.5">文件内容预览：</p>
                <div className="bg-[var(--muted-bg)] rounded-lg p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-sans">{fileContent.slice(0, 500)}</pre>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">{error}</div>
        )}

        <Button onClick={handleProcess} disabled={!hasInput || isProcessing} className="w-full">
          {isProcessing ? (
            <><Loader2 size={16} className="animate-spin" /> AI 分析中…</>
          ) : (
            <><Sparkles size={16} /> {mode === "link" ? "分析链接" : mode === "file" ? "整理文件内容" : "AI 分析"}</>
          )}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-4 space-y-3 border-l-2 border-green-400">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-700">✅ 已保存到知识库</span>
          </div>
          <div className="bg-[var(--muted-bg)] rounded-lg p-3 max-h-80 overflow-y-auto">
            <h3 className="text-sm font-medium mb-2">{result.title}</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.explanation}</p>
            {result.takeaways && (
              <div className="mt-2 pt-2 border-t border-[var(--border)]">
                <p className="text-xs font-medium">💡 {result.takeaways}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent documents (from captures) */}
      {documents.filter(d => d.sourceType === "capture" || d.sourceType === "video").length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[var(--muted)] mb-3">最近捕获</h2>
          <div className="space-y-1">
            {documents.filter(d => d.sourceType === "capture" || d.sourceType === "video").slice(0, 5).map((doc) => (
              <div key={doc.id} className="card p-3 flex items-center gap-3">
                {doc.sourceType === "video" ? <Video size={14} className="text-[var(--muted)]" /> :
                 <FileText size={14} className="text-[var(--muted)]" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{doc.title}</p>
                  <p className="text-[10px] text-[var(--muted)]">{formatRelativeTime(doc.createdAt)}</p>
                </div>
                {doc.sourceUrl && (
                  <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-[var(--accent)] flex items-center gap-0.5 shrink-0">
                    <ExternalLink size={10} /> 来源
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
