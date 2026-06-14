import { create } from "zustand";

export interface KnowledgeNode {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  lightStatus: "locked" | "lit" | "radiant";
  sourceDocumentIds: string[];
  isManual: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface KnowledgeEdge {
  id: string;
  userId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: "prerequisite_of" | "related_to" | "example_of" | "sub_concept_of" | "contradicts";
  label: string;
  lightStatus: "dark" | "lit";
  sourceDocumentId?: string;
  isWeak: boolean;
  createdAt: string;
}

export interface CognitivePatchData {
  id: string;
  userId: string;
  title: string;
  islandANodeId: string;
  islandBNodeId: string;
  connectingConcept: string;
  contentMarkdown: string;
  analogy: string;
  reviewQuestion: string;
  status: "unread" | "read_understood" | "still_confusing";
  generatedAt: string;
  readAt?: string;
}

interface KnowledgeTreeState {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  patches: CognitivePatchData[];
  selectedNodeId: string | null;
  isLoading: boolean;
  // Graph visualization state
  graphViewMode: "full" | "ego" | "clustered" | "timeline";
  setNodes: (nodes: KnowledgeNode[]) => void;
  addNode: (node: KnowledgeNode) => void;
  updateNode: (id: string, updates: Partial<KnowledgeNode>) => void;
  removeNode: (id: string) => void;
  setEdges: (edges: KnowledgeEdge[]) => void;
  addEdge: (edge: KnowledgeEdge) => void;
  removeEdge: (id: string) => void;
  setPatches: (patches: CognitivePatchData[]) => void;
  updatePatchStatus: (id: string, status: CognitivePatchData["status"]) => void;
  selectNode: (id: string | null) => void;
  setGraphViewMode: (mode: KnowledgeTreeState["graphViewMode"]) => void;
  setLoading: (loading: boolean) => void;
}

export const useKnowledgeTreeStore = create<KnowledgeTreeState>((set) => ({
  nodes: [],
  edges: [],
  patches: [],
  selectedNodeId: null,
  isLoading: false,
  graphViewMode: "full",
  setNodes: (nodes) => set({ nodes }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id),
    })),
  setEdges: (edges) => set({ edges }),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
  removeEdge: (id) => set((state) => ({ edges: state.edges.filter((e) => e.id !== id) })),
  setPatches: (patches) => set({ patches }),
  updatePatchStatus: (id, status) =>
    set((state) => ({
      patches: state.patches.map((p) =>
        p.id === id ? { ...p, status, readAt: status !== "unread" ? new Date().toISOString() : p.readAt } : p
      ),
    })),
  selectNode: (id) => set({ selectedNodeId: id }),
  setGraphViewMode: (graphViewMode) => set({ graphViewMode }),
  setLoading: (isLoading) => set({ isLoading }),
}));
