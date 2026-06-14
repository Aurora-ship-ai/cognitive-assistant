"use client";

import { useAuthStore } from "@/lib/store/auth";
import { useDocumentStore } from "@/lib/store/documents";
import { useKnowledgeTreeStore } from "@/lib/store/knowledge-tree";
import { useUIStore } from "@/lib/store/ui";
import { formatRelativeTime } from "@/lib/utils";
import { BookOpen, GitGraph, Brain, PenLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";

export function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { documents, captureCards } = useDocumentStore();
  const { nodes, patches } = useKnowledgeTreeStore();
  const { setActiveTab, setShowNewCaptureDialog } = useUIStore();

  const litNodes = nodes.filter((n) => n.lightStatus === "lit" || n.lightStatus === "radiant");
  const radiantNodes = nodes.filter((n) => n.lightStatus === "radiant");
  const unreadPatches = patches.filter((p) => p.status === "unread");

  const recentItems = [
    ...documents.slice(0, 3).map((d) => ({ ...d, itemType: "document" as const })),
    ...captureCards.slice(0, 2).map((c) => ({ ...c, itemType: "capture" as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold">你好 👋</h1>
        <p className="text-[var(--muted)] mt-1">
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab("library")}
        >
          <BookOpen size={20} className="text-[var(--accent)] mb-2" />
          <p className="text-2xl font-semibold">{documents.length}</p>
          <p className="text-xs text-[var(--muted)]">知识文档</p>
        </div>

        <div
          className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab("knowledge-tree")}
        >
          <GitGraph size={20} className="text-[var(--accent)] mb-2" />
          <p className="text-2xl font-semibold">{litNodes.length}</p>
          <p className="text-xs text-[var(--muted)]">
            已点亮节点{radiantNodes.length > 0 && ` · ${radiantNodes.length} 已贯通`}
          </p>
        </div>

        <div
          className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab("digest")}
        >
          <Brain size={20} className="text-[var(--accent)] mb-2" />
          <p className="text-2xl font-semibold">
            {documents.filter((d) => d.digestionStage === "metabolized" || d.digestionStage === "absorbed").length}
          </p>
          <p className="text-xs text-[var(--muted)]">已深度消化</p>
        </div>

        <div
          className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab("digest")}
        >
          <PenLine size={20} className="text-[var(--accent)] mb-2" />
          <p className="text-2xl font-semibold">{unreadPatches.length}</p>
          <p className="text-xs text-[var(--muted)]">待修补知识缺口</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <Button onClick={() => setShowNewCaptureDialog(true)}>
          <Plus size={16} /> 快速捕获
        </Button>
        <Button variant="secondary" onClick={() => setActiveTab("library")}>
          <BookOpen size={16} /> 浏览知识库
        </Button>
        <Button variant="secondary" onClick={() => setActiveTab("knowledge-tree")}>
          <GitGraph size={16} /> 查看知识树
        </Button>
      </div>

      {/* Recent items */}
      {recentItems.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-4">最近更新</h2>
          <div className="space-y-2">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="card p-4 flex items-start gap-3 cursor-pointer"
                onClick={() => {
                  if (item.itemType === "document") {
                    setActiveTab("library");
                  } else {
                    setActiveTab("capture");
                  }
                }}
              >
                <div className="shrink-0 mt-0.5">
                  {item.itemType === "document" ? (
                    <BookOpen size={16} className="text-[var(--muted)]" />
                  ) : (
                    <PenLine size={16} className="text-[var(--muted)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {"title" in item ? item.title : item.originalText.slice(0, 50)}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {formatRelativeTime(item.createdAt)}
                    {"sourceType" in item && ` · ${item.sourceType}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unread patches */}
      {unreadPatches.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-4">
            待修补的知识缺口 ({unreadPatches.length})
          </h2>
          <div className="space-y-3">
            {unreadPatches.slice(0, 3).map((patch) => (
              <div
                key={patch.id}
                className="card p-4 cursor-pointer border-l-2 border-[var(--accent)]"
                onClick={() => setActiveTab("digest")}
              >
                <p className="text-sm font-medium">{patch.title}</p>
                <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                  {patch.contentMarkdown}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {documents.length === 0 && captureCards.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={40} className="mx-auto text-[var(--border)] mb-4" />
          <p className="text-[var(--muted)] mb-4">知识库还是空的，开始你的学习之旅吧</p>
          <Button onClick={() => setShowNewCaptureDialog(true)}>
            <Plus size={16} /> 捕获第一条知识
          </Button>
        </div>
      )}
    </div>
  );
}
