import { getChatRepository } from '@/core/infrastructure/repositories/ChatRepositoryFactory';

const chatRepository = getChatRepository();

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

// LOGA ERROS DO BANCO DE FORMA ESTRUTURADA COM DETALHES DO SUPABASE
const logDbError = (label: string, err: unknown) => {
    const e = err as any
    console.error(label, { message: e?.message, code: e?.code, details: e?.details, hint: e?.hint })
}

// GARANTE QUE O CHAT EXISTE NO BANCO — CRIA UM NOVO SE AINDA NÃO TIVER ID
export async function ensureChatExists(chatId?: string, firstMessageText?: string) {
    // Trata "new" como "sem chat ainda" — não é um UUID válido
    const existingChatId = (chatId && chatId !== 'new') ? chatId : undefined

    if (!existingChatId && firstMessageText) {
        try {
            const newChat = await chatRepository.createChat({
                user_id: MOCK_USER_ID,
                title: firstMessageText.slice(0, 40) + (firstMessageText.length > 40 ? '...' : ''),
                system_prompt: 'A Elana é uma assistente pessoal inteligente...',
            });
            return newChat.id;
        } catch (err) {
            logDbError('Erro ao criar chat no banco:', err)
        }
    }

    return existingChatId;
}

// SALVA A MENSAGEM DO USUÁRIO NO BANCO COM IMAGENS SE HOUVER
export async function saveUserMessage(chatId: string, text: string, parentId?: string, images?: string[]) {
    try {
        return await chatRepository.addMessage({
            chat_id: chatId,
            parent_id: parentId || null,
            role: 'user',
            content: text,
            metadata: { images: images && images.length > 0 ? images : undefined },
        });
    } catch (err) {
        logDbError('Erro ao salvar mensagem de user no banco:', err)
        return null;
    }
}

// SALVA A RESPOSTA DO ASSISTENTE NO BANCO
export async function saveAssistantMessage(chatId: string, text: string, parentId?: string) {
    try {
        await chatRepository.addMessage({
            chat_id: chatId,
            parent_id: parentId || null,
            role: 'assistant',
            content: text,
            metadata: {},
        });
    } catch (err) {
        logDbError('Erro ao salvar resposta do assistente no banco:', err)
    }
}

