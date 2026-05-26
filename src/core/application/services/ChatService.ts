import { streamText, stepCountIs } from 'ai';
import { getChatRepository } from '@/core/infrastructure/repositories/ChatRepositoryFactory';

const chatRepository = getChatRepository();
import { ModelConfig } from '@/interface/context/ModelContext';
import { AIProviderFactory } from '@/core/infrastructure/ai/AIProviderFactory';

// Importando novos serviços
import { resolveModelConfig, resolveApiKey } from './ChatModelResolver';
import { ensureChatExists, saveUserMessage } from './ChatPersistenceService';
import { processMessageImages } from './ChatImageService';
import { getSystemPrompt, formatModelMessages } from './ChatPromptBuilder';
import {
    webSearchTool,
    readWebpageTool,
    crawlWebTool,
    researchWebTool
} from './ChatTools';

export interface ChatServiceInput {
    messages: any[];
    rawUserText?: string;
    chatId?: string;
    parentId?: string;
    webSearchEnabled?: boolean;
    config?: ModelConfig;
    apiKeys?: { gemini?: string; openai?: string };
}

// ORQUESTRA TODO O FLUXO DO CHAT: RESOLVE MODELO, PROCESSA IMAGENS, PERSISTE E INICIA O STREAM
export async function runChatService({ messages, rawUserText, chatId, parentId, webSearchEnabled, config, apiKeys }: ChatServiceInput) {
    let streamError: any = null;

    // 1. Resolver Configuração do Modelo e API Key
    const resolvedConfig = await resolveModelConfig(config);
    const { model: modelId, modelName, maxTokens, temperature, topP, presencePenalty, frequencyPenalty, isGeminiModel } = resolvedConfig;
    const apiKey = await resolveApiKey(isGeminiModel, apiKeys);

    if (!apiKey) {
        const providerName = isGeminiModel ? 'Gemini' : 'OpenAI/Compatible';
        return {
            error: {
                code: `MISSING_${providerName.toUpperCase()}_KEY`,
                message: `Chave de API do ${providerName} não configurada.`
            },
        };
    }

    // 2. Processar Imagens e Conteúdo
    const { processedMessages, imagesToDb, textContent } = await processMessageImages(messages);

    // USE O RAWUSERTEXT SE DISPONIBILIZADO(SEM PREFIXO DE TIMESTAMP) 
    const contentToSave = rawUserText ?? textContent;

    // 3. Garantir que o Chat existe no Banco
    const currentChatId = await ensureChatExists(chatId, contentToSave);

    // 4. Salvar Mensagem do Usuário
    let savedUserMessageId: string | undefined;
    if (currentChatId) {
        const savedMsg = await saveUserMessage(currentChatId, contentToSave, parentId, imagesToDb);
        if (savedMsg) savedUserMessageId = savedMsg.id;
    }

    // 5. Instanciar Modelo via Factory
    const provider = AIProviderFactory.getProvider(resolvedConfig);
    const model = provider.createModel(resolvedConfig, apiKey);
    const supportsVision = provider.supportsVision(modelId);

    // 6. Formatar mensagens para o modelo (Vision check)
    const finalModelMessages = formatModelMessages(processedMessages, supportsVision);

    // 6.5. Injetar instrução dinâmica de Memória Visual se houver imagem ativa
    const lastMessage = processedMessages[processedMessages.length - 1];
    const hasActiveImage = Array.isArray(lastMessage?.content) &&
        lastMessage.content.some((part: any) => part.type === 'image');

    // CHECA SE TEM UMA IMAGEM ATIVA NO MOMENTO
    const finalSystemPrompt = hasActiveImage && supportsVision
        ? `${getSystemPrompt()}\n\n[ATENÇÃO: Você recebeu uma imagem nesta mensagem. Como os pixels desta imagem serão removidos
         do histórico nas próximas interações para economizar tokens, você DEVE gerar uma análise extremamente detalhada,
          minuciosa e completa dela no FINAL de sua resposta, encapsulada dentro da tag customizada HTML <visual-memory>...
          </visual-memory> 
        (exemplo: <visual-memory>[Análise minuciosa, transcrição de textos, dados de gráficos, cores e detalhes visuais 
        importantes]</visual-memory>). Tudo que estiver dentro dessa tag será ocultado do usuário no frontend por CSS, 
        mas ficará gravado no banco de dados e servirá como sua própria memória visual nas próximas interações deste chat.]`
        : getSystemPrompt();
    // 7. Iniciar Stream
    const result = streamText({
        model,
        system: finalSystemPrompt,
        messages: finalModelMessages,
        maxOutputTokens: Number(maxTokens),
        temperature,
        topP,
        presencePenalty: isGeminiModel ? undefined : presencePenalty,
        frequencyPenalty: isGeminiModel ? undefined : frequencyPenalty,
        stopWhen: stepCountIs(5),
        tools: {
            ...(webSearchEnabled ? {
                web_search: webSearchTool,
                read_webpage: readWebpageTool,
                crawl_web: crawlWebTool,
                research_web: researchWebTool
            } : {})
        },
        onError: ({ error }) => {
            streamError = error;
        },
        onFinish: async (info) => {
            let finalContent = info.text;

            if (!finalContent.trim()) {
                finalContent = imagesToDb.length > 0
                    ? `⚠️ **Erro da API**\n\nO modelo selecionado não suporta envio de imagens ou a conexão falhou silenciosamente.`
                    : `⚠️ **Erro da API**\n\nO modelo não retornou nenhuma resposta.`;
            }

            if (currentChatId) {
                try {
                    await chatRepository.addMessage({
                        chat_id: currentChatId,
                        parent_id: savedUserMessageId || null,
                        role: 'assistant',
                        content: finalContent,
                        metadata: { usage: info.usage },
                    });
                } catch (err) {
                    console.error('Erro ao salvar resposta assistant no banco:', err);
                }
            }
        },
    });

    // 8. Reconstruir Stream para o Cliente — injeta eventos de tool como linhas [TOOL:nome]
    const encoder = new TextEncoder();

    // FUNÇÃO QUE GERA LABELS DINÂMICOS BASEADOS NO INPUT DA TOOL
    const getToolLabel = (toolName: string, rawInput: any) => {
        let input = rawInput;
        // Dependendo da versão do SDK e do provedor, input pode vir como string JSON
        if (typeof rawInput === 'string') {
            try {
                input = JSON.parse(rawInput);
            } catch (e) {
                input = {};
            }
        }

        switch (toolName) {
            case 'consult_life_history':
                return input?.query ? `🧠 Consultando memórias sobre: "${input.query}"...` : '🧠 Consultando memórias...';
            case 'web_search':
                return input?.query ? `🔎 Pesquisando na web por: "${input.query}"...` : '🔎 Pesquisando na web...';
            case 'read_webpage':
                return input?.url ? `📄 Lendo página: ${input.url}...` : '📄 Lendo página...';
            case 'crawl_web':
                return input?.url ? `🕷️ Mapeando site: ${input.url}...` : '🕷️ Navegando no site...';
            case 'research_web':
                return input?.query ? `🔬 Pesquisando a fundo sobre: "${input.query}"...` : '🔬 Pesquisando em profundidade...';
            default:
                return `🔧 Usando ${toolName}...`;
        }
    };

    // Usa for-await-of NO start PARA PERCORRER CORRETAMENTE O FULLSTREAM EM FLUXOS MULTI-STEP
    // O padrão start/pull não funciona bem com o async iterator do SDK em tool calls encadeados
    const customStream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of result.fullStream) {
                    if (chunk.type === 'text-delta' && chunk.text) {
                        controller.enqueue(encoder.encode(chunk.text));
                    } else if (chunk.type === 'tool-call') {
                        const label = getToolLabel(chunk.toolName, (chunk as any).input);
                        controller.enqueue(encoder.encode(`[TOOL:${label}]\n`));
                    } else if (chunk.type === 'tool-result') {
                        controller.enqueue(encoder.encode(`[TOOL_DONE]\n`));
                    } else if (chunk.type === 'error') {
                        // Encerra o stream e deixa o frontend tratar o conteúdo vazio
                        break;
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        }
    });

    return { customStream, currentChatId };
}
