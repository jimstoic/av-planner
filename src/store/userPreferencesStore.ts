import { create } from 'zustand'

export type AppLanguage = 'ja' | 'en'
export type DefaultView = 'dashboard' | 'open' | 'library' | 'documents'
export type DateFormat = 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY'
export type ArtboardSize = 'A4' | 'A3'
export type ArtboardOrientation = 'portrait' | 'landscape'

export interface UserPreferences {
  displayName: string
  language: AppLanguage
  defaultView: DefaultView
  defaultArtboardSize: ArtboardSize
  defaultArtboardOrientation: ArtboardOrientation
  dateFormat: DateFormat
}

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: '',
  language: 'ja',
  defaultView: 'dashboard',
  defaultArtboardSize: 'A4',
  defaultArtboardOrientation: 'landscape',
  dateFormat: 'YYYY/MM/DD',
}

interface UserPreferencesState extends UserPreferences {
  isLoaded: boolean
  update: (prefs: Partial<UserPreferences>) => void
  loadFromServer: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave(prefs: UserPreferences) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    fetch('/api/db/user-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    }).catch(e => console.error('[UserPreferencesStore] Save failed', e))
  }, 1000)
}

export const useUserPreferencesStore = create<UserPreferencesState>()((set, get) => ({
  ...DEFAULT_PREFERENCES,
  isLoaded: false,

  loadFromServer: async () => {
    const res = await fetch('/api/db/user-preferences')
    if (!res.ok) return
    const data = await res.json()
    const merged = { ...DEFAULT_PREFERENCES, ...(data ?? {}) }
    set({ ...merged, isLoaded: true })
  },

  update: (prefs) => {
    set(state => ({ ...state, ...prefs }))
    const { isLoaded: _, update: __, loadFromServer: ___, ...current } = get()
    scheduleSave({ ...current, ...prefs })
  },
}))
