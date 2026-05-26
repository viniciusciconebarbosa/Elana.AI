import type { IChatRepository } from '@/core/domain/interfaces/IChatRepository'
import type { Chat, Message } from '@/core/infrastructure/repositories/ChatRepository'
import Database from '@tauri-apps/plugin-sql'
import { appDataDir } from '@tauri-apps/api/path'
import { mkdir } from '@tauri-apps/plugin-fs'

// REPOSITÓRIO SQLITE LOCAL COESIVO
// Usa o tauri-plugin-sql nativo no Mobile/Desktop e sql-asm.js (IndexedDB) como Fallback na Web.

const DEFAULT_USER_ID = 'local-user'

// ─── LÓGICA DE FALLBACK WEB (INDEXEDDB + SQL.JS) ──────────────────────────────

// SALVA O BANCO DE DADOS EM FORMATO BINÁRIO NO INDEXEDDB
async function saveToFallbackDB(data: Uint8Array) {
    const req = indexedDB.open('elana-sqlite', 1)
    return new Promise<void>((resolve, reject) => {
        req.onupgradeneeded = (e: any) => {
            const idb = e.target.result as IDBDatabase
            if (!idb.objectStoreNames.contains('db')) idb.createObjectStore('db')
        }
        req.onsuccess = (e: any) => {
            const idb = e.target.result as IDBDatabase
            const tx = idb.transaction('db', 'readwrite')
            tx.objectStore('db').put(data, 'main')
            tx.oncomplete = () => resolve()
            tx.onerror = reject
        }
        req.onerror = reject
    })
}

// CARREGA O BANCO DE DADOS DO INDEXEDDB CASO O AMBIENTE SEJA WEB PURO
async function loadFromFallbackDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('elana-sqlite', 1)
        req.onupgradeneeded = (e: any) => {
            const idb = e.target.result as IDBDatabase
            if (!idb.objectStoreNames.contains('db')) idb.createObjectStore('db')
        }
        req.onsuccess = (e: any) => {
            const idb = e.target.result as IDBDatabase
            if (!idb.objectStoreNames.contains('db')) return resolve(null)
            const tx = idb.transaction('db', 'readonly')
            const getReq = tx.objectStore('db').get('main')
            getReq.onsuccess = () => resolve(getReq.result || null)
            getReq.onerror = reject
        }
        req.onerror = reject
    })
}

let _fallbackDb: any = null
let _fallbackSQL: any = null

// INICIALIZA O BANCO DE DADOS VIA SQL-ASM.JS COM FALLBACK PARA INDEXEDDB
async function getFallbackDb() {
    if (_fallbackDb) return _fallbackDb
    // @ts-ignore
    const initSqlJs = (await import('sql.js/dist/sql-asm.js')).default
    _fallbackSQL = await initSqlJs()
    const savedData = await loadFromFallbackDB()
    _fallbackDb = savedData ? new _fallbackSQL.Database(savedData) : new _fallbackSQL.Database()

    // Inicializa tabelas no fallback web
    _fallbackDb.run(`
        CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local-user',
            title TEXT NOT NULL DEFAULT 'Novo Chat',
            system_prompt TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
            parent_id TEXT,
            role TEXT NOT NULL CHECK(role IN ('system','user','assistant')),
            content TEXT NOT NULL DEFAULT '',
            metadata TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON messages(chat_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
    `)
    return _fallbackDb
}

// ─── ABSTRAÇÃO UNIFICADA DE BANCO DE DADOS (TAURI NATIVO / FALLBACK) ──────────

class DatabaseConnection {
    private nativeDb: Database | null = null
    private initPromise: Promise<Database> | null = null
    private isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__

    // OBTÉM OU INICIALIZA A CONEXÃO NATIVA COM SQLITE ATRAVÉS DO TAURI
    private async getNativeDb(): Promise<Database> {
        if (this.nativeDb) return this.nativeDb

        if (!this.initPromise) {
            this.initPromise = (async () => {
                // Garante que o diretório pai existe antes de tentar carregar o banco
                try {
                    const appData = await appDataDir()
                    await mkdir(appData, { recursive: true })
                } catch (e) {
                    console.warn('Diretório de dados já existe ou foi criado síncronamente:', e)
                }

                const native = await Database.load('sqlite:elana.db')

                // Garante a existência das tabelas estruturadas nativamente no SQLite
                await native.execute(`
                    CREATE TABLE IF NOT EXISTS chats (
                        id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL DEFAULT 'local-user',
                        title TEXT NOT NULL DEFAULT 'Novo Chat',
                        system_prompt TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );
                `)
                await native.execute(`
                    CREATE TABLE IF NOT EXISTS messages (
                        id TEXT PRIMARY KEY,
                        chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
                        parent_id TEXT,
                        role TEXT NOT NULL CHECK(role IN ('system','user','assistant')),
                        content TEXT NOT NULL DEFAULT '',
                        metadata TEXT NOT NULL DEFAULT '{}',
                        created_at TEXT NOT NULL
                    );
                `)
                await native.execute(`
                    CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at ON messages(chat_id, created_at);
                `)
                await native.execute(`
                    CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
                `)

                this.nativeDb = native
                return native
            })()
        }

        return this.initPromise
    }

    // EXECUTA QUERIES DE ESCRITA (INSERT, UPDATE, DELETE) COM TRADUÇÃO AUTOMÁTICA DE DIALECTO
    async execute(sql: string, bindValues: any[] = []): Promise<void> {
        if (this.isTauri) {
            const db = await this.getNativeDb()
            await db.execute(sql, bindValues)
        } else {
            const db = await getFallbackDb()
            // Converte sintaxe de binds do Tauri ($1, $2) para a sintaxe do sql.js (?)
            const convertedSql = sql.replace(/\$\d+/g, '?')
            db.run(convertedSql, bindValues)
            const data = db.export()
            await saveToFallbackDB(data)
        }
    }

    // EXECUTA QUERIES DE LEITURA (SELECT) ADAPTANDO O RETORNO PARA ARRAYS DE OBJETOS JS
    async select<T>(sql: string, bindValues: any[] = []): Promise<T> {
        if (this.isTauri) {
            const db = await this.getNativeDb()
            return await db.select<T>(sql, bindValues)
        } else {
            const db = await getFallbackDb()
            const convertedSql = sql.replace(/\$\d+/g, '?')
            const res = db.exec(convertedSql, bindValues)
            if (!res.length) return [] as any as T

            const columns = res[0].columns
            const values = res[0].values
            return values.map((row: any[]) => {
                const obj: any = {}
                columns.forEach((col: string, i: number) => {
                    obj[col] = row[i]
                })
                return obj
            }) as any as T
        }
    }
}

const db = new DatabaseConnection()

// ─── UTILS ───────────────────────────────────────────────────────────────────

// GERA UM IDENTIFICADOR ÚNICO (UUID V4) PARA OS REGISTROS
function uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

// RETORNA A DATA E HORA ATUAL NO FORMATO ISO 8601
function now() {
    return new Date().toISOString()
}

// CONVERTE UMA LINHA BRUTA DO BANCO PARA O OBJETO TIPADO MESSAGE REALIZANDO PARSING SEGURO DOS METADADOS
function parseMessageRow(row: any): Message {
    const obj = { ...row }
    if (typeof obj.metadata === 'string') {
        try {
            obj.metadata = JSON.parse(obj.metadata)
        } catch {
            obj.metadata = {}
        }
    }
    return obj as Message
}

// ─── IMPLEMENTAÇÃO DO REPOSITÓRIO ─────────────────────────────────────────────

export class SQLiteChatRepository implements IChatRepository {

    // CRIA UM NOVO REGISTRO DE CHAT NO BANCO DE DADOS LOCAL
    async createChat(chat: Omit<Chat, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Chat> {
        const id = chat.id || uuid()
        const ts = now()
        await db.execute(
            `INSERT INTO chats (id, user_id, title, system_prompt, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, chat.user_id || DEFAULT_USER_ID, chat.title, chat.system_prompt ?? null, ts, ts]
        )
        return {
            id,
            user_id: chat.user_id || DEFAULT_USER_ID,
            title: chat.title,
            system_prompt: chat.system_prompt ?? null,
            created_at: ts,
            updated_at: ts
        }
    }

    // BUSCA UM CHAT ESPECÍFICO PELO ID
    async getChatById(id: string): Promise<Chat | null> {
        const rows = await db.select<Chat[]>(`SELECT * FROM chats WHERE id = $1`, [id])
        if (!rows || rows.length === 0) return null
        return rows[0]
    }

    // BUSCA TODOS OS CHATS VINCULADOS A UM ID DE USUÁRIO, ORDENADOS PELOS MAIS RECENTES
    async getChatsByUserId(userId: string): Promise<Chat[]> {
        const rows = await db.select<Chat[]>(`SELECT * FROM chats ORDER BY updated_at DESC`)
        return rows || []
    }

    // ATUALIZA A DATA DE ÚLTIMA MODIFICAÇÃO DE UM CHAT
    async updateChatTimestamp(id: string): Promise<void> {
        await db.execute(`UPDATE chats SET updated_at = $1 WHERE id = $2`, [now(), id])
    }

    // RENOMEIA O TÍTULO DE UM CHAT
    async updateChatTitle(id: string, title: string): Promise<void> {
        await db.execute(`UPDATE chats SET title = $1, updated_at = $2 WHERE id = $3`, [title, now(), id])
    }

    // REMOVE UM CHAT E TODAS AS SUAS MENSAGENS EM CASCATA
    async deleteChat(id: string): Promise<void> {
        await db.execute(`DELETE FROM chats WHERE id = $1`, [id])
    }

    // ADICIONA UMA NOVA MENSAGEM À CONVERSA DO CHAT
    async addMessage(msg: Omit<Message, 'id' | 'created_at'> & { id?: string }): Promise<Message> {
        const id = msg.id || uuid()
        const ts = now()
        await db.execute(
            `INSERT INTO messages (id, chat_id, parent_id, role, content, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, msg.chat_id, msg.parent_id ?? null, msg.role, msg.content, JSON.stringify(msg.metadata ?? {}), ts]
        )
        return {
            id,
            chat_id: msg.chat_id,
            parent_id: msg.parent_id ?? null,
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata ?? {},
            created_at: ts
        }
    }

    // BUSCA UMA MENSAGEM ESPECÍFICA USANDO O SEU ID
    async getMessageById(id: string): Promise<Message | null> {
        const rows = await db.select<any[]>(`SELECT * FROM messages WHERE id = $1`, [id])
        if (!rows || rows.length === 0) return null
        return parseMessageRow(rows[0])
    }

    // ATUALIZA O OBJETO JSON DE METADADOS DA MENSAGEM (EX: STATUS DE TOOLS)
    async updateMessageMetadata(id: string, metadata: any): Promise<void> {
        await db.execute(`UPDATE messages SET metadata = $1 WHERE id = $2`, [JSON.stringify(metadata), id])
    }

    // PERCORRE A ÁRVORE DE MENSAGENS RECURSIVAMENTE PELO PARENT_ID GERANDO A THREAD LINEAR EXATA
    async getMessageBranch(leafMessageId: string): Promise<Message[]> {
        const branch: Message[] = []
        let currentId: string | null = leafMessageId

        while (currentId) {
            const rows = await db.select<any[]>(`SELECT * FROM messages WHERE id = $1`, [currentId])
            if (!rows || rows.length === 0) break
            const msg = parseMessageRow(rows[0])
            branch.unshift(msg)
            currentId = msg.parent_id
        }

        return branch
    }

    // LISTA TODAS AS MENSAGENS DE UM CHAT DE FORMA LINEAR E CRONOLÓGICA (USADO PRIMARIAMENTE COMO FALLBACK)
    async getAllMessagesFromChat(chatId: string): Promise<Message[]> {
        const rows = await db.select<any[]>(`SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`, [chatId])
        if (!rows) return []
        return rows.map(parseMessageRow)
    }

    // DELETA UMA MENSAGEM ESPECÍFICA E TODAS AS RESPOSTAS ORIGINADAS APÓS ELA NO TEMPO (LIMPEZA DE HISTÓRICO A PARTIR DE UM PONTO)
    async deleteMessageAndSubsequent(messageId: string, chatId: string): Promise<void> {
        const msg = await this.getMessageById(messageId)
        if (!msg) return
        await db.execute(`DELETE FROM messages WHERE chat_id = $1 AND created_at >= $2`, [chatId, msg.created_at])
    }
}

export const sqliteChatRepository = new SQLiteChatRepository()
