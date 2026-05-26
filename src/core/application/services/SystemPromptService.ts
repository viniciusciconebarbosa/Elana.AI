const STORAGE_KEY = "elana_custom_system_prompt";

export const SystemPromptService = {
    /**
     * Obtém o prompt customizado salvo pelo usuário no localStorage.
     * Retorna uma string vazia se não houver um prompt personalizado salvo.
     */
    getCustomPrompt(): string {
        if (typeof window !== "undefined") {
            return localStorage.getItem(STORAGE_KEY) || "";
        }
        return "";
    },

    /**
     * Salva o prompt customizado do usuário no localStorage.
     */
    saveCustomPrompt(prompt: string): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, prompt.trim());
        }
    },

    /**
     * Remove o prompt customizado do usuário, fazendo a aplicação restaurar o padrão.
     */
    clearCustomPrompt(): void {
        if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
        }
    },

    /**
     * Retorna o prompt base padrão da Elana (caso o usuário queira restaurar ou ver como exemplo).
     */
    getDefaultBasePrompt(): string {
        return `Você é a Elana, uma assistente pessoal inteligente...`;
    }
};
