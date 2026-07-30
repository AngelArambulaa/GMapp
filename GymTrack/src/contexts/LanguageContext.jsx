import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('lang') || 'en'
  )

  const toggle = () => {
    const next = lang === 'en' ? 'es' : 'en'
    localStorage.setItem('lang', next)
    setLang(next)
  }

  // Helper: get exercise name in current language
  const exName = (exercise) => {
    if (!exercise) return ''
    if (lang === 'es' && exercise.name_es) return exercise.name_es
    return exercise.name
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle, exName }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)