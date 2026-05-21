'use client'

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

// WRAPPER DO PROVEDOR DE TEMA — ENCAPSULA O NEXT-THEMES PARA USO EM TODA A APLICAÇÃO
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
