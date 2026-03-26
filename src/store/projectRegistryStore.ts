import { create } from 'zustand';
import { areIntervalsOverlapping } from 'date-fns';

export interface ProjectSummary {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
    equipmentUsage: { equipmentId: string; quantity: number }[];
    // Driveとの連携フィールド
    driveFolderId?: string;
    driveFileId?: string;
    driveFolderName?: string;
    clientName?: string;
    venue?: string;
    memberEmails?: string[];
}

interface ProjectRegistryState {
    projects: ProjectSummary[];
    registerProject: (project: ProjectSummary) => void;
    removeProject: (id: string) => void;
    loadFromServer: () => Promise<void>;
    checkAvailability: (
        equipmentId: string,
        totalStock: number,
        startDate: Date,
        endDate: Date,
        excludeProjectId?: string
    ) => { available: boolean; conflictProjectNames: string[]; remainingStock: number };
}

async function apiCall(path: string, options?: RequestInit) {
    const res = await fetch(path, options);
    if (!res.ok) console.error('[ProjectRegistryStore]', await res.text());
}

export const useProjectRegistryStore = create<ProjectRegistryState>()((set, get) => ({
    projects: [],

    loadFromServer: async () => {
        const res = await fetch('/api/db/projects');
        if (res.ok) {
            const data: any[] = await res.json();
            set({
                projects: data.map(p => ({
                    ...p,
                    startDate: p.startDate ? new Date(p.startDate) : new Date(),
                    endDate: p.endDate ? new Date(p.endDate) : new Date(),
                })),
            });
        }
    },

    registerProject: (project) => {
        set((state) => {
            const idx = state.projects.findIndex(p => p.id === project.id);
            if (idx >= 0) {
                const updated = [...state.projects];
                updated[idx] = project;
                return { projects: updated };
            }
            return { projects: [...state.projects, project] };
        });
        apiCall('/api/db/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project),
        });
    },

    removeProject: (id) => {
        set((state) => ({ projects: state.projects.filter(p => p.id !== id) }));
        apiCall(`/api/db/projects/${id}`, { method: 'DELETE' });
    },

    checkAvailability: (equipmentId, totalStock, startDate, endDate, excludeProjectId) => {
        const { projects } = get();
        const overlapping = projects.filter(p => {
            if (p.id === excludeProjectId) return false;
            if (p.status === 'cancelled') return false;
            return areIntervalsOverlapping(
                { start: new Date(p.startDate), end: new Date(p.endDate) },
                { start: new Date(startDate), end: new Date(endDate) },
                { inclusive: true }
            );
        });

        let usedQuantity = 0;
        const conflictNames: string[] = [];
        overlapping.forEach(p => {
            const usage = p.equipmentUsage.find(u => u.equipmentId === equipmentId);
            if (usage) {
                usedQuantity += usage.quantity;
                conflictNames.push(p.name);
            }
        });

        return {
            available: totalStock - usedQuantity > 0,
            remainingStock: totalStock - usedQuantity,
            conflictProjectNames: conflictNames,
        };
    },
}));
