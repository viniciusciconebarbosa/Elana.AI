import { Brain, Sparkles, Menu } from "lucide-react"
import { Button } from "@/interface/components/ui/button"
import { useSidebar } from "@/interface/context/SidebarContext"

// CABEÇALHO DA PÁGINA BRAIN — TÍTULO, BOTÃO DE MENU MOBILE E AÇÃO DE NOVO DOCUMENTO
export function BrainHeader() {
  const { toggleMobile } = useSidebar()

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-sm" style={{ boxShadow: '0 1px 8px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.04)' }}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 -ml-2"
          onClick={toggleMobile}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Brain</h1>
          <p className="text-sm text-muted-foreground">
            Adicione conhecimento ao seu assistente
          </p>
        </div>
      </div>
      <Button className="gap-2">
     {/*    <Sparkles className="w-4 h-4" /> */}
        Novo Documento
      </Button>
    </header>
  )
}
