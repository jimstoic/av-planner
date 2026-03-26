import { create } from 'zustand';
import { Equipment } from '@/types/equipment';
import { MOCK_EQUIPMENT } from '@/data/mockEquipment';

interface EquipmentState {
    equipment: Equipment[];
    addEquipment: (item: Equipment) => void;
    updateEquipment: (id: string, item: Partial<Equipment>) => void;
    deleteEquipment: (id: string) => void;
    resetToDefault: () => void;
    setEquipment: (items: Equipment[]) => void;
    loadFromServer: () => Promise<void>;
}

async function apiCall(path: string, options?: RequestInit) {
    const res = await fetch(path, options);
    if (!res.ok) console.error('[EquipmentStore]', await res.text());
}

export const useEquipmentStore = create<EquipmentState>()((set, get) => ({
    equipment: [],

    loadFromServer: async () => {
        const res = await fetch('/api/db/equipment');
        if (res.ok) {
            const data = await res.json();
            set({ equipment: data.length > 0 ? data : MOCK_EQUIPMENT });
        }
    },

    addEquipment: (item) => {
        set((state) => ({ equipment: [...state.equipment, item] }));
        apiCall('/api/db/equipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
    },

    updateEquipment: (id, item) => {
        set((state) => ({
            equipment: state.equipment.map((e) => e.id === id ? { ...e, ...item } : e),
        }));
        const updated = get().equipment.find(e => e.id === id);
        if (updated) {
            apiCall(`/api/db/equipment/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
        }
    },

    deleteEquipment: (id) => {
        set((state) => ({ equipment: state.equipment.filter((e) => e.id !== id) }));
        apiCall(`/api/db/equipment/${id}`, { method: 'DELETE' });
    },

    resetToDefault: () => {
        set({ equipment: MOCK_EQUIPMENT });
        apiCall('/api/db/equipment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_EQUIPMENT),
        });
    },

    setEquipment: (items) => {
        set({ equipment: items });
        apiCall('/api/db/equipment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items),
        });
    },
}));
