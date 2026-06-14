import { create } from "zustand";

export interface Document {
  id: string;
  userId: string;
  title: string;
  sourceType: "recording" | "textbook_aligned" | "capture" | "video" | "manual";
  sourceUrl?: string;
  sourceAudioUrl?: string;
  contentMarkdown: string;
  summary: string;
  keyTopics: string[];
  digestionStage: "ingested" | "digested" | "absorbed" | "metabolized";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CaptureCard {
  id: string;
  userId: string;
  originalText: string;
  sourceUrl?: string;
  aiExplanation: string;
  keyTakeaways: string;
  suggestedTags: string[];
  linkedDocumentId?: string;
  createdAt: string;
}

interface DocumentState {
  documents: Document[];
  captureCards: CaptureCard[];
  selectedDocumentId: string | null;
  isLoading: boolean;
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setCaptureCards: (cards: CaptureCard[]) => void;
  addCaptureCard: (card: CaptureCard) => void;
  removeCaptureCard: (id: string) => void;
  selectDocument: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  captureCards: [],
  selectedDocumentId: null,
  isLoading: false,
  setDocuments: (documents) => set({ documents }),
  addDocument: (doc) =>
    set((state) => ({ documents: [doc, ...state.documents] })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ),
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),
  setCaptureCards: (captureCards) => set({ captureCards }),
  addCaptureCard: (card) =>
    set((state) => ({ captureCards: [card, ...state.captureCards] })),
  removeCaptureCard: (id) =>
    set((state) => ({
      captureCards: state.captureCards.filter((c) => c.id !== id),
    })),
  selectDocument: (id) => set({ selectedDocumentId: id }),
  setLoading: (isLoading) => set({ isLoading }),
}));
