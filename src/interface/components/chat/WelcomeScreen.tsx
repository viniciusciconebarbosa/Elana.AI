"use client"

import { Sparkles, Map, Atom, Terminal, BookOpen, Coffee } from "lucide-react"

// SUGESTÕES DE PROMPTS EXIBIDAS NA TELA INICIAL (CARD DESIGN)
const suggestedPrompts = [
{
    title: "Projetos & Conquistas",
    prompt: "Quais foram os meus principais projetos recentes e os resultados que alcancei neles?",
    description: "Uma retrospectiva inteligente dos seus marcos técnicos e entregas de alto impacto.",
    icon: BookOpen
  },
  {
    title: "Planejador de Viagens",
    prompt: "Monte um roteiro de viagem personalizado e otimizado com base nas minhas preferências.",
    description: "Itinerários inteligentes e logísticas personalizadas para o seu próximo destino.",
    icon: Map
  }
]

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void
}

// TELA DE BOAS-VINDAS — EXIBIDA QUANDO NÃO HÁ MENSAGENS NO CHAT
export function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-2 sm:px-10 md:px-12 lg:px-14"> 
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 glow">
        <Terminal className="w-8 h-8 gradient-text shadow-depth-lg " /> 
      </div>
      <h2 className="text-3xl font-bold mb-3">
        <p>Olá! Sou a Elana.</p>
        <p className="gradient-text"> Pronto para explorar novas ideias?</p>
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md text-sm leading-relaxed">
        Sou sua assistente pessoal com memória de longo prazo.
        Conheço sua história e posso ajudar de forma personalizada.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl mt-1">
        {suggestedPrompts.map((item, i) => {
          const Icon = item.icon
          return (
            <button
              key={i}
              onClick={() => onPromptClick(item.prompt)}
              className="group relative flex items-start gap-2 p-3 text-left rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 shadow-sm hover:shadow-depth-sm overflow-hidden"
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:to-primary/5 transition-all duration-300" />
              
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-all shrink-0">
                <Icon className="w-5 h-5" />
              </div> 
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
