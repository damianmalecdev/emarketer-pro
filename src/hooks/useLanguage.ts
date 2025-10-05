'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { translations, Language } from '@/lib/i18n/translations'

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
  t: typeof translations.pl
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'pl',
      setLanguage: (language: Language) => set({ language, t: translations[language] }),
      t: translations.pl,
    }),
    {
      name: 'emarketer-language',
      storage: createJSONStorage(() => {
        // Only use localStorage on client side
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // Return a dummy storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = translations[state.language]
        }
      },
    }
  )
)

