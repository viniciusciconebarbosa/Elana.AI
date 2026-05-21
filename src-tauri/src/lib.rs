#[tauri::command]
async fn setup_supabase_tables(connection_string: String) -> Result<bool, String> {
    use sqlx::postgres::PgPoolOptions;

    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&connection_string)
        .await
        .map_err(|e| format!("Falha ao conectar no banco: {}", e))?;

    let sql = r#"
        -- Tabela de chats
        CREATE TABLE IF NOT EXISTS chats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          title TEXT NOT NULL,
          system_prompt TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        -- Tabela de mensagens
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          parent_id UUID REFERENCES messages(id) ON DELETE SET NULL,
          role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT now()
        );

        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
        CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
    "#;

    sqlx::query(sql)
        .execute(&pool)
        .await
        .map_err(|e| format!("Falha ao criar tabelas: {}", e))?;

    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .invoke_handler(tauri::generate_handler![setup_supabase_tables])
        .setup(|app| {
            app.handle().plugin(tauri_plugin_opener::init())?;
            app.handle().plugin(tauri_plugin_dialog::init())?;
            app.handle().plugin(tauri_plugin_fs::init())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ─── UTILS & VALIDAÇÕES NATIVAS ──────────────────────────────────────────────

pub fn sanitize_chat_title(title: &str) -> String {
    let trimmed = title.trim();
    if trimmed.chars().count() > 40 {
        let truncated: String = trimmed.chars().take(40).collect();
        format!("{}...", truncated)
    } else {
        trimmed.to_string()
    }
}

pub fn is_valid_uuid_format(uuid: &str) -> bool {
    uuid.len() == 36 && uuid.chars().all(|c| c.is_ascii_hexdigit() || c == '-')
}

pub fn validate_system_prompt(prompt: &str) -> bool {
    let trimmed = prompt.trim();
    !trimmed.is_empty() && trimmed.chars().count() >= 10
}

// ─── TESTES UNITÁRIOS ────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_chat_title() {
        assert_eq!(sanitize_chat_title("  Meu Chat  "), "Meu Chat");
        assert_eq!(
            sanitize_chat_title("Um prompt extremamente longo que com certeza vai passar do limite de quarenta caracteres"),
            "Um prompt extremamente longo que com cer..."
        );
    }

    #[test]
    fn test_is_valid_uuid_format() {
        assert!(is_valid_uuid_format("00000000-0000-0000-0000-000000000000"));
        assert!(!is_valid_uuid_format("uuid-invalido"));
    }

    #[test]
    fn test_validate_system_prompt() {
        assert!(validate_system_prompt("Você é um assistente útil e amigável."));
        assert!(!validate_system_prompt("a"));
        assert!(!validate_system_prompt("   "));
    }
}
