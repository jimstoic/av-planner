import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { recursiveDateParse } from '@/lib/utils';
import { Equipment } from '@/types/equipment';

export interface Staff {
    id: string;
    name: string;
    role: string;
    dayRate: number;
    daysAssigned: number;
    email?: string;
}

export interface ScheduleItem {
    id: string;
    title: string;
    type: 'setup' | 'rehearsal' | 'show' | 'strike' | 'other';
    start: Date;
    end: Date;
    description?: string;
    assignedStaffIds?: string[];
}

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
    staffName: string; // Kept for backward compatibility, serves as "Manager Name"
    spreadsheetUrl?: string;
    driveFolderId: string;
    driveFileId: string;
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
    staff: Staff[];
    schedule: ScheduleItem[];
    members: string[]; // Assigned user emails
    artboard: {
        enabled: boolean;
        size: 'A4' | 'A3';
        orientation: 'portrait' | 'landscape';
    };
    // Quotation Settings
    taxRateOverride?: number;
    discountAmount: number;
    discountType: 'flat' | 'percent';
    discountIncludedCategories: string[]; // ['staff', 'equipment', 'production', 'other']
    remarks?: string;
    equipmentOverrides: Record<string, {
        name?: string;
        unitPrice?: number;
        quantity?: number;
    }>;
    // UI State
    editingEdgeId: string | null;
}

interface ProjectActions {
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    addNode: (node: Node) => void;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    setDriveFolderId: (id: string) => void;
    setDriveFileId: (id: string) => void;
    setDriveFolderName: (name: string) => void;
    updateMetadata: (data: Partial<ProjectState>) => void;
    updateEdgeData: (id: string, data: Record<string, unknown>) => void;
    setEditingEdgeId: (id: string | null) => void;
    updateQuotationSettings: (settings: Partial<{ taxRateOverride: number, discountAmount: number, discountType: 'flat' | 'percent', discountIncludedCategories: string[], remarks: string }>) => void;
    updateEquipmentOverride: (id: string, override: Partial<ProjectState['equipmentOverrides'][string]>) => void;

    // Cost Actions
    setAdditionalCosts: (costs: ProjectState['additionalCosts']) => void;
    addAdditionalCost: (cost: Omit<ProjectState['additionalCosts'][0], 'id'>) => void;
    removeAdditionalCost: (id: string) => void;
    updateAdditionalCost: (id: string, cost: Partial<ProjectState['additionalCosts'][0]>) => void;

    // Equipment Actions
    toggleEquipmentSelection: (id: string) => void;

    // Staff Actions
    setStaff: (staff: Staff[]) => void;
    addStaff: (staff: Omit<Staff, 'id'>) => void;
    updateStaff: (id: string, staff: Partial<Staff>) => void;
    removeStaff: (id: string) => void;

    // Schedule Actions
    setSchedule: (schedule: ScheduleItem[]) => void;
    addScheduleItem: (item: Omit<ScheduleItem, 'id'>) => void;
    updateScheduleItem: (id: string, item: Partial<ScheduleItem>) => void;
    removeScheduleItem: (id: string) => void;

    // Sync equipment changes to existing diagram nodes
    syncNodeEquipment: (equipment: Equipment) => void;

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
    spreadsheetUrl: '',
    driveFolderId: '',
    driveFileId: '',
    driveFolderName: '',
    selectedEquipmentIds: [],
    additionalCosts: [],
    staff: [],
    schedule: [],
    members: [],
    artboard: {
        enabled: false,
        size: 'A4',
        orientation: 'landscape',
    },
    discountAmount: 0,
    discountType: 'percent',
    discountIncludedCategories: ['staff', 'equipment', 'production'], // Default to 1-3
    equipmentOverrides: {},
    editingEdgeId: null,
};

export const useProjectStore = create<ProjectState & ProjectActions>((set, get) => ({
    ...initialState,

    setEditingEdgeId: (id) => set({ editingEdgeId: id }),

    loadProject: (state) => {
        const parsedState = recursiveDateParse(state) as ProjectState;

        // Migration Logic: Ensure all edges are 'cable' type
        if (parsedState.edges) {
            parsedState.edges = parsedState.edges.map(edge => ({
                ...edge,
                type: 'cable', // Force type
                data: {
                    ...edge.data,
                    length: (edge.data?.length as string) || '1m', // Ensure length exists
                }
            }));
        }

        // Initialize artboard and members if missing
        parsedState.artboard = parsedState.artboard || initialState.artboard;
        parsedState.members = parsedState.members || [];
        parsedState.discountAmount = parsedState.discountAmount || 0;
        parsedState.discountType = parsedState.discountType || 'percent';
        parsedState.discountIncludedCategories = parsedState.discountIncludedCategories || ['staff', 'equipment', 'production'];
        parsedState.equipmentOverrides = parsedState.equipmentOverrides || {};

        set(parsedState);
    },

    resetProject: () => set(initialState),

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setDriveFolderId: (id) => set({ driveFolderId: id }),
    setDriveFileId: (id) => set({ driveFileId: id }),
    setDriveFolderName: (name) => set({ driveFolderName: name }),

    updateQuotationSettings: (settings) => set((state) => ({ ...state, ...settings })),

    updateEquipmentOverride: (id, override) => set((state) => ({
        equipmentOverrides: {
            ...state.equipmentOverrides,
            [id]: {
                ...state.equipmentOverrides[id],
                ...override
            }
        }
    })),

    updateMetadata: (data) => set((state) => {
        const newState = { ...state, ...data };

        // Sync to Registry (Basic Sync)
        // In a real app, this might be debounced or explicit save
        // We defer the import to avoid circular dependency issues if they arise, 
        // or just rely on the fact that this is a client-side side effect.
        // For simplicity, we just assume the user will 'Save' explicitly or we just do it here.
        // Since we can't easily import the hook inside the store action without breaking rules sometimes, 
        // we'll rely on the Component to trigger the sync OR we accept a side-effect here.
        // Let's try to keep it simple: we WON'T import the hook here. 
        // Instead, the ProjectInfoView or a 'AutoSaver' component should observe store changes and write to Registry.
        return newState;
    }),

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

    // Cost Actions
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

    // Staff Actions
    setStaff: (staff) => set({ staff }),
    addStaff: (staff) => set((state) => ({
        staff: [...(state.staff || []), { ...staff, id: crypto.randomUUID() }]
    })),
    updateStaff: (id, updatedStaff) => set((state) => ({
        staff: (state.staff || []).map((s) => s.id === id ? { ...s, ...updatedStaff } : s)
    })),
    removeStaff: (id) => set((state) => ({
        staff: (state.staff || []).filter((s) => s.id !== id)
    })),

    // Schedule Actions
    setSchedule: (schedule) => set({ schedule }),
    addScheduleItem: (item) => set((state) => ({
        schedule: [...(state.schedule || []), { ...item, id: crypto.randomUUID() }]
    })),
    updateScheduleItem: (id, item) => set((state) => ({
        schedule: (state.schedule || []).map((s) => s.id === id ? { ...s, ...item } : s)
    })),
    removeScheduleItem: (id) => set((state) => ({
        schedule: (state.schedule || []).filter((s) => s.id !== id)
    })),

    syncNodeEquipment: (equipment) => {
        set(state => ({
            nodes: state.nodes.map(node => {
                if (node.data?.equipmentId !== equipment.id) return node;
                let connectors: NonNullable<Equipment['connectors']> = equipment.connectors || [];
                if (connectors.length === 0 && (equipment.inputPortCount > 0 || equipment.outputPortCount > 0)) {
                    const inputs = Array.from({ length: equipment.inputPortCount || 0 }, (_, i) => ({
                        id: `in-${i + 1}`, name: `In ${i + 1}`, type: 'Generic', direction: 'input' as const,
                    }));
                    const outputs = Array.from({ length: equipment.outputPortCount || 0 }, (_, i) => ({
                        id: `out-${i + 1}`, name: `Out ${i + 1}`, type: 'Generic', direction: 'output' as const,
                    }));
                    connectors = [...inputs, ...outputs];
                }
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...equipment,
                        label: equipment.name,
                        equipmentId: equipment.id,
                        connectors,
                    }
                };
            })
        }));
    },

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onConnect: (connection) => {
        const edge: Edge = {
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            type: 'cable',
            animated: true,
            data: { length: '1m', type: 'Signal' },
            ...connection,
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
