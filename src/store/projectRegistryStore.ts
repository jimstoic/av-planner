import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { areIntervalsOverlapping } from 'date-fns';

export interface ProjectSummary {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
    equipmentUsage: { equipmentId: string; quantity: number }[];
}

interface ProjectRegistryState {
    projects: ProjectSummary[];
    registerProject: (project: ProjectSummary) => void;
    // Check if a specific equipment is available during a period
    // Returns: { available: boolean, conflictProjectNames: string[], remainingStock: number }
    checkAvailability: (
        equipmentId: string,
        totalStock: number,
        startDate: Date,
        endDate: Date,
        excludeProjectId?: string
    ) => { available: boolean; conflictProjectNames: string[]; remainingStock: number };
}

export const useProjectRegistryStore = create<ProjectRegistryState>()(
    persist(
        (set, get) => ({
            projects: [],

            registerProject: (project) => set((state) => {
                const existingIndex = state.projects.findIndex(p => p.id === project.id);
                if (existingIndex >= 0) {
                    const newProjects = [...state.projects];
                    newProjects[existingIndex] = project;
                    return { projects: newProjects };
                }
                return { projects: [...state.projects, project] };
            }),

            checkAvailability: (equipmentId, totalStock, startDate, endDate, excludeProjectId) => {
                const { projects } = get();

                // Find overlapping projects
                const overlappingProjects = projects.filter(p => {
                    if (p.id === excludeProjectId) return false;
                    if (p.status === 'cancelled') return false; // Ignore cancelled

                    return areIntervalsOverlapping(
                        { start: new Date(p.startDate), end: new Date(p.endDate) },
                        { start: new Date(startDate), end: new Date(endDate) },
                        { inclusive: true }
                    );
                });

                let usedQuantity = 0;
                const conflictNames: string[] = [];

                overlappingProjects.forEach(p => {
                    const usage = p.equipmentUsage.find(u => u.equipmentId === equipmentId);
                    if (usage) {
                        usedQuantity += usage.quantity;
                        conflictNames.push(p.name);
                    }
                });

                const remaining = totalStock - usedQuantity;

                return {
                    available: remaining > 0,
                    remainingStock: remaining,
                    conflictProjectNames: conflictNames
                };
            }
        }),
        {
            name: 'av-planner-registry',
            partialize: (state) => ({
                projects: state.projects.map(p => ({
                    ...p,
                    // Ensure dates are strings for JSON
                    startDate: p.startDate,
                    endDate: p.endDate
                }))
            }),
            // @ts-expect-error - onRehydrateStorage complex typing
            onRehydrateStorage: () => (state) => {
                // Revive dates
                if (state) {
                    state.projects = state.projects.map(p => ({
                        ...p,
                        startDate: new Date(p.startDate),
                        endDate: new Date(p.endDate)
                    }));
                }
            }
        }
    )
);
