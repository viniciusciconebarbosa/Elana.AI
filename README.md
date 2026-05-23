# ELANA AI - Assistente local para seus modelos de LLM


<p align="center">
  <img src="./banner.png" alt="Elana Logo" width="400" />
</p>

<p align="center">
  <strong>Aplicação desktop e mobile (Tauri + React) para usar suas chaves de OpenAI, Gemini ou modelos locais.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2-FFC107?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <a href="https://elana-ai.com"><img src="https://img.shields.io/badge/Website-elana--ai.com-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Website" /></a>
  <img src="https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-E0001B?style=for-the-badge" alt="License" />
</p>

---

## 🇧🇷 Sobre a Elana 

Desenvolvi a Elana para rodar meus modelos de LLM localmente sem depender de serviços caros. É uma aplicaçao desktop e mobile (Tauri + React) que te permite usar suas próprias chaves de OpenAI, Gemini ou modelos locais, com controle total sobre seus dados.

## Porque desenvolvi a elana ? 

O Elana nasceu de uma necessidade pessoal: eu precisava de uma interface local para rodar meus modelos de LLM sem depender de serviços caros. Foi assim que comecei a desenvolvê-la. No fim, percebi que outras pessoas também poderiam se beneficiar com a ferramenta, então decidi torná-la pública.


## Recursos Principais

- **Suas chaves ficam com você:** Criptografadas localmente (AES-GCM 256-bit) - nunca saem da sua máquina
- **Banco híbrido:** SQLite local + opcional Supabase pra sincronizar entre dispositivos  
- **Memória com contexto (RAG):** Qdrant guarda conversas anteriores pra dar respostas mais precisas
- **Extrai conhecimento de arquivos:** Envie PDFs, URLs ou texto pra criar uma base de conhecimento

- **Busca na web integrada:** Usa Tavily pra pesquisar em tempo real quando precisa
- **Interface responsiva:** TailwindCSS com temas claro/escuro, otimizada pra performance
- **Apps nativos:** Compilada em Linux, Android e Windows via Tauri v2

---

## 🛠️ Ferramentas 

| Tecnologia | Finalidade |
|---|---|
| **Tauri v2 (Rust)** | Shell de sistema nativo, operações de arquivo e compilação para plataformas (Desktop e Android) |
| **React 18 & Vite** | Renderização de UI reativa de alto desempenho |
| **TypeScript** | Desenvolvimento com segurança de tipos e verificações rigorosas do compilador |
| **TailwindCSS** | Estilização moderna com utilitários responsivos |
| **Supabase / SQLite** | Armazenamento relacional híbrido e sincronização |
| **Qdrant** | Busca vetorial de alta velocidade para memórias RAG |
| **Web Crypto API** | Hash criptográfico seguro no cliente e criptografia AES-GCM |

---

## 🗺️ Status do Projeto


### Funcionalidades prontas
-  Criptografia local AES-GCM (chaves ficam na sua máquina)
-  Interface de chat com temas claro/escuro  
-  SQLite local + sincronização opcional com Supabase
-  Integração com Tavily pra busca na web
-  Apps nativos pra Linux, Android e Windows


### Em desenvolvimento (v1.2.0)
-  Banco de memória Qdrant (RAG)
-  Upload de arquivos/URLs pra extrair conhecimento

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos 
*   **Node.js** (v18 ou superior)
*   **Rust & Cargo** (para compilações nativas com Tauri)
*   **Android Studio** (opcional, só para builds Android)

### 1. Clone 
```bash
git clone https://github.com/viniciusciconebarbosa/elana.git
cd elana
```

### 2. Configure as variaveis de ambiente
Create a `.env` file in the root directory and populate it with your local development keys (refer to `.env.example` if available):
```env
VITE_ENCRYPTION_KEY=your_secure_32_character_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
# Optional
VITE_TAVILY_API_KEY=your_local_tavily_key
```

### 3. Instalar dependencias.
```bash
npm install
```

### 4. Iniciar servidor de desenvolvimento
*   **Modo Web (Navegador):**
    ```bash
    npm run dev
    ```
*   **App Desktop Nativo (Tauri):**
    ```bash
    npm run tauri dev
    ```
*   **App Android Nativo:**
    ```bash
    npm run tauri android dev
    ```

## ✅ Testes


- **Backend (Rust):** `cargo test`
- **Frontend:** `npm test`
 
## 📄 Licença


CC BY-NC-SA 4.0 - Você pode usar e modificar, mas não comercialmente.

---
<p align="center">
<a href='https://ko-fi.com/Z1D41ZYKUZ' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
</p>

<p align="center">
  Desenvolvido por <a href="https://github.com/viniciusciconebarbosa">Vinícius Cicone Barbosa</a>
</p>
