import { create } from 'zustand';
import { CompanyInfo, DEFAULT_COMPANY_INFO } from '@/types/document';

interface SettingsState {
    taxRate: number;
    currency: string;
    defaultArtboardSize: 'A4' | 'A3';
    defaultArtboardOrientation: 'portrait' | 'landscape';
    companyInfo: CompanyInfo;
    updateSettings: (settings: Partial<Omit<SettingsState, 'updateSettings' | 'loadFromServer'>>) => void;
    loadFromServer: () => Promise<void>;
}

const DEFAULT_STATE = {
    taxRate: 10,
    currency: '¥',
    defaultArtboardSize: 'A4' as const,
    defaultArtboardOrientation: 'landscape' as const,
    companyInfo: DEFAULT_COMPANY_INFO,
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(settings: Omit<SettingsState, 'updateSettings' | 'loadFromServer'>) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        fetch('/api/db/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        }).catch(e => console.error('[SettingsStore] Save failed', e));
    }, 1500);
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
    ...DEFAULT_STATE,

    loadFromServer: async () => {
        const res = await fetch('/api/db/settings');
        if (res.ok) {
            const data = await res.json();
            if (data) set({ ...DEFAULT_STATE, ...data });
        }
    },

    updateSettings: (newSettings) => {
        set((state) => ({ ...state, ...newSettings }));
        const { updateSettings: _, loadFromServer: __, ...current } = get();
        scheduleSave({ ...current, ...newSettings });
    },
}));
