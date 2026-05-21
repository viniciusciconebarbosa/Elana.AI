import { supabase } from '../database/supabase';
import { createS3Client, IMAGE_BUCKET, getPublicImageBaseUrl } from '../storage/S3Client';
import { DeleteObjectsCommand } from '@aws-sdk/client-s3';

export interface Chat {
    id: string;
    user_id: string;
    title: string;
    system_prompt: string | null;
    created_at: string; // Supabase retorna como string ISO
    updated_at: string;
}

export interface Message {
    id: string;
    chat_id: string;
    parent_id: string | null;
    role: 'system' | 'user' | 'assistant';
    content: string;
    metadata: any;
    created_at: string;
}

export class ChatRepository {
    /**
     * Cria um novo chat
     */
    async createChat(chat: Omit<Chat, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Chat> {
        const chatId = chat.id || crypto.randomUUID()
        const { data, error } = await supabase
            .from('chats')
            .insert([
                {
                    id: chatId,
                    user_id: chat.user_id,
                    title: chat.title,
                    system_prompt: chat.system_prompt
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Busca um chat pelo ID
     */
    async getChatById(id: string): Promise<Chat | null> {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = NotFound
        return data || null;
    }

    /**
     * Lista chats de um usuário
     */
    async getChatsByUserId(userId: string): Promise<Chat[]> {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Atualiza o timestamp de um chat manualmente
     * Obs: Se o Trigger "update_chat_timestamp" estiver rodando no banco, 
     * isso acontecerá automaticamente ao inserir mensagem.
     */
    async updateChatTimestamp(id: string): Promise<void> {
        const { error } = await supabase
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Atualiza o título de um chat
     */
    async updateChatTitle(id: string, title: string): Promise<void> {
        const { error } = await supabase
            .from('chats')
            .update({ title })
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Exclui um chat (mensagens são excluídas por CASCADE) e remove imagens associadas do Storage
     */
    async deleteChat(id: string): Promise<void> {
        // 1. Busca mensagens para encontrar imagens associadas
        try {
            const messages = await this.getAllMessagesFromChat(id);
            const imagesToDelete: { Key: string }[] = [];
            const baseUrl = getPublicImageBaseUrl();

            for (const msg of messages) {
                if (msg.metadata?.images && Array.isArray(msg.metadata.images)) {
                    for (const url of msg.metadata.images) {
                        if (typeof url === 'string') {
                            if (url.startsWith(baseUrl)) {
                                const key = url.replace(`${baseUrl}/`, '');
                                imagesToDelete.push({ Key: key });
                            } else if (!url.startsWith('http') && !url.startsWith('data:')) {
                                imagesToDelete.push({ Key: url });
                            }
                        }
                    }
                }
            }

            // 2. Apaga as imagens do S3 se houver alguma
            if (imagesToDelete.length > 0) {
                const s3Client = createS3Client();
                await s3Client.send(
                    new DeleteObjectsCommand({
                        Bucket: IMAGE_BUCKET,
                        Delete: { Objects: imagesToDelete }
                    })
                );
            }
        } catch (err) {
            console.error('Erro ao deletar imagens do S3:', err);
            // Não interrompemos o fluxo, pois o principal é deletar o chat do banco
        }

        // 3. Apaga o chat no banco
        const { error } = await supabase
            .from('chats')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Adiciona uma nova mensagem e retorna a mesma (com id gerado ou o informado)
     */
    async addMessage(message: Omit<Message, 'id' | 'created_at'> & { id?: string }): Promise<Message> {
        const insertData: any = {
            chat_id: message.chat_id,
            parent_id: message.parent_id,
            role: message.role,
            content: message.content,
            metadata: message.metadata
        };

        if (message.id) {
            insertData.id = message.id;
        }

        const { data, error } = await supabase
            .from('messages')
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Busca uma mensagem pelo ID
     */
    async getMessageById(id: string): Promise<Message | null> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }

    /**
     * Atualiza o metadata de uma mensagem
     */
    async updateMessageMetadata(id: string, metadata: any): Promise<void> {
        const { error } = await supabase
            .from('messages')
            .update({ metadata })
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Pega todo o branch (caminho) de mensagens a partir de uma mensagem (leaf) até a raiz (sem parent)
     * Usa a RPC "get_message_branch" criada via SQL
     */
    async getMessageBranch(leafMessageId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .rpc('get_message_branch', { leaf_message_id: leafMessageId });

        if (error) throw error;
        return data || [];
    }

    /**
     * Busca todas as mensagens de um chat ordenadas por data
     * Pode não representar um único branch se houver edições (ramificações)
     */
    async getAllMessagesFromChat(chatId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Deleta uma mensagem e todas as mensagens posteriores no mesmo chat, incluindo imagens no S3
     */
    async deleteMessageAndSubsequent(messageId: string, chatId: string): Promise<void> {
        const msg = await this.getMessageById(messageId);
        if (!msg) return;

        try {
            const { data: messagesToDelete, error: fetchErr } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .gte('created_at', msg.created_at);

            if (!fetchErr && messagesToDelete) {
                const baseUrl = getPublicImageBaseUrl();
                const imagesToDelete: { Key: string }[] = [];

                for (const m of messagesToDelete) {
                    if (m.metadata?.images && Array.isArray(m.metadata.images)) {
                        for (const url of m.metadata.images) {
                            if (typeof url === 'string') {
                                if (url.startsWith(baseUrl)) {
                                    imagesToDelete.push({ Key: url.replace(`${baseUrl}/`, '') });
                                } else if (!url.startsWith('http') && !url.startsWith('data:')) {
                                    imagesToDelete.push({ Key: url });
                                }
                            }
                        }
                    }
                }

                if (imagesToDelete.length > 0) {
                    const s3Client = createS3Client();
                    await s3Client.send(
                        new DeleteObjectsCommand({
                            Bucket: IMAGE_BUCKET,
                            Delete: { Objects: imagesToDelete }
                        })
                    );
                }
            }
        } catch (s3Err) {
            console.error('Erro ao deletar imagens do S3:', s3Err);
        }

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('chat_id', chatId)
            .gte('created_at', msg.created_at);

        if (error) throw error;
    }
}

export const chatRepository = new ChatRepository();
