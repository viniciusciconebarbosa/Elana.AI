import React, { createContext, useContext, useState, useCallback } from "react"

const STORAGE_KEY = "elana_user_name"

interface UserProfileContextType {
  userName: string
  userInitial: string
  hasName: boolean
  updateUserName: (name: string) => void
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

// PROVEDOR DE CONTEXTO — ARMAZENA O NOME DO USUÁRIO NO LOCALSTORAGE
export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || "Usuário"
    }
    return "Usuário"
  })

  const updateUserName = useCallback((name: string) => {
    const trimmed = name.trim()
    if (trimmed) {
      setUserName(trimmed)
      localStorage.setItem(STORAGE_KEY, trimmed)
    } else {
      setUserName("Usuário")
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U"
  const hasName = userName.length > 0

  return (
    <UserProfileContext.Provider value={{ userName, userInitial, hasName, updateUserName }}>
      {children}
    </UserProfileContext.Provider>
  )
}

// HOOK PARA CONSUMIR O USERPROFILECONTEXT EM QUALQUER COMPONENTE
export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider")
  }
  return context
}
