import type { Chat, Message } from '@/core/infrastructure/repositories/ChatRepository'

// CONTRATO DO REPOSITÓRIO DE CHATS — IMPLEMENTADO PELO SUPABASE E PELO SQLITE
export interface IChatRepository {
    // Cria um novo chat no banco de dados ativo
    createChat(chat: Omit<Chat, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Chat>
    
    // Retorna um chat específico pelo seu ID
    getChatById(id: string): Promise<Chat | null>
    
    // Retorna a lista de todos os chats de um usuário ordenados por data
    getChatsByUserId(userId: string): Promise<Chat[]>
    
    // Atualiza o timestamp de modificação de um chat para a data atual
    updateChatTimestamp(id: string): Promise<void>
    
    // Atualiza o título (nome) do chat e seu timestamp de modificação
    updateChatTitle(id: string, title: string): Promise<void>
    
    // Remove permanentemente um chat e em cascata todas as suas mensagens
    deleteChat(id: string): Promise<void>
    
    // Insere uma nova mensagem atrelada a um chat e a um nó pai na árvore
    addMessage(message: Omit<Message, 'id' | 'created_at'> & { id?: string }): Promise<Message>
    
    // Retorna uma mensagem específica pelo seu ID
    getMessageById(id: string): Promise<Message | null>
    
    // Atualiza os metadados de uma mensagem (usado para salvar links de imagens)
    updateMessageMetadata(id: string, metadata: any): Promise<void>
    
    // Percorre a árvore de mensagens de baixo para cima retornando o galho exato da conversa
    getMessageBranch(leafMessageId: string): Promise<Message[]>
    
    // Retorna de forma plana todas as mensagens atreladas a um chat
    getAllMessagesFromChat(chatId: string): Promise<Message[]>
    
    // Deleta uma mensagem e TODAS as suas subsequentes (útil para o "Refazer")
    deleteMessageAndSubsequent(messageId: string, chatId: string): Promise<void>
}
