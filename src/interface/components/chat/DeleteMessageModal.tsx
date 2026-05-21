import { Trash2, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/interface/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/interface/components/ui/tooltip"
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

export function DeleteMessageButton({ children, onConfirm }: DeleteChatModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault()
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
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-block">
                        <AlertDialogTrigger asChild>
                            {children}
                        </AlertDialogTrigger>
                    </span>
                </TooltipTrigger>
                <TooltipContent>Apagar a partir daqui</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Apagar Histórico?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja apagar esta mensagem e todas as seguintes? Esta ação excluirá os dados e mídias permanentemente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting }>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isDeleting}
                        onClick={handleConfirm}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apagar Tudo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
