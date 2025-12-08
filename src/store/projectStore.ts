import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

export interface ProjectState {
    id: string;
    nodes: Node[];
    edges: Edge[];
    projectName: string;
    clientName: string;
    startDate: Date;
    endDate: Date;
    setupDate: Date;
    venue: string;
    staffName: string;
    driveFolderId: string;
    driveFileId: string; // Added: To track the file ID for overwriting
    driveFolderName: string;
    selectedEquipmentIds: string[];
    additionalCosts: {
        id: string;
        name: string;
        category: string;
        unitPrice: number;
        quantity: number;
        note?: string;
    }[];
}

interface ProjectActions {
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    addNode: (node: Node) => void;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    setDriveFolderId: (id: string) => void;
    setDriveFileId: (id: string) => void; // Added
    setDriveFolderName: (name: string) => void;
    updateMetadata: (data: Partial<ProjectState>) => void;
    updateEdgeData: (id: string, data: Record<string, unknown>) => void;
    setAdditionalCosts: (costs: ProjectState['additionalCosts']) => void;
    addAdditionalCost: (cost: Omit<ProjectState['additionalCosts'][0], 'id'>) => void;
    removeAdditionalCost: (id: string) => void;
    updateAdditionalCost: (id: string, cost: Partial<ProjectState['additionalCosts'][0]>) => void;
    toggleEquipmentSelection: (id: string) => void;
    loadProject: (state: ProjectState) => void;
    resetProject: () => void;
}

const initialState: ProjectState = {
    id: '1',
    nodes: [],
    edges: [],
    projectName: '',
    clientName: '',
    startDate: new Date(),
    endDate: new Date(),
    setupDate: new Date(),
    venue: '',
    staffName: '',
    driveFolderId: '',
    driveFileId: '', // Added
    driveFolderName: '',
    selectedEquipmentIds: [],
    additionalCosts: [],
};

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
    ...initialState,

    loadProject: (state) => {
        // Ensure dates are parsed back to Date objects if they came from JSON
        const parsedState = {
            ...state,
            startDate: new Date(state.startDate),
            endDate: new Date(state.endDate),
            setupDate: new Date(state.setupDate),
        };
        set(parsedState);
    },

    resetProject: () => set(initialState),

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setDriveFolderId: (id) => set({ driveFolderId: id }),
    setDriveFileId: (id) => set({ driveFileId: id }), // Added
    setDriveFolderName: (name) => set({ driveFolderName: name }),

    updateMetadata: (data) => set((state) => ({ ...state, ...data })),

    toggleEquipmentSelection: (id) => set((state) => {
        const current = state.selectedEquipmentIds || [];
        if (current.includes(id)) {
            return { selectedEquipmentIds: current.filter(itemId => itemId !== id) };
        } else {
            return { selectedEquipmentIds: [...current, id] };
        }
    }),

    updateEdgeData: (id, data) => {
        set({
            edges: get().edges.map((edge) => {
                if (edge.id === id) {
                    return { ...edge, data: { ...edge.data, ...data } };
                }
                return edge;
            }),
        });
    },

    setAdditionalCosts: (costs) => set({ additionalCosts: costs }),

    addAdditionalCost: (cost) => set((state) => ({
        additionalCosts: [
            ...(state.additionalCosts || []),
            { ...cost, id: crypto.randomUUID() }
        ]
    })),

    removeAdditionalCost: (id) => set((state) => ({
        additionalCosts: (state.additionalCosts || []).filter((c) => c.id !== id)
    })),

    updateAdditionalCost: (id, updatedCost) => set((state) => ({
        additionalCosts: (state.additionalCosts || []).map((c) =>
            c.id === id ? { ...c, ...updatedCost } : c
        )
    })),

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onConnect: (connection) => {
        const edge: Edge = {
            ...connection,
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            type: 'default',
            data: { cableType: 'HDMI', length: 1, type: 'Signal' },
            animated: true,
        };
        set({
            edges: addEdge(edge, get().edges),
        });
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node],
        });
    },
    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
}));
