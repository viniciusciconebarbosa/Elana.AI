"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react"
import { getChatRepository } from "@/core/infrastructure/repositories/ChatRepositoryFactory"

const chatRepository = getChatRepository()

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000'

export interface ChatSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ChatListContextValue {
  chats: ChatSummary[]
  isLoading: boolean
  /** Called by ChatService after a new chat is created to push it to the top instantly */
  addChat: (chat: ChatSummary) => void
  /** Called by sidebar inline rename – optimistic update + PATCH request */
  renameChat: (id: string, newTitle: string) => Promise<void>
  /** Called by chat header to delete a chat */
  removeChat: (id: string) => Promise<void>
  /** Full refresh from the server */
  refreshChats: () => Promise<void>
}

const ChatListContext = createContext<ChatListContextValue | null>(null)

// PROVEDOR DE CONTEXTO — GERENCIA A LISTA DE CHATS DO USUÁRIO
export function ChatListProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // BUSCA TODOS OS CHATS DO SERVIDOR E ATUALIZA O ESTADO
  const refreshChats = useCallback(async () => {
    try {
      const data = await chatRepository.getChatsByUserId(MOCK_USER_ID)
      setChats(data)
    } catch (err) {
      console.error("Erro ao carregar chats:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load once on mount
  useEffect(() => {
    refreshChats()
  }, [refreshChats])

  // ADICIONA UM CHAT NOVO NO TOPO DA LISTA (CHAMADO APÓS CRIAÇÃO)
  const addChat = useCallback((chat: ChatSummary) => {
    setChats((prev) => {
      // Avoid duplicates
      if (prev.some((c) => c.id === chat.id)) return prev
      return [chat, ...prev]
    })
  }, [])

  // RENOMEIA UM CHAT COM UPDATE OTIMISTA (ATUALIZA O ESTADO ANTES DE CONFIRMAR NO SERVIDOR)
  const renameChat = useCallback(async (id: string, newTitle: string) => {
    // Optimistic update
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    )
    try {
      await chatRepository.updateChatTitle(id, newTitle)
    } catch (err) {
      console.error("Erro ao renomear chat:", err)
      // Revert on failure
      await refreshChats()
    }
  }, [refreshChats])

  // REMOVE UM CHAT COM UPDATE OTIMISTA E DELETA NO SERVIDOR
  const removeChat = useCallback(async (id: string) => {
    // Antes de deletar, pega todas as mensagens para limpar imagens locais do disco
    try {
      const messages = await chatRepository.getAllMessagesFromChat(id)
      const localImagePaths: string[] = []
      for (const msg of messages) {
        const imgs: string[] = msg.metadata?.images || []
        for (const img of imgs) {
          if (img.startsWith('asset://')) localImagePaths.push(img)
        }
      }
      if (localImagePaths.length > 0) {
        const { remove } = await import('@tauri-apps/plugin-fs')
        for (const assetUrl of localImagePaths) {
          try {
            const physicalPath = decodeURIComponent(assetUrl.replace(/^asset:\/\/localhost/, '').replace(/^asset:\/\//, ''))
            await remove(physicalPath)
          } catch (e) {
            console.warn('Não foi possível apagar imagem local ao excluir chat:', e)
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao coletar imagens para limpeza:', e)
    }

    // Optimistic update
    setChats((prev) => prev.filter((c) => c.id !== id))
    try {
      await chatRepository.deleteChat(id)
    } catch (err) {
      console.error("Erro ao excluir chat:", err)
      await refreshChats()
    }
  }, [refreshChats])

  return (
    <ChatListContext.Provider value={{ chats, isLoading, addChat, renameChat, removeChat, refreshChats }}>
      {children}
    </ChatListContext.Provider>
  )
}

// HOOK PARA CONSUMIR O CHATLISTCONTEXT EM QUALQUER COMPONENTE
export function useChatList() {
  const ctx = useContext(ChatListContext)
  if (!ctx) throw new Error("useChatList must be used inside <ChatListProvider>")
  return ctx
}
