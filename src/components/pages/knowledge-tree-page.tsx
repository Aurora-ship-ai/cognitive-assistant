"use client";

import { useAuthStore } from "@/lib/store/auth";
import { useKnowledgeTreeStore } from "@/lib/store/knowledge-tree";
import { GraphCanvas } from "@/components/knowledge-tree/graph-canvas";
import { GitGraph, X, ExternalLink } from "lucide-react";

export function KnowledgeTreePage() {
  const { isAuthenticated } = useAuthStore();
  const { nodes, edges, selectedNodeId, selectNode, updateNode, addEdge } =
    useKnowledgeTreeStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const connectedEdges = edges.filter(
    (e) => e.sourceNodeId === selectedNodeId || e.targetNodeId === selectedNodeId
  );
  const connectedNodes = nodes.filter((n) =>
    connectedEdges.some((e) => e.sourceNodeId === n.id || e.targetNodeId === n.id)
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <GitGraph size={40} className="text-[var(--border)] mb-4" />
        <p className="text-[var(--muted)]">请先创建知识空间</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <GraphCanvas />

      {/* Node detail panel */}
      {selectedNode && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4 shrink-0 max-h-[40vh] overflow-y-auto">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{selectedNode.title}</h3>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    selectedNode.lightStatus === "radiant"
                      ? "bg-amber-100 text-amber-700"
                      : selectedNode.lightStatus === "lit"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {selectedNode.lightStatus === "radiant"
                    ? "⭐ 已贯通"
                    : selectedNode.lightStatus === "lit"
                    ? "✨ 已点亮"
                    : "🔒 未点亮"}
                </span>
                {selectedNode.isManual && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted-bg)] text-[var(--muted)]">
                    手动添加
                  </span>
                )}
              </div>

              {selectedNode.description && (
                <p className="text-sm text-[var(--muted)]">{selectedNode.description}</p>
              )}

              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>分类：{selectedNode.category}</span>
                {selectedNode.sourceDocumentIds.length > 0 && (
                  <span>关联 {selectedNode.sourceDocumentIds.length} 份文档</span>
                )}
              </div>

              {/* Connected nodes */}
              {connectedNodes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--muted)] mt-2 mb-1">关联节点：</p>
                  <div className="flex gap-1 flex-wrap">
                    {connectedNodes.map((cn) => {
                      const edge = connectedEdges.find(
                        (e) =>
                          (e.sourceNodeId === cn.id && e.targetNodeId === selectedNodeId) ||
                          (e.targetNodeId === cn.id && e.sourceNodeId === selectedNodeId)
                      );
                      return (
                        <button
                          key={cn.id}
                          onClick={() => selectNode(cn.id)}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--muted-bg)] hover:bg-[var(--border)] transition-colors"
                        >
                          {cn.title}
                          {edge && (
                            <span className="text-[10px] text-[var(--muted)] ml-1">
                              ({edge.label || edge.relationshipType})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => selectNode(null)}
              className="p-1 rounded hover:bg-[var(--muted-bg)] text-[var(--muted)] shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
