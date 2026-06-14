"use client";

import { useState } from "react";
import { useDocumentStore, type Document } from "@/lib/store/documents";
import { useAuthStore } from "@/lib/store/auth";
import { useUIStore } from "@/lib/store/ui";
import { formatRelativeTime, truncate, generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Mic,
  Video,
  FileText,
  PenLine,
  Search,
  Plus,
  X,
  Sparkles,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { AudioRecorder } from "@/components/capture/audio-recorder";

const sourceTypeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  recording: Mic,
  textbook_aligned: FileText,
  capture: PenLine,
  video: Video,
  manual: FileText,
};

const sourceTypeLabels: Record<string, string> = {
  recording: "录音整理",
  textbook_aligned: "教材对标",
  capture: "捕获",
  video: "视频分享",
  manual: "手动输入",
};

const digestionLabels: Record<string, string> = {
  ingested: "已摄入",
  digested: "已消化",
  absorbed: "已吸收",
  metabolized: "已代谢",
};

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ai_key_deepseek") || null;
}

export function LibraryPage() {
  const { isAuthenticated, userId } = useAuthStore();
  const { documents, addDocument, removeDocument } = useDocumentStore();
  const { setActiveTab } = useUIStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  // View state
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // New document modal
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isStructuring, setIsStructuring] = useState(false);
  const [structError, setStructError] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showTextbookGen, setShowTextbookGen] = useState(false);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("undergraduate");
  const [depth, setDepth] = useState("standard");

  const filteredDocs = documents.filter((doc) => {
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType && doc.sourceType !== filterType) {
      return false;
    }
    return true;
  });

  // AI structure the manual input
  const handleAIStructure = async () => {
    if (!newContent.trim()) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      setStructError("请先在「设置」页面填入 AI 密钥");
      return;
    }
    setIsStructuring(true);
    setStructError(null);
    try {
      const response = await fetch("/api/structure-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ text: newContent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNewContent(data.contentMarkdown);
    } catch (err) {
      setStructError(err instanceof Error ? err.message : "AI 整理失败");
    } finally {
      setIsStructuring(false);
    }
  };

  // Save new document
  const handleSaveDocument = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const doc: Document = {
      id: generateId(),
      userId: userId ?? "",
      title: newTitle.trim(),
      sourceType: "manual",
      contentMarkdown: newContent.trim(),
      summary: truncate(newContent.trim(), 150),
      keyTopics: [],
      digestionStage: "ingested",
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addDocument(doc);
    setNewTitle("");
    setNewContent("");
    setShowNewDoc(false);
    setSelectedDoc(doc);
  };

  // Document detail view
  if (selectedDoc) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
        <button
          onClick={() => setSelectedDoc(null)}
          className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={16} /> 返回知识库
        </button>

        <article>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted-bg)] text-[var(--muted)]">
                {sourceTypeLabels[selectedDoc.sourceType]}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)]">
                {digestionLabels[selectedDoc.digestionStage]}
              </span>
            </div>
            <h1 className="text-2xl font-semibold">{selectedDoc.title}</h1>
            {selectedDoc.sourceUrl && (
              <a
                href={selectedDoc.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--accent)] hover:underline mt-1 inline-block"
              >
                查看来源 →
              </a>
            )}
            <p className="text-xs text-[var(--muted)] mt-1">
              {formatRelativeTime(selectedDoc.createdAt)}
            </p>
          </div>

          <div className="prose-content text-sm leading-relaxed whitespace-pre-wrap">
            {selectedDoc.contentMarkdown}
          </div>
        </article>

        <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              useUIStore.getState().setActiveTab("digest");
            }}
          >
            <Sparkles size={14} /> 深度加工
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              removeDocument(selectedDoc.id);
              setSelectedDoc(null);
            }}
          >
            删除文档
          </Button>
        </div>
      </div>
    );
  }

  // Handle transcript from audio recorder
  const handleTranscript = (text: string) => {
    setNewContent(text);
    setNewTitle("录音整理 - " + new Date().toLocaleDateString("zh-CN"));
    setShowRecorder(false);
    setShowNewDoc(true);
  };

  // AI Textbook generation
  const handleTextbookGen = async () => {
    if (!topic.trim() || isStructuring) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      setStructError("请先在「设置」页面填入 AI 密钥");
      return;
    }
    setIsStructuring(true);
    setStructError(null);
    try {
      const response = await fetch("/api/structure-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          text: `请为以下主题生成一份对标${difficulty === "high_school" ? "高中" : difficulty === "undergraduate" ? "大学本科" : "研究生"}水平的教材级文档。深度：${depth === "overview" ? "概述" : depth === "standard" ? "标准" : "深入"}。\n\n主题：${topic}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNewTitle(topic.trim());
      setNewContent(data.contentMarkdown);
      setShowTextbookGen(false);
      setShowNewDoc(true);
    } catch (err) {
      setStructError(err instanceof Error ? err.message : "AI 生成失败");
    } finally {
      setIsStructuring(false);
    }
  };

  // Textbook generation mode
  if (showTextbookGen) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-8 space-y-4">
        <button
          onClick={() => setShowTextbookGen(false)}
          className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={16} /> 返回知识库
        </button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles size={20} /> AI 生成教材文档
        </h1>
        <p className="text-sm text-[var(--muted)]">输入你想学的主题，AI 模拟权威教材生成结构化学习文档</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">学习主题</label>
            <Input
              placeholder="例如：量子纠缠、唐诗的意境、光合作用…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">难度水平</label>
            <div className="flex gap-2">
              {[
                { value: "high_school", label: "高中" },
                { value: "undergraduate", label: "大学本科" },
                { value: "graduate", label: "研究生" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    difficulty === opt.value
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--muted-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">内容深度</label>
            <div className="flex gap-2">
              {[
                { value: "overview", label: "概述 (5分钟)" },
                { value: "standard", label: "标准 (15分钟)" },
                { value: "deep", label: "深入 (30分钟)" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDepth(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    depth === opt.value
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--muted-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {structError && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{structError}</div>
          )}

          <Button
            onClick={handleTextbookGen}
            disabled={!topic.trim() || isStructuring}
            className="w-full"
          >
            {isStructuring ? (
              <><Loader2 size={16} className="animate-spin" /> AI 正在生成教材文档…</>
            ) : (
              <><Sparkles size={16} /> 生成教材文档</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Recording mode
  if (showRecorder) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-8 space-y-4">
        <button
          onClick={() => setShowRecorder(false)}
          className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={16} /> 返回知识库
        </button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Mic size={20} /> 课堂录音整理
        </h1>
        <AudioRecorder onTranscriptReady={handleTranscript} />
      </div>
    );
  }

  // New document modal
  if (showNewDoc) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
        <button
          onClick={() => setShowNewDoc(false)}
          className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={16} /> 返回
        </button>

        <h1 className="text-xl font-semibold">新建文档</h1>
        <p className="text-sm text-[var(--muted)]">手动输入或粘贴内容，可让 AI 帮忙整理</p>

        <div className="space-y-3">
          <Input
            placeholder="文档标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            placeholder="在此输入内容…&#10;&#10;可以粘贴笔记、书摘、任何文字内容"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={14}
            className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />

          {structError && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{structError}</div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleAIStructure}
              disabled={!newContent.trim() || isStructuring}
            >
              {isStructuring ? (
                <><Loader2 size={14} className="animate-spin" /> 整理中…</>
              ) : (
                <><Sparkles size={14} /> AI 整理格式</>
              )}
            </Button>
            <Button onClick={handleSaveDocument} disabled={!newTitle.trim() || !newContent.trim()}>
              保存文档
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main library list
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">知识库</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{documents.length} 份文档</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => setShowRecorder(true)} size="sm">
            <Mic size={16} /> 录音
          </Button>
          <Button variant="secondary" onClick={() => setShowTextbookGen(true)} size="sm">
            <Sparkles size={16} /> AI 生成
          </Button>
          <Button onClick={() => setShowNewDoc(true)} size="sm">
            <Plus size={16} /> 新建
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            placeholder="搜索文档…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[null, "recording", "textbook_aligned", "capture", "video", "manual"].map((type) => (
            <button
              key={type ?? "all"}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                filterType === type
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted)] hover:bg-[var(--muted-bg)]"
              }`}
            >
              {type ? sourceTypeLabels[type] : "全部"}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto text-[var(--border)] mb-4" />
          <p className="text-[var(--muted)] mb-4">
            {documents.length === 0 ? "知识库还是空的" : "没有匹配的文档"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setShowNewDoc(true)} size="sm">
              <Plus size={16} /> 手动输入
            </Button>
            <Button variant="secondary" onClick={() => setActiveTab("capture")} size="sm">
              <PenLine size={16} /> 快速捕获
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredDocs.map((doc) => {
            const Icon = sourceTypeIcons[doc.sourceType] ?? FileText;
            return (
              <div
                key={doc.id}
                className="card p-4 flex items-start gap-4 cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="shrink-0 mt-0.5">
                  <Icon size={18} className="text-[var(--muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium truncate">{doc.title}</h3>
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted-bg)] text-[var(--muted)]">
                      {sourceTypeLabels[doc.sourceType]}
                    </span>
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)]">
                      {digestionLabels[doc.digestionStage]}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] line-clamp-2">
                    {doc.summary || truncate(doc.contentMarkdown, 120)}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] mt-1.5">
                    {formatRelativeTime(doc.createdAt)}
                    {doc.keyTopics.length > 0 && ` · ${doc.keyTopics.slice(0, 3).join("、")}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
