"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useKnowledgeTreeStore, type KnowledgeNode, type KnowledgeEdge } from "@/lib/store/knowledge-tree";
import { useDocumentStore } from "@/lib/store/documents";
import { extractGraph } from "@/lib/ai/client";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Dynamic import to avoid SSR issues with canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode {
  id: string;
  name: string;
  description: string;
  category: string;
  lightStatus: "locked" | "lit" | "radiant";
  isManual: boolean;
  val: number; // node size
  color: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
  relationshipType: string;
  label: string;
  lightStatus: "dark" | "lit";
}

function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ai_key_deepseek") || null;
}

function nodeToGraphNode(n: KnowledgeNode): GraphNode {
  const color =
    n.lightStatus === "radiant" ? "#f59e0b" :
    n.lightStatus === "lit" ? "#60a5fa" :
    "#4b5563";
  const val =
    n.lightStatus === "radiant" ? 12 :
    n.lightStatus === "lit" ? 8 :
    5;
  return { ...n, name: n.title, val, color };
}

export function GraphCanvas() {
  const { nodes, edges, selectedNodeId, selectNode, setNodes, setEdges } = useKnowledgeTreeStore();
  const { documents } = useDocumentStore();

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeCategory, setNewNodeCategory] = useState("");

  const graphRef = useRef<any>(null);

  const graphData = {
    nodes: nodes.map(nodeToGraphNode),
    links: edges.map((e) => ({
      source: e.sourceNodeId,
      target: e.targetNodeId,
      relationshipType: e.relationshipType,
      label: e.label,
      lightStatus: e.lightStatus,
    })),
  };

  // Auto-extract graph when there are documents but no nodes
  const canExtract = documents.length > 0;

  const handleExtractGraph = async () => {
    if (!canExtract || isExtracting) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      setExtractError("请先在设置页填入 AI 密钥");
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      // Combine all document contents
      const allContent = documents
        .map((d) => `# ${d.title}\n\n${d.contentMarkdown}`)
        .join("\n\n---\n\n");

      const data = await extractGraph(allContent.slice(0, 15000));

      // Convert extracted nodes/edges to store format
      const newNodes: KnowledgeNode[] = (data.nodes || []).map((n: any) => ({
        id: crypto.randomUUID(),
        userId: "",
        title: n.title,
        description: n.description || "",
        category: n.category || "未分类",
        lightStatus: "lit" as const,
        sourceDocumentIds: [],
        isManual: false,
        metadata: {},
        createdAt: new Date().toISOString(),
      }));

      const existingTitles = new Set(newNodes.map((n) => n.title));
      const existingIds = new Map(newNodes.map((n) => [n.title, n.id]));

      const newEdges: KnowledgeEdge[] = (data.edges || [])
        .filter((e: any) => existingTitles.has(e.source) && existingTitles.has(e.target))
        .map((e: any) => ({
          id: crypto.randomUUID(),
          userId: "",
          sourceNodeId: existingIds.get(e.source)!,
          targetNodeId: existingIds.get(e.target)!,
          relationshipType: e.relationship || "related_to",
          label: e.label || "",
          lightStatus: "lit" as const,
          sourceDocumentId: undefined,
          isWeak: false,
          createdAt: new Date().toISOString(),
        }));

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "图谱提取失败");
    } finally {
      setIsExtracting(false);
    }
  };

  // Add manual node
  const handleAddNode = () => {
    if (!newNodeTitle.trim()) return;
    const node: KnowledgeNode = {
      id: crypto.randomUUID(),
      userId: "",
      title: newNodeTitle.trim(),
      description: "",
      category: newNodeCategory.trim() || "手动添加",
      lightStatus: "lit",
      sourceDocumentIds: [],
      isManual: true,
      metadata: {},
      createdAt: new Date().toISOString(),
    };
    useKnowledgeTreeStore.getState().addNode(node);
    setNewNodeTitle("");
    setNewNodeCategory("");
    setShowAddNode(false);
  };

  // Node click handler
  const handleNodeClick = useCallback(
    (node: any) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Canvas paint for custom node rendering
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const { x, y } = node as any;
      const size = (node.val || 6) / globalScale;
      const label = (node.name || node.title || "") as string;

      // Glow effect for radiant/lit nodes
      if (node.lightStatus === "radiant") {
        ctx.beginPath();
        ctx.arc(x, y, size * 1.8, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
        ctx.fill();
      } else if (node.lightStatus === "lit") {
        ctx.beginPath();
        ctx.arc(x, y, size * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(96, 165, 250, 0.1)";
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color || "#4b5563";
      ctx.fill();

      // Border for selected node
      if (node.id === selectedNodeId) {
        ctx.beginPath();
        ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // Label
      const fontSize = Math.min(12 / globalScale, 12);
      ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = node.lightStatus === "locked" ? "#6b7280" : "#e5e5e5";
      ctx.textAlign = "center";
      ctx.fillText(
        label.length > 8 ? label.slice(0, 7) + "…" : label,
        x,
        y + size + fontSize + 2
      );

      // Star icon for radiant
      if (node.lightStatus === "radiant") {
        ctx.font = `${Math.min(10 / globalScale, 10)}px sans-serif`;
        ctx.fillStyle = "#f59e0b";
        ctx.fillText("⭐", x, y - size - 2);
      }
    },
    [selectedNodeId]
  );

  // Edge label rendering
  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (globalScale < 0.8) return; // Hide labels when zoomed out
      const { source, target } = link as any;
      const x = (source.x + target.x) / 2;
      const y = (source.y + target.y) / 2;

      const color = link.lightStatus === "dark" ? "#4b5563" : "#60a5fa";
      ctx.font = `${Math.min(8 / globalScale, 8)}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";

      const label = link.label || link.relationshipType || "";
      if (label && label.length < 15) {
        ctx.fillText(label, x, y - 2);
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {nodes.length} 节点 · {edges.length} 连线
          </span>
          <span className="text-xs text-[var(--muted)]">
            ✨{nodes.filter((n) => n.lightStatus === "lit").length}
            {" "}⭐{nodes.filter((n) => n.lightStatus === "radiant").length}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          {canExtract && nodes.length === 0 && (
            <Button size="sm" onClick={handleExtractGraph} disabled={isExtracting}>
              {isExtracting ? (
                <><Loader2 size={14} className="animate-spin" /> 提取中…</>
              ) : (
                <><Sparkles size={14} /> 从文档提取知识树</>
              )}
            </Button>
          )}
          {nodes.length > 0 && (
            <Button size="sm" variant="secondary" onClick={handleExtractGraph} disabled={isExtracting}>
              {isExtracting ? (
                <><Loader2 size={14} className="animate-spin" /></>
              ) : (
                <><Sparkles size={14} /> 重新提取</>
              )}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setShowAddNode(!showAddNode)}>
            <Plus size={14} /> 手动添加
          </Button>
        </div>
      </div>

      {extractError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-600">
          {extractError}
        </div>
      )}

      {/* Add node form */}
      {showAddNode && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted-bg)] flex items-center gap-2">
          <Input
            placeholder="节点名称"
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
            className="h-8 text-xs w-40"
            onKeyDown={(e) => e.key === "Enter" && handleAddNode()}
          />
          <Input
            placeholder="分类（可选）"
            value={newNodeCategory}
            onChange={(e) => setNewNodeCategory(e.target.value)}
            className="h-8 text-xs w-32"
            onKeyDown={(e) => e.key === "Enter" && handleAddNode()}
          />
          <Button size="sm" onClick={handleAddNode} disabled={!newNodeTitle.trim()}>
            添加
          </Button>
        </div>
      )}

      {/* Graph area */}
      <div className="flex-1 relative bg-[#111113]">
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 opacity-40">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <p className="text-sm mb-1">知识树为空</p>
            <p className="text-xs">
              {documents.length > 0
                ? "点击「从文档提取知识树」让 AI 分析你的知识库"
                : "先去知识库添加文档，然后 AI 会帮你构建知识树"}
            </p>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeCanvasObject={nodeCanvasObject}
            linkCanvasObject={linkCanvasObject}
            onNodeClick={handleNodeClick}
            linkColor={() => "rgba(255,255,255,0.08)"}
            linkWidth={0.5}
            backgroundColor="#111113"
            nodeRelSize={1}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={1}
            linkDirectionalParticleColor={(l: any) =>
              l.lightStatus === "lit" ? "#60a5fa" : "#4b5563"
            }
            d3VelocityDecay={0.3}
            cooldownTicks={100}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            minZoom={0.3}
            maxZoom={5}
            width={typeof window !== "undefined" ? window.innerWidth - 260 : 800}
            height={typeof window !== "undefined" ? window.innerHeight - 140 : 600}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--muted)] shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> 未点亮
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> 已点亮
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 已贯通
        </span>
        <span className="flex items-center gap-1.5 ml-auto">
          拖拽节点 · 滚轮缩放
        </span>
      </div>
    </div>
  );
}
