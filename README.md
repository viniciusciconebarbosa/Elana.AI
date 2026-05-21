# ELANA AI — Privacy-First Desktop & Mobile Assistant

<p align="center">
  <img src="./banner.png" alt="Elana Logo" width="400" />
</p>

<p align="center">
  <strong>A premium, ultra-lightweight, and privacy-first AI Assistant powered by Tauri, React, and Supabase.</strong>
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

## 🇧🇷 Sobre a Elana (Portuguese Summary)

O **Elana AI** (ou simplesmente **Elana**) é um assistente de Inteligência Artificial multiplataforma (Desktop & Android) projetado com foco absoluto em **privacidade do usuário, segurança de dados e alta performance**. Ele permite que você conecte seus próprios modelos de linguagem (OpenAI, Gemini, LLMs locais) e gerencie seu próprio banco de dados relacional e vetorial de forma totalmente isolada e segura.

## 🇬🇧 Key Features (Recursos Principais)

*   **🔒 Strict Client-Side Encryption:** All personal API keys and database credentials are encrypted directly in the client using industry-standard **AES-GCM (256-bit)** derived via **PBKDF2** using custom environment salt. Your secrets never leave your local machine or your private database.
*   **⚡ Hybrid Database Persistence:** Supports seamless message branching and relational persistence using local high-performance engines or securely synchronized remote **Supabase** nodes.
*   **🧠 Qdrant Vector Memories (RAG):** Dynamic, contextual long-term memory powered by **Qdrant DB** and **Mistral Embeddings**, allowing your assistant to remember previous conversations and facts organically.
*   **🔮 The Brain Knowledge Base:** A fast, native ingestion pipeline allowing you to upload PDFs, URLs, and plain text to extract knowledge facts and inject them directly into your context trees.
*   **🌐 Real-Time Search Integration:** Full Tavily API integration enabling the AI to browse the web, with securely managed credential settings.
*   **🎨 Premium UI/UX:** Stunning, high-performance responsive interface designed with **TailwindCSS**, optimized custom layout scrolling, GPU-accelerated layers, and clean, beautiful typography.
*   **📱 Native Cross-Platform:** Built on top of **Tauri v2** and **Rust**, offering native performance for Windows, macOS, Linux, and Android with a microscopic memory footprint.

---

## 🛠️ Technology Stack (Stack Tecnológica)

| Technology | Purpose |
|---|---|
| **Tauri v2 (Rust)** | Native system shell, file operations, and platform compilation (Desktop & Android) |
| **React 18 & Vite** | High-performance reactive UI rendering |
| **TypeScript** | Type-safe development with strict compiler checks |
| **TailwindCSS** | Modern, responsive utilities styling |
| **Supabase / SQLite** | Hybrid relational storage and sync |
| **Qdrant** | High-speed vector search for RAG memories |
| **Web Crypto API** | Secure client-side cryptographic hashing & AES-GCM encryption |

---

## 🚀 Getting Started (Como Rodar o Projeto)

### Prerequisites (Pré-requisitos)
*   **Node.js** (v18 or higher)
*   **Rust & Cargo** (for Tauri native compilations)
*   **Android Studio** (optional, only for Android builds)

### 1. Clone the Repository
```bash
git clone https://github.com/viniciusciconebarbosa/elana.git
cd elana
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and populate it with your local development keys (refer to `.env.example` if available):
```env
VITE_ENCRYPTION_KEY=your_secure_32_character_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
# Optional
VITE_TAVILY_API_KEY=your_local_tavily_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
*   **Run Web View (Browser Mode):**
    ```bash
    npm run dev
    ```
*   **Run Tauri Native Desktop App:**
    ```bash
    npm run tauri dev
    ```
*   **Run Tauri Native Android App:**
    ```bash
    npm run tauri android dev
    ```

### 5. Run Unit Tests (Rodar Testes Unitários)
The project includes a robust test suite covering both native Rust system boundaries and frontend utility logic.

*   **Backend Native Tests (Rust):**
    Validate system boundaries, UUID formats, and title formatting rules:
    ```bash
    cargo test
    ```

*   **Frontend Utility Tests (Vite/Jest/Vitest):**
    Validate Tailwind CSS merging, message timestamps, and preview text truncation:
    ```bash
    npm test
    ```

---

## 🔒 Security Architecture (Arquitetura de Segurança)

The project stands out by adhering to advanced secure software engineering practices:
1.  **CWE-321 Compliant:** No hardcoded cryptographic keys exist in the codebase. The application explicitly fails with a descriptive error at startup if the `VITE_ENCRYPTION_KEY` is missing in the environment.
2.  **Environment Isolation:** Sensitive directories such as Android keystores (`/keys/`), VS Code settings, packages, and local environment files (`.env`) are strictly locked out of the Git tree via a secure `.gitignore` file.
3.  **Encrypted Local Contexts:** Browser memory buffers and settings contexts encrypt local payloads before storage, ensuring local storage attacks cannot harvest raw API keys.

---

## 📄 License (Licença)

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** License.

*   **Attribution (BY):** You must give appropriate credit to the original author (**Vinícius Cicone Barbosa**).
*   **NonCommercial (NC):** You **MAY NOT** use this software or its codebase for any commercial purposes.
*   **ShareAlike (SA):** Any derivative works must be distributed under the same license.

---
<p align="center">
<a href='https://ko-fi.com/Z1D41ZYKUZ' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
</p>

<p align="center">
  Made with 💻 by <a href="https://github.com/viniciusciconebarbosa">Vinícius Cicone Barbosa</a>
  
</p>
