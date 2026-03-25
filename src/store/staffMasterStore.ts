import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// Staff Master — global staff registry across projects
// ============================================================

export interface StaffMaster {
    id: string;
    name: string;
    role: string;       // Director, Camera, Sound, etc.
    dayRate: number;
    email: string;
    phone?: string;
}

interface StaffMasterState {
    masterStaff: StaffMaster[];

    // Actions
    addMasterStaff: (staff: Omit<StaffMaster, 'id'>) => void;
    updateMasterStaff: (id: string, updates: Partial<StaffMaster>) => void;
    removeMasterStaff: (id: string) => void;
}

function generateId(): string {
    return `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export const useStaffMasterStore = create<StaffMasterState>()(
    persist(
        (set) => ({
            masterStaff: [],

            addMasterStaff: (staff) => set((state) => ({
                masterStaff: [
                    ...state.masterStaff,
                    { ...staff, id: generateId() },
                ],
            })),

            updateMasterStaff: (id, updates) => set((state) => ({
                masterStaff: state.masterStaff.map(s =>
                    s.id === id ? { ...s, ...updates } : s
                ),
            })),

            removeMasterStaff: (id) => set((state) => ({
                masterStaff: state.masterStaff.filter(s => s.id !== id),
            })),
        }),
        {
            name: 'av-planner-staff-master',
        }
    )
);
