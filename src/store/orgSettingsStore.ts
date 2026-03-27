import { create } from 'zustand'
import { CompanyInfo, DEFAULT_COMPANY_INFO } from '@/types/document'
import { useSettingsStore } from './settingsStore'

export interface OrgSettings {
  companyInfo: CompanyInfo
  taxRate: number
  currency: string
}

const DEFAULT_ORG_SETTINGS: OrgSettings = {
  companyInfo: DEFAULT_COMPANY_INFO,
  taxRate: 10,
  currency: '¥',
}

interface OrgSettingsState extends OrgSettings {
  isLoaded: boolean
  update: (settings: Partial<OrgSettings>) => void
  loadFromServer: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave(settings: OrgSettings) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    fetch('/api/db/org-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(e => console.error('[OrgSettingsStore] Save failed', e))
  }, 1500)
}

export const useOrgSettingsStore = create<OrgSettingsState>()((set, get) => ({
  ...DEFAULT_ORG_SETTINGS,
  isLoaded: false,

  loadFromServer: async () => {
    const res = await fetch('/api/db/org-settings')
    if (!res.ok) return
    const data = await res.json()
    if (!data || Object.keys(data).length === 0) {
      set({ isLoaded: true })
      return
    }
    const merged = { ...DEFAULT_ORG_SETTINGS, ...data }
    set({ ...merged, isLoaded: true })
    // settingsStore との後方互換性のため同期
    useSettingsStore.getState().updateSettings({
      companyInfo: merged.companyInfo,
      taxRate: merged.taxRate,
      currency: merged.currency,
    })
  },

  update: (settings) => {
    set(state => ({ ...state, ...settings }))
    const { isLoaded: _, update: __, loadFromServer: ___, ...current } = get()
    const next = { ...current, ...settings }
    scheduleSave(next)
    // settingsStore も同期
    useSettingsStore.getState().updateSettings(settings)
  },
}))
