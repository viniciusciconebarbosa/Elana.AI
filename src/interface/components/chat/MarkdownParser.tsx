"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { useState, useCallback, memo } from "react"
import { Copy, Check } from "lucide-react"
import type { Components } from "react-markdown"
import type { ComponentPropsWithoutRef } from "react"

/* ─── Copy Button ──────────────────────────────────────────────────────────── */

interface MarkdownParserProps {
    children: string
}

function CopyButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code)
        } catch {
            const el = document.createElement("textarea")
            el.value = code
            document.body.appendChild(el)
            el.select()
            document.execCommand("copy")
            document.body.removeChild(el)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [code])

    return (
        <button
            onClick={handleCopy}
            aria-label="Copiar código"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: "5px",
                background: "var(--card)",
                color: "var(--muted-foreground)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                outline: "none",
            }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copiado!" : "Copiar"}
        </button>
    )
}

/* ─── Language label helper ────────────────────────────────────────────────── */

function parseLanguage(className?: string): string {
    const match = /language-(\w+)/.exec(className ?? "")
    return match ? match[1] : "texto"
}

/* ─── Custom renderers ─────────────────────────────────────────────────────── */

const components: Components = {
    // BLOCOS DE CÓDIGO (PRE)
    pre({ children, ...props }) {
        const codeEl = children as React.ReactElement<ComponentPropsWithoutRef<"code">> | null
        const rawCode =
            typeof codeEl?.props?.children === "string"
                ? codeEl.props.children
                : String(codeEl?.props?.children ?? "")
        const lang = parseLanguage(
            (codeEl?.props as { className?: string } | undefined)?.className
        )

        return (
            <div className="custom-scrollbar" style={{
                margin: "12px 0",
                borderRadius: "10px",
                background: "var(--background)",
                border: "1px solid color-mix(in oklch, var(--border) 40%, transparent)",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
                scrollbarColor: "color-mix(in oklch, var(--primary) 20%, transparent) transparent",
                position: "relative",
                zIndex: 0,
                transform: "translateZ(0)",
            }}>
                {/* Header do Bloco de Código */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "8px 8px 0 0",
                    justifyContent: "space-between",
                    padding: "6px 12px",
                    background: "var(--muted)",
                    borderBottom: "1px solid var(--border)",
                }}>
                    <span style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: "11px",

                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        color: "var(--muted-foreground)",
                        textTransform: "uppercase",
                    }}>
                        {lang}
                    </span>
                    <CopyButton code={rawCode.replace(/\n$/, "")} />
                </div>

                {/* Área do Código */}
                <pre {...props} style={{
                    margin: 0,
                    padding: "14px 16px",
                    overflowX: "auto",
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                    fontSize: "13px",
                    lineHeight: 1.65,
                    background: "transparent",
                }}>
                    {children}
                </pre>
            </div>
        )
    },

    // CÓDIGO EM LINHA (INLINE CODE)
    code({ className, children, ...props }) {
        const isBlock = /language-/.test(className ?? "")
        if (isBlock) {
            return (
                <code className={className} style={{ fontFamily: "inherit", background: "transparent" }} {...props}>
                    {children}
                </code>
            )
        }
        return (
            <code style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
                fontSize: "0.82em",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "var(--muted)",
                color: "var(--primary)",
                border: "1px solid var(--border)",
            }} {...props}>
                {children}
            </code>
        )
    },

    // CITAÇÕES (BLOCKQUOTE)
    blockquote({ children }) {
        return (
            <blockquote style={{
                margin: "10px 0",
                padding: "8px 16px",
                borderLeft: "3px solid var(--primary)",
                background: "color-mix(in oklch, var(--primary) 8%, transparent)",
                color: "var(--muted-foreground)",
                fontStyle: "italic",
            }}>
                {children}
            </blockquote>
        )
    },

    // TABELAS (CONTAINER)
    table({ children }) {
        return (
            <div
                className="custom-scrollbar"
                style={{
                    overflowX: "auto",
                    margin: "16px 0",
                    borderRadius: "10px",
                    border: "1px solid color-mix(in oklch, var(--border) 40%, transparent)",
                    boxShadow: "0 4px 20px -5px color-mix(in oklch, var(--primary) 10%, transparent)",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "thin", 
                    scrollbarColor: "color-mix(in oklch, var(--primary) 20%, transparent) transparent",
                }}
            >
                <table style={{
                    width: "max-content",
                    minWidth: "100%",
                    borderCollapse: "collapse",
                    letterSpacing: "0.02em",
                }}>
                    {children}
                </table>
            </div>
        )
    },

    // CABEÇALHO DA TABELA (THEAD)
    thead({ children }) {
        return (
            <thead style={{
                background: "var(--primary)",
                borderBottom: "1px solid color-mix(in oklch, var(--primary) 20%, var(--border))",
            }}>
                {children}
            </thead>
        )
    },

    // TÍTULOS DA COLUNA (TABLE HEAD)
    th({ children }) {
        return (
            <th style={{
                padding: "11px 16px",
                textAlign: "left",
                fontWeight: 700,
                fontSize: "11px",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                color: "var(--primary-foreground)",
            }}>
                {children}
            </th>
        )
    },

    // CORPO DA TABELA (TBODY)
    tbody({ children }) {
        return (
            <tbody style={{ position: "relative" }}>
                {children}
            </tbody>
        )
    },

    // LINHAS DA TABELA (TR)
    tr({ children }) {
        return (
            <tr
                style={{
                    borderBottom: "1px solid color-mix(in oklch, var(--border) 30%, transparent)",
                    transition: "background 0.2s ease",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in oklch, var(--primary) 4%, transparent)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
                {children}
            </tr>
        )
    },

    // CÉLULAS DA TABELA (TD - CONTEÚDO)
    td({ children }) {
        return (
            <td style={{
                padding: "10px 16px",
                color: "var(--foreground)",
                verticalAlign: "top",
                lineHeight: 1.6,
                fontSize: "13.5px",
            }}>
                {children}
            </td>
        )
    },

    // TÍTULO H1
    h1({ children }) {
        return <h1 style={{ fontWeight: 700, fontSize: "1.4em", margin: "16px 0 6px", paddingBottom: "6px", paddingTop: "6px", color: "var(--foreground)", lineHeight: 1.3 }}>{children}</h1>
    },
    // TÍTULO H2
    h2({ children }) {
        return <h2 style={{ fontWeight: 700, fontSize: "1.2em", margin: "14px 0 5px", paddingBottom: "16px", paddingTop: "6px", color: "var(--foreground)", lineHeight: 1.3 }}>{children}</h2>
    },
    // TÍTULO H3
    h3({ children }) {
        return <h3 style={{ fontWeight: 700, fontSize: "1.05em", margin: "1px 0 4px", paddingBottom: "6px", paddingTop: "6px", color: "var(--foreground)", lineHeight: 1.3 }}>{children}</h3>
    },
    // TÍTULO H4
    h4({ children }) {
        return <h4 style={{ fontWeight: 600, fontSize: "1em", margin: "10px 0 4px", paddingBottom: "6px", paddingTop: "6px", color: "var(--foreground)", lineHeight: 1.3 }}>{children}</h4>
    },

    // PARÁGRAFO
    p({ children }) {
        return <p style={{ margin: "6px 0", lineHeight: 1.75, paddingBottom: "6px", paddingTop: "6px" }}>{children}</p>
    },

    // LISTAS NÃO ORDENADAS (UL)
    ul({ children }) {
        return <ul style={{ margin: "6px 0", paddingLeft: "22px", listStyle: "disc" }}>{children}</ul>
    },
    // LISTAS ORDENADAS (OL)
    ol({ children }) {
        return <ol style={{ margin: "6px 0", paddingLeft: "22px", listStyle: "decimal" }}>{children}</ol>
    },
    // ITEM DE LISTA (LI)
    li({ children }) {
        return <li style={{ margin: "3px 0", lineHeight: 1.65 }}>{children}</li>
    },

    // LINHA HORIZONTAL (HR)
    hr() {
        return <br></br>
    },

    // LINKS (A)
    a({ href, children }) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{
                color: "var(--primary)",
                textDecoration: "underline",
                textUnderlineOffset: "2px",
            }}>
                {children}
            </a>
        )
    },

    // TEXTO EM NEGRITO (STRONG)
    strong({ children }) {
        return <strong style={{ fontWeight: 700 }}>{children}</strong>
    },
    // TEXTO EM ITÁLICO (EM)
    em({ children }) {
        return <em style={{ fontStyle: "italic" }}>{children}</em>
    },
}

// COMPONENTE PRINCIPAL QUE RENDERIZA O MARKDOWN
function MarkdownParserBase({ children }: MarkdownParserProps) {
    // Remove a tag <visual-memory> e todo o seu conteúdo (mesmo que ainda esteja em streaming e não tenha fechado a tag)
    const cleanContent = children.replace(/<visual-memory>[\s\S]*?(<\/visual-memory>|$)/gi, "").trim()

    return (
        <div style={{ color: "inherit", lineHeight: 1.75, overflowWrap: "anywhere", wordBreak: "normal" }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
            >
                {cleanContent}
            </ReactMarkdown>
        </div>
    )
}

// EXPORTAÇÃO COM MEMO (EVITA RE-RENDERIZAÇÃO DESNECESSÁRIA PARA PERFORMANCE)
export const MarkdownParser = memo(
    MarkdownParserBase,
    (prev, next) => prev.children === next.children
)

export default MarkdownParser
