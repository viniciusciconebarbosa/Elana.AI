import { Suspense, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { categories } from "@/interface/components/app-sidebar"
import { Database } from "lucide-react"
import { MemoriesHeader } from "@/interface/components/memories/MemoriesHeader"
import { MemoriesSearchBar } from "@/interface/components/memories/MemoriesSearchBar"
import { MemoryCard, type Memory } from "@/interface/components/memories/MemoryCard"
import { MemoryDetailDialog } from "@/interface/components/memories/MemoryDetailDialog"

const mockMemories: Memory[] = []

// PÁGINA DE MEMÓRIAS — ENVOLVE O CONTEÚDO EM SUSPENSE PARA LOADING SEGURO
export default function MemoriesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando memórias...</div>}>
      <MemoriesContent />
    </Suspense>
  )
}

// CONTEÚDO DAS MEMÓRIAS — FILTRA, BUSCA E EXIBE OS CARTÕES DE MEMÓRIA
function MemoriesContent() {
  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get("category") || "all"
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)

  const filteredMemories = mockMemories.filter((memory) => {
    const matchesSearch =
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || memory.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // RETORNA O ÍCONE DA CATEGORIA PELO ID
  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.icon || Database
  }

  // RETORNA O LABEL DA CATEGORIA PELO ID
  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.label || categoryId
  }

  return (
    <div className="flex flex-col w-full h-full pb-15 sm:pb-35 md:pb-1">
      <MemoriesHeader count={filteredMemories.length} />

      <MemoriesSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMemories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                getCategoryIcon={getCategoryIcon}
                getCategoryLabel={getCategoryLabel}
                onView={() => setSelectedMemory(memory)}
              />
            ))}
          </div>

          {filteredMemories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma memória encontrada</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Tente ajustar sua busca ou filtros para encontrar o que procura.
              </p>
            </div>
          )}
        </div>
      </div>

      <MemoryDetailDialog
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        getCategoryIcon={getCategoryIcon}
        getCategoryLabel={getCategoryLabel}
      />
    </div>
  )
}
