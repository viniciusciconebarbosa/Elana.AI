import { Suspense } from "react"
import { BrainHeader } from "@/interface/components/brain/BrainHeader"
import { BrainContent } from "@/interface/components/brain/BrainContent"
import { BrainSkeleton } from "@/interface/components/brain/BrainSkeleton"

// PÁGINA DO BRAIN — EXIBE O CABEÇALHO E O CONTEÚDO DO BRAIN COM SUSPENSE
export default function BrainPage() {
  return (
    <div className="flex flex-col h-full">
      <BrainHeader />
      <Suspense fallback={<BrainSkeleton />}>
        <BrainContent />
      </Suspense>
    </div>
  )
}
