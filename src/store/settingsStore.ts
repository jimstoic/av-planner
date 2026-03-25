import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompanyInfo, DEFAULT_COMPANY_INFO } from '@/types/document';

interface SettingsState {
    taxRate: number;
    currency: string;
    defaultArtboardSize: 'A4' | 'A3';
    defaultArtboardOrientation: 'portrait' | 'landscape';
    companyInfo: CompanyInfo;

    // Actions
    updateSettings: (settings: Partial<Omit<SettingsState, 'updateSettings'>>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            taxRate: 10,
            currency: '¥',
            defaultArtboardSize: 'A4',
            defaultArtboardOrientation: 'landscape',
            companyInfo: DEFAULT_COMPANY_INFO,

            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
        }),
        {
            name: 'av-planner-settings',
        }
    )
);
