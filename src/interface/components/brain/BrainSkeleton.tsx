// SKELETON DE LOADING DO BRAIN — EXIBIDO ENQUANTO O CONTEÚDO ESTÁ CARREGANDO
export function BrainSkeleton() {
  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto animate-pulse">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-96 bg-muted rounded-xl" />
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    </div>
  )
}
