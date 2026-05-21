
interface DaySeparatorProps {
  date: Date
}

// SEPARADOR DE DIA — LINHA VISUAL ENTRE MENSAGENS DE DIAS DIFERENTES
export function DaySeparator({ date }: DaySeparatorProps) {
  const label = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex items-center gap-3 my-4 select-none">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-emerald-500/80" />
      <span
        className="
          text-xs font-semibold uppercase tracking-widest
          text-emerald-400 bg-emerald-500/10
          border border-emerald-500/30
          rounded-full px-3 py-1
          whitespace-nowrap
        "
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-emerald-500/60 to-emerald-500/80" />
    </div>
  )
}
