"use client";

import { useState } from "react";
import { useDocumentStore } from "@/lib/store/documents";
import { useKnowledgeTreeStore, type CognitivePatchData } from "@/lib/store/knowledge-tree";
import { useAuthStore } from "@/lib/store/auth";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Search,
  Map,
  Shield,
  Sparkles,
  Loader2,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

type ReportType = "understanding" | "scrutiny";

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ai_key_deepseek") || null;
}

export function DigestPage() {
  const { isAuthenticated } = useAuthStore();
  const { documents } = useDocumentStore();
  const { nodes, edges, patches, addEdge, updateNode, setPatches, updatePatchStatus } =
    useKnowledgeTreeStore();

  // Gap detection
  const [isDetectingGaps, setIsDetectingGaps] = useState(false);
  const [gapError, setGapError] = useState<string | null>(null);

  // Report generation
  const [selectedDocId, setSelectedDocId] = useState("");
  const [reportType, setReportType] = useState<ReportType>("understanding");
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const unreadPatches = patches.filter((p) => p.status === "unread");
  const understoodPatches = patches.filter((p) => p.status !== "unread");

  // Detect knowledge gaps
  const handleDetectGaps = async () => {
    if (nodes.length === 0) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      setGapError("请先在设置页填入 AI 密钥");
      return;
    }

    setIsDetectingGaps(true);
    setGapError(null);

    try {
      const response = await fetch("/api/knowledge/detect-gaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ nodes, edges }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "检测失败");

      // Convert gaps to patches
      const newPatches: CognitivePatchData[] = (data.gaps || []).map((gap: any) => ({
        id: crypto.randomUUID(),
        userId: "",
        title: gap.title || "知识缺口",
        islandANodeId:
          nodes.find((n) => n.title === gap.islandA)?.id ||
          nodes.find((n) => n.title.includes(gap.islandA?.slice(0, 3)))?.id ||
          "",
        islandBNodeId:
          nodes.find((n) => n.title === gap.islandB)?.id ||
          nodes.find((n) => n.title.includes(gap.islandB?.slice(0, 3)))?.id ||
          "",
        connectingConcept: gap.bridgeConcept || "",
        contentMarkdown: gap.capsule || gap.explanation || "",
        analogy: gap.analogy || "",
        reviewQuestion: gap.reviewQuestion || "",
        status: "unread",
        generatedAt: new Date().toISOString(),
      }));

      if (newPatches.length > 0) {
        setPatches([...newPatches, ...patches]);
      } else {
        setGapError("未发现明显的知识缺口，你的知识树很完整！");
      }
    } catch (err) {
      setGapError(err instanceof Error ? err.message : "缺口检测失败");
    } finally {
      setIsDetectingGaps(false);
    }
  };

  // Mark patch as understood → light up the connection
  const handlePatchUnderstood = (patch: CognitivePatchData) => {
    updatePatchStatus(patch.id, "read_understood");

    // Light up the nodes involved
    if (patch.islandANodeId) {
      const nodeA = nodes.find((n) => n.id === patch.islandANodeId);
      if (nodeA && nodeA.lightStatus !== "radiant") {
        updateNode(patch.islandANodeId, { lightStatus: "radiant" });
      }
    }
    if (patch.islandBNodeId) {
      const nodeB = nodes.find((n) => n.id === patch.islandBNodeId);
      if (nodeB && nodeB.lightStatus !== "radiant") {
        updateNode(patch.islandBNodeId, { lightStatus: "radiant" });
      }
    }

    // Create an edge between them if there isn't one
    if (patch.islandANodeId && patch.islandBNodeId) {
      const existingEdge = edges.find(
        (e) =>
          (e.sourceNodeId === patch.islandANodeId && e.targetNodeId === patch.islandBNodeId) ||
          (e.sourceNodeId === patch.islandBNodeId && e.targetNodeId === patch.islandANodeId)
      );
      if (!existingEdge) {
        addEdge({
          id: crypto.randomUUID(),
          userId: "",
          sourceNodeId: patch.islandANodeId,
          targetNodeId: patch.islandBNodeId,
          relationshipType: "related_to",
          label: patch.connectingConcept || "认知补丁",
          lightStatus: "lit",
          isWeak: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  };

  // Generate deep report
  const handleGenerateReport = async () => {
    if (!selectedDocId || isGenerating) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      setGenerationError("请先在设置页填入 AI 密钥");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setReport(null);

    try {
      // Find the document or node content
      const doc = documents.find((d) => d.id === selectedDocId);
      const node = nodes.find((n) => n.id === selectedDocId);
      const content = doc?.contentMarkdown || "";
      const title = doc?.title || node?.title || "";

      const endpoint =
        reportType === "understanding" ? "/api/digest/understanding" : "/api/digest/scrutiny";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ documentContent: content, documentTitle: title }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReport(data.content);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : "生成报告时出错");
    } finally {
      setIsGenerating(false);
    }
  };

  const allItems = [
    ...documents.map((d) => ({ id: d.id, label: `📖 ${d.title}`, type: "document" })),
    ...nodes
      .filter((n) => n.lightStatus !== "locked")
      .map((n) => ({ id: n.id, label: `🌳 ${n.title}`, type: "node" })),
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Brain size={40} className="text-[var(--border)] mb-4" />
        <p className="text-[var(--muted)]">请先创建知识空间</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">知识深加工</h1>
        <p className="text-sm text-[var(--muted)] mt-1">深入理解知识，检测盲区，审视真伪</p>
      </div>

      {/* === Cognitive Patches === */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Lightbulb size={18} className="text-[var(--accent)]" />
            认知胶囊
            <span className="text-sm font-normal text-[var(--muted)]">
              {unreadPatches.length > 0 ? `${unreadPatches.length} 个待修补` : ""}
            </span>
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDetectGaps}
            disabled={isDetectingGaps || nodes.length === 0}
          >
            {isDetectingGaps ? (
              <><Loader2 size={14} className="animate-spin" /> 检测中</>
            ) : (
              <><Search size={14} /> 检测知识缺口</>
            )}
          </Button>
        </div>

        {nodes.length === 0 && (
          <div className="card p-4 text-center text-sm text-[var(--muted)]">
            先去知识树提取或添加节点，然后 AI 就能检测你的知识缺口
          </div>
        )}

        {gapError && (
          <div
            className={`text-sm rounded-lg p-3 ${
              gapError.includes("很完整")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {gapError}
          </div>
        )}

        {/* Unread patches */}
        {unreadPatches.map((patch) => (
          <div key={patch.id} className="card p-4 border-l-2 border-[var(--accent)] space-y-3">
            <div>
              <h3 className="text-sm font-semibold">{patch.title}</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                桥梁概念：<span className="font-medium text-[var(--foreground)]">{patch.connectingConcept}</span>
              </p>
            </div>

            <div className="bg-[var(--muted-bg)] rounded-lg p-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{patch.contentMarkdown}</p>
            </div>

            {patch.analogy && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-1">💡 生活化类比</p>
                <p className="text-sm text-blue-800">{patch.analogy}</p>
              </div>
            )}

            {patch.reviewQuestion && (
              <p className="text-xs text-[var(--muted)] italic">🤔 {patch.reviewQuestion}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => handlePatchUnderstood(patch)}>
                <CheckCircle2 size={14} /> 已理解 — 点亮知识树
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updatePatchStatus(patch.id, "still_confusing")}
              >
                <HelpCircle size={14} /> 还是困惑
              </Button>
            </div>
          </div>
        ))}

        {/* Understood patches (collapsed) */}
        {understoodPatches.length > 0 && (
          <details className="text-sm">
            <summary className="text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)]">
              已理解的补丁 ({understoodPatches.length})
            </summary>
            <div className="mt-2 space-y-1">
              {understoodPatches.map((p) => (
                <div key={p.id} className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-green-500" />
                  {p.title}
                </div>
              ))}
            </div>
          </details>
        )}
      </section>

      {/* Divider */}
      <hr className="border-[var(--border)]" />

      {/* === Deep Report === */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Brain size={18} className="text-[var(--accent)]" />
          深度解读报告
        </h2>

        <div className="card p-4 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setReportType("understanding")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                reportType === "understanding"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--muted-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Map size={16} /> 形象化解释
            </button>
            <button
              onClick={() => setReportType("scrutiny")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                reportType === "scrutiny"
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--muted-bg)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Shield size={16} /> 真实性审视
            </button>
          </div>

          <p className="text-xs text-[var(--muted)]">
            {reportType === "understanding"
              ? "全景解读：知识地图、形象比喻、关联揭示、拆解重构、常见误解"
              : "审视报告：来源追溯、争议梳理、时效检查、实用评估、逻辑自洽"}
          </p>

          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          >
            <option value="">-- 选择要分析的知识 --</option>
            {allItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <Button
            onClick={handleGenerateReport}
            disabled={!selectedDocId || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <><Loader2 size={16} className="animate-spin" /> 生成中…</>
            ) : (
              <><Sparkles size={16} /> 生成报告</>
            )}
          </Button>
        </div>

        {generationError && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{generationError}</div>
        )}

        {report && (
          <div className="card p-6">
            <div className="prose-content text-sm leading-relaxed whitespace-pre-wrap">{report}</div>
          </div>
        )}
      </section>

      {/* Digestion overview */}
      <section>
        <h2 className="text-sm font-medium text-[var(--muted)] mb-3">消化总览</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { stage: "ingested", label: "已摄入", count: documents.filter((d) => d.digestionStage === "ingested").length },
            { stage: "digested", label: "已消化", count: documents.filter((d) => d.digestionStage === "digested").length },
            { stage: "absorbed", label: "已吸收", count: documents.filter((d) => d.digestionStage === "absorbed").length },
            { stage: "metabolized", label: "已代谢", count: documents.filter((d) => d.digestionStage === "metabolized").length },
          ].map((item) => (
            <div key={item.stage} className="card p-3 text-center">
              <p className="text-xl font-semibold">{item.count}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
