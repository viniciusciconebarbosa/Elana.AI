"use client"

import { Input } from "@/interface/components/ui/input"
import { Button } from "@/interface/components/ui/button"
import { Badge } from "@/interface/components/ui/badge"
import { Search, Filter, Clock } from "lucide-react"

const timelineYears = ["2024", "2023", "2022", "2021"]

interface MemoriesSearchBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

// BARRA DE BUSCA DAS MEMÓRIAS — INPUT DE TEXTO + FILTRO + TIMELINE POR ANO
export function MemoriesSearchBar({ searchQuery, onSearchChange }: MemoriesSearchBarProps) {
  return (
    <div className="sticky p-4 space-y-4" style={{ boxShadow: '0 1px 8px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)' }}>
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar memórias, tags, fatos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-2 flex items-center gap-1 whitespace-nowrap">
          <Clock className="w-3 h-3" />
          Timeline
        </span>
        {timelineYears.map((year) => (
          <Badge
            key={year}
            variant="secondary"
            className="cursor-pointer hover:bg-primary/20 transition-colors whitespace-nowrap text-xs py-1 px-3"
          >
            {year}
          </Badge>
        ))}
      </div>
    </div>
  )
}
