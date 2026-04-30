// src/context/ThemeContext.jsx - Versión simplificada (sin temas)
import { createContext, useContext } from 'react'

const ThemeContext = createContext({})

export function ThemeProvider({ children }) {
  // No hacer nada con temas, solo pasar children
  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}