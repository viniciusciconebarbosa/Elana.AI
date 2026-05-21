import { useState } from "react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/interface/components/ui/alert-dialog"

interface DeleteChatModalProps {
    children: React.ReactNode
    onConfirm: () => Promise<void> | void
}

// MODAL DE CONFIRMAÇÃO PARA EXCLUIR UM CHAT
export function DeleteChatModal({ children, onConfirm }: DeleteChatModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault() // Evita o fechamento automático do Radix para controlarmos manualmente
        if (isDeleting) return

        setIsDeleting(true)
        try {
            await onConfirm()
        } finally {
            setIsDeleting(false)
            setIsOpen(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Isso excluirá permanentemente o histórico deste chat.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Excluindo..." : "Excluir Chat"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
