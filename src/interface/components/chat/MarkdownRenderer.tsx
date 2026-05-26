"use client"

import { lazy, Suspense, memo } from "react"

const MarkdownParserLazy = lazy(() => import("./MarkdownParser"))

interface MarkdownRendererProps {
    children: string
}

function MarkdownRendererBase({ children }: MarkdownRendererProps) {
    return (
        <Suspense fallback={
            <div className="space-y-2 py-1 select-none animate-pulse">
                <div className="h-3.5 bg-muted-foreground/10 rounded w-[85%]" />
                <div className="h-3.5 bg-muted-foreground/10 rounded w-[60%]" />
            </div>
        }>
            <MarkdownParserLazy>{children}</MarkdownParserLazy>
        </Suspense>
    )
}

export const MarkdownRenderer = memo(
    MarkdownRendererBase,
    (prev, next) => prev.children === next.children
)
