"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

type Theme = "dark"

export function AresThemeProvider({ children }: { children: React.ReactNode }) {
  return <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>{children}</NextThemesProvider>
}

export function useTheme() {
  const context = React.useContext(
    React.createContext<any>(null)
  )

  // Always return dark theme - no toggle
  return { theme: "dark" as Theme, setTheme: () => {} }
}
