import Dexie, { type EntityTable } from "dexie";

// Offline database for caching and draft storage
interface OfflineDocument {
  id: string;
  title: string;
  contentMarkdown: string;
  summary: string;
  sourceType: string;
  digestionStage: string;
  cachedAt: number; // timestamp
}

interface OfflineKnowledgeNode {
  id: string;
  title: string;
  description: string;
  category: string;
  lightStatus: "locked" | "lit" | "radiant";
  x?: number; // graph position
  y?: number;
  cachedAt: number;
}

interface OfflineKnowledgeEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
  label: string;
  lightStatus: "dark" | "lit";
  cachedAt: number;
}

interface PendingDraft {
  id: string;
  type: "document" | "capture" | "manual_node";
  content: string;
  metadata: Record<string, unknown>;
  createdAt: number;
}

interface GraphLayoutState {
  id: string;
  nodeId: string;
  x: number;
  y: number;
}

const db = new Dexie("cognitive-assistant") as Dexie & {
  offlineDocuments: EntityTable<OfflineDocument, "id">;
  offlineKnowledgeNodes: EntityTable<OfflineKnowledgeNode, "id">;
  offlineKnowledgeEdges: EntityTable<OfflineKnowledgeEdge, "id">;
  pendingDrafts: EntityTable<PendingDraft, "id">;
  graphLayoutState: EntityTable<GraphLayoutState, "id">;
};

db.version(1).stores({
  offlineDocuments: "id, sourceType, digestionStage, cachedAt",
  offlineKnowledgeNodes: "id, category, lightStatus, cachedAt",
  offlineKnowledgeEdges: "id, sourceNodeId, targetNodeId, lightStatus, cachedAt",
  pendingDrafts: "id, type, createdAt",
  graphLayoutState: "id, nodeId",
});

export { db };
export type {
  OfflineDocument,
  OfflineKnowledgeNode,
  OfflineKnowledgeEdge,
  PendingDraft,
  GraphLayoutState,
};
