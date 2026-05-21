import { tool } from 'ai';
import { z } from 'zod';
import { QdrantMemoryRepository } from '@/core/infrastructure/qdrant/MemoryRepository';
import { MistralEmbeddingService } from '@/core/infrastructure/mistral/EmbeddingService';
import { SearchMemoriesUseCase } from '@/core/application/usecases/SearchMemoriesUseCase';
import { getActiveToolsConfig } from '@/interface/context/ToolsSettingsContext';

// HELPER INTERNO: ENVIA REQUISIÇÕES PARA A API DO TAVILY (WEB SEARCH)
async function fetchTavily(endpoint: string, body: any) {
    const toolsConfig = getActiveToolsConfig();
    const apiKey = toolsConfig.tavilyApiKey || import.meta.env.VITE_TAVILY_API_KEY;

    if (!apiKey) {
        throw new Error("Tavily API Key não configurada. Adicione nas configurações de Ferramentas.");
    }

    const response = await fetch(`https://api.tavily.com/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: apiKey,
            ...body
        })
    });
    if (!response.ok) throw new Error(`Tavily error: ${response.statusText}`);
    return response.json();
}           

// FERRAMENTA: CONSULTA A MEMÓRIA DE LONGO PRAZO DO USUÁRIO VIA QDRANT + MISTRAL
export const consultLifeHistoryTool = tool({
    description: 'Consulta a memória de longo prazo do usuário para encontrar informações relevantes sobre sua vida.',
    inputSchema: z.object({
        query: z.string().describe('A pergunta ou termo para buscar na memória do usuário'),
    }),
    execute: async ({ query }) => {
        const memoryRepository = new QdrantMemoryRepository();
        const embeddingService = new MistralEmbeddingService();
        const searchUseCase = new SearchMemoriesUseCase(memoryRepository, embeddingService);
        const output = await searchUseCase.execute({ query });
        return output.results.length > 0 
            ? `REGISTROS ENCONTRADOS:\n${output.results.map(r => `- ${r.text}`).join('\n')}`
            : 'Nenhum registro específico encontrado sobre isso.';
    },
});

// FERRAMENTA: BUSCA RÁPIDA NA INTERNET (RESULTADO SIMPLES)
export const webSearchTool = tool({
    description: 'Realiza uma busca rápida na internet.',
    inputSchema: z.object({
        query: z.string().describe('O termo de busca'),
    }),
    execute: async ({ query }) => {
        try {
            const response = await fetchTavily('search', { query, search_depth: 'basic' });
            return response.results.map((r: any) => `- ${r.title}: ${r.url}\n  ${r.content}`).join('\n\n');
        } catch (error: any) {
            return `Erro na busca: ${error.message}`;
        }
    },
});

// FERRAMENTA: PESQUISA PROFUNDA E DETALHADA (TAVILY ADVANCED + RESPOSTA RESUMIDA)
export const researchWebTool = tool({
    description: 'Realiza uma pesquisa profunda e detalhada na internet.',
    inputSchema: z.object({
        query: z.string().describe('O tópico para pesquisa profunda.'),
    }),
    execute: async ({ query }) => {
        try {
            const response = await fetchTavily('search', { query, search_depth: 'advanced', include_answer: true });
            const formattedResults = response.results
                .map((r: any) => `Título: ${r.title}\nFonte: ${r.url}\nConteúdo: ${r.content}`)
                .join('\n\n---\n\n');
            return `RESUMO: ${response.answer}\n\nDETALHES:\n${formattedResults}`;
        } catch (error: any) {
            return `Erro na pesquisa profunda: ${error.message}`;
        }
    },
});

// FERRAMENTA: EXTRAI O CONTEÚDO DE UMA PÁGINA WEB ESPECÍFICA
export const readWebpageTool = tool({
    description: 'Extrai o conteúdo limpo de uma página da web específica.',
    inputSchema: z.object({
        url: z.string().url().describe('A URL completa da página a ser lida.'),
    }),
    execute: async ({ url }) => {
        try {
            const response = await fetchTavily('extract', { urls: [url] });
            const content = response.results[0]?.rawContent || "Não foi possível extrair o conteúdo.";
            return `CONTEÚDO DA PÁGINA (${url}):\n\n${content.substring(0, 15000)}`;
        } catch (error: any) {
            return `Erro ao extrair conteúdo da página: ${error.message}`;
        }
    },
});

// FERRAMENTA: RASTREIA MÚLTIPLAS PÁGINAS DE UM DOMÍNIO
export const crawlWebTool = tool({
    description: 'Mapeia e extrai informações de múltiplas páginas de um domínio.',
    inputSchema: z.object({
        url: z.string().url().describe('A URL base do site para começar o rastreamento.'),
    }),
    execute: async ({ url }) => {
        try {
            const response = await fetchTavily('search', { query: `site:${url}`, max_results: 10 });
            return response.results.map((r: any) => `- ${r.title} (${r.url})\n  ${r.content}`).join('\n\n');
        } catch (error: any) {
            return `Erro ao rastrear o site: ${error.message}`;
        }
    },
});


