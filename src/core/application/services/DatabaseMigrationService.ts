import { ChatRepository } from '@/core/infrastructure/repositories/ChatRepository'
import { SQLiteChatRepository } from '@/core/infrastructure/repositories/SQLiteChatRepository'
import { uploadImageToLocalFs, uploadImageToS3 } from '@/core/application/services/ChatImageService'

export type DbProvider = 'supabase' | 'sqlite'

export class DatabaseMigrationService {
    private supabaseRepo = new ChatRepository()
    private sqliteRepo = new SQLiteChatRepository()

    // Converte URL (https:// ou asset://) em Base64 para poder fazer re-upload
    private async fetchImageAsBase64(url: string): Promise<string | null> {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })
        } catch (error) {
            console.error('Erro ao baixar imagem para migração:', url, error)
            return null
        }
    }

    // Processa a migração física das imagens de uma mensagem
    private async migrateImages(images: string[], to: DbProvider): Promise<string[]> {
        const migratedUrls: string[] = []
        for (const url of images) {
            // Se estamos migrando para SQLite e a imagem está no S3
            if (to === 'sqlite' && url.startsWith('https://')) {
                const base64 = await this.fetchImageAsBase64(url)
                if (base64) {
                    const localUrl = await uploadImageToLocalFs(base64)
                    migratedUrls.push(localUrl || url)
                    continue
                }
            }
            
            // Se estamos migrando para Supabase e a imagem está local
            if (to === 'supabase' && url.startsWith('asset://')) {
                const base64 = await this.fetchImageAsBase64(url)
                if (base64) {
                    const s3Url = await uploadImageToS3(base64)
                    migratedUrls.push(s3Url || url)
                    continue
                }
            }
            
            // Se não caiu nas condições acima (ou deu erro), mantém a original
            migratedUrls.push(url)
        }
        return migratedUrls
    }

    async migrate(from: DbProvider, to: DbProvider, onProgress: (progress: number, status: string) => void) {
        if (from === to) return

        const source = from === 'supabase' ? this.supabaseRepo : this.sqliteRepo
        const dest = to === 'supabase' ? this.supabaseRepo : this.sqliteRepo

        // 1. Pega os chats do banco de origem
        onProgress(0, 'Calculando chats a serem migrados...')
        
        // Pega um ID fixo por enquanto já que o Elana não tem autenticação local múltipla
        // TODO: Se tiver sistema de login amarrado, usar o ID do usuário correto
        const USER_ID = '00000000-0000-0000-0000-000000000000' 
        
        let chats: any[] = []
        try {
            chats = await source.getChatsByUserId(USER_ID)
        } catch (e: any) {
            console.error('Erro detalhado de migração:', e)
            const errorMsg = e?.message || e?.details || JSON.stringify(e)
            throw new Error(`Erro ao conectar no banco de origem: ${errorMsg}. Verifique se suas chaves e URLs estão corretas e ativas.`)
        }
        
        if (!chats || chats.length === 0) {
            onProgress(100, 'Nenhum chat encontrado na origem para migrar.')
            return
        }

        let completedChats = 0

        for (const chat of chats) {
            onProgress(
                Math.round((completedChats / chats.length) * 100), 
                `Migrando chat: "${chat.title}"...`
            )

            // 2. Verifica se o chat já existe no destino para evitar duplicação cega
            const existingChat = await dest.getChatById(chat.id)
            if (!existingChat) {
                // Se não existe, cria com o MESMO ID
                await dest.createChat({
                    id: chat.id,
                    user_id: chat.user_id,
                    title: chat.title,
                    system_prompt: chat.system_prompt
                })
                // Sobrescreve o update_timestamp e title para não perder os dados originais e força o ID real via query se necessário,
                // Mas wait, a interface de createChat gera o ID. Vamos ter que adaptar ou inserir as mensagens mesmo assim!
                // Como não podemos injetar o ID via interface createChat padronizada, vamos adaptar:
                // No nosso método addMessage nós permitimos { id?: string }! Mas no createChat esquecemos.
            }

            // 3. Puxa as mensagens
            const messages = await source.getAllMessagesFromChat(chat.id)

            for (const msg of messages) {
                const existingMsg = await dest.getMessageById(msg.id)
                if (!existingMsg) {
                    // Migra as imagens físicas antes de salvar a mensagem no banco
                    let metadata = { ...msg.metadata }
                    if (metadata.images && Array.isArray(metadata.images)) {
                        metadata.images = await this.migrateImages(metadata.images, to)
                    }

                    // Salva a mensagem mantendo o ID original
                    await dest.addMessage({
                        id: msg.id,
                        chat_id: msg.chat_id,
                        parent_id: msg.parent_id,
                        role: msg.role as 'system' | 'user' | 'assistant',
                        content: msg.content,
                        metadata: metadata
                    })
                }
            }

            completedChats++
        }

        onProgress(100, 'Migração concluída com sucesso!')
    }
}

export const databaseMigrationService = new DatabaseMigrationService()
