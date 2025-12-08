import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Equipment } from '@/types/equipment';
import { MOCK_EQUIPMENT } from '@/data/mockEquipment';

interface EquipmentState {
    equipment: Equipment[];
    addEquipment: (item: Equipment) => void;
    updateEquipment: (id: string, item: Partial<Equipment>) => void;
    deleteEquipment: (id: string) => void;
    resetToDefault: () => void;
}

export const useEquipmentStore = create<EquipmentState>()(
    persist(
        (set) => ({
            equipment: MOCK_EQUIPMENT,

            addEquipment: (item) => set((state) => ({
                equipment: [...state.equipment, item]
            })),

            updateEquipment: (id, item) => set((state) => ({
                equipment: state.equipment.map((e) =>
                    e.id === id ? { ...e, ...item } : e
                )
            })),

            deleteEquipment: (id) => set((state) => ({
                equipment: state.equipment.filter((e) => e.id !== id)
            })),

            resetToDefault: () => set({ equipment: MOCK_EQUIPMENT }),
        }),
        {
            name: 'equipment-storage',
        }
    )
);
