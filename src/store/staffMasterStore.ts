import { create } from 'zustand';

export interface StaffMaster {
    id: string;
    name: string;
    email: string;
    phone?: string;
    isExternal?: boolean;
}

interface StaffMasterState {
    masterStaff: StaffMaster[];
    addMasterStaff: (staff: Omit<StaffMaster, 'id'>) => void;
    updateMasterStaff: (id: string, updates: Partial<StaffMaster>) => void;
    removeMasterStaff: (id: string) => void;
    setMasterStaff: (staff: StaffMaster[]) => void;
    loadFromServer: () => Promise<void>;
}

function generateId(): string {
    return `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

async function apiCall(path: string, options?: RequestInit) {
    const res = await fetch(path, options);
    if (!res.ok) console.error('[StaffMasterStore]', await res.text());
}

export const useStaffMasterStore = create<StaffMasterState>()((set, get) => ({
    masterStaff: [],

    loadFromServer: async () => {
        const res = await fetch('/api/db/staff');
        if (res.ok) {
            const data = await res.json();
            set({ masterStaff: data });
        }
    },

    addMasterStaff: (staff) => {
        const newStaff: StaffMaster = { ...staff, id: generateId() };
        set((state) => ({ masterStaff: [...state.masterStaff, newStaff] }));
        apiCall('/api/db/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStaff),
        });
    },

    updateMasterStaff: (id, updates) => {
        set((state) => ({
            masterStaff: state.masterStaff.map(s => s.id === id ? { ...s, ...updates } : s),
        }));
        const updated = get().masterStaff.find(s => s.id === id);
        if (updated) {
            apiCall(`/api/db/staff/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
        }
    },

    removeMasterStaff: (id) => {
        set((state) => ({ masterStaff: state.masterStaff.filter(s => s.id !== id) }));
        apiCall(`/api/db/staff/${id}`, { method: 'DELETE' });
    },

    setMasterStaff: (staff) => {
        set({ masterStaff: staff });
        apiCall('/api/db/staff', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staff),
        });
    },
}));
