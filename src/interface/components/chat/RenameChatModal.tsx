"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/interface/components/ui/dialog"
import { Button } from "@/interface/components/ui/button"
import { Input } from "@/interface/components/ui/input"
import { useChatList } from "@/interface/context/ChatListContext"

interface RenameChatModalProps {
  chatId: string | null
  currentTitle: string
  isOpen: boolean
  onClose: () => void
}

// MODAL PARA RENOMEAR UM CHAT EXISTENTE
export function RenameChatModal({
  chatId,
  currentTitle,
  isOpen,
  onClose,
}: RenameChatModalProps) {
  const [title, setTitle] = useState(currentTitle)
  const { renameChat } = useChatList()
  const [isSaving, setIsSaving] = useState(false)

  // Sincroniza o título quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle)
    }
  }, [isOpen, currentTitle])

  // SALVA O NOVO TÍTULO DO CHAT SE VÁLIDO
  const handleSave = async () => {
    if (!chatId) return
    const trimmed = title.trim()
    if (trimmed && trimmed !== currentTitle) {
      setIsSaving(true)
      await renameChat(chatId, trimmed)
      setIsSaving(false)
    }
    onClose()
  }

  // ATALHO: ENTER PARA CONFIRMAR O RENAME
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renomear Chat</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite o novo nome do chat..."
            disabled={isSaving}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !title.trim() || title === currentTitle}
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
