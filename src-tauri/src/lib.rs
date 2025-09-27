use chrono::{DateTime, FixedOffset};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Todo {
    id: i64,
    title: String,
    description: Option<String>,
    priority: String,
    due_date: Option<String>,
    completed: bool,
}

struct DbConnection(Mutex<Connection>);

fn format_due_date_to_jst(due_date: Option<String>) -> Result<Option<String>, String> {
    match due_date {
        Some(date_str) => {
            let parsed_date = DateTime::parse_from_rfc3339(&date_str).map_err(|e| e.to_string())?;
            let jst_offset = FixedOffset::east_opt(9 * 3600).unwrap();
            let jst_date = parsed_date.with_timezone(&jst_offset);
            Ok(Some(jst_date.to_rfc3339()))
        }
        None => Ok(None),
    }
}

#[tauri::command]
fn get_todos(db: State<DbConnection>) -> Result<Vec<Todo>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, description, priority, due_date, completed FROM todos ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let todos = stmt
        .query_map([], |row| {
            Ok(Todo {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                priority: row.get(3)?,
                due_date: row.get(4)?,
                completed: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(todos)
}

#[tauri::command]
fn add_todo(
    db: State<DbConnection>,
    title: String,
    description: Option<String>,
    priority: String,
    due_date: Option<String>,
) -> Result<(), String> {
    let formatted_due_date = format_due_date_to_jst(due_date)?;
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO todos (title, description, priority, due_date, updated_at) VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)",
        params![title, description, priority, formatted_due_date],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn toggle_todo_completed(db: State<DbConnection>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE todos SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn archive_todo(db: State<DbConnection>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO archives (id, title, description, priority, due_date, completed, created_at, updated_at) 
         SELECT id, title, description, priority, due_date, completed, created_at, updated_at FROM todos WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM todos WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn update_todo(
    db: State<DbConnection>,
    id: i64,
    title: String,
    description: Option<String>,
    priority: String,
    due_date: Option<String>,
) -> Result<(), String> {
    let formatted_due_date = format_due_date_to_jst(due_date)?;
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE todos SET title = ?1, description = ?2, priority = ?3, due_date = ?4, updated_at = CURRENT_TIMESTAMP WHERE id = ?5",
        params![title, description, priority, formatted_due_date, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn initialize_database() -> Result<Connection, Box<dyn std::error::Error>> {
    let conn = Connection::open("todo.db")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT DEFAULT 'medium',
            due_date TEXT,
            completed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS archives (
            id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT,
            due_date TEXT,
            completed INTEGER,
            created_at TEXT,
            updated_at TEXT,
            archived_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    Ok(conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = initialize_database().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DbConnection(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            get_todos,
            add_todo,
            toggle_todo_completed,
            archive_todo,
            update_todo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn setup_in_memory_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        initialize_database_for_test(&conn);
        conn
    }

    fn initialize_database_for_test(conn: &Connection) {
        conn.execute(
            "CREATE TABLE IF NOT EXISTS todos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                priority TEXT DEFAULT 'medium',
                due_date TEXT,
                completed INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        ).unwrap();
    }

    #[test]
    fn test_format_due_date_to_jst() {
        // Test with a valid date string
        let rfc3339_string = "2023-10-27T10:00:00Z".to_string();
        let formatted = format_due_date_to_jst(Some(rfc3339_string)).unwrap();
        assert!(formatted.is_some());
        // 2023-10-27T19:00:00+09:00
        assert!(formatted.unwrap().contains("+09:00"));

        // Test with None
        let formatted_none = format_due_date_to_jst(None).unwrap();
        assert!(formatted_none.is_none());
    }

    #[test]
    fn test_add_todo_with_due_date() {
        let conn = setup_in_memory_db();

        let title = "Test Todo".to_string();
        let description = Some("Test Description".to_string());
        let priority = "high".to_string();
        let due_date_str = Utc::now().to_rfc3339();
        let due_date = Some(due_date_str.clone());

        let formatted_due_date = format_due_date_to_jst(due_date).unwrap();

        conn.execute(
            "INSERT INTO todos (title, description, priority, due_date) VALUES (?1, ?2, ?3, ?4)",
            params![title, description, priority, formatted_due_date],
        ).unwrap();

        let mut stmt = conn.prepare("SELECT due_date FROM todos WHERE id = 1").unwrap();
        let retrieved_due_date: Option<String> = stmt.query_row([], |row| row.get(0)).unwrap();

        assert!(retrieved_due_date.is_some());
        // Check if it's a valid RFC3339 string and in JST
        let retrieved_str = retrieved_due_date.unwrap();
        assert!(DateTime::parse_from_rfc3339(&retrieved_str).is_ok());
        assert!(retrieved_str.contains("+09:00"));
    }

    #[test]
    fn test_add_todo_without_due_date() {
        let conn = setup_in_memory_db();

        let title = "Test Todo".to_string();
        let description = Some("Test Description".to_string());
        let priority = "high".to_string();
        let due_date: Option<String> = None;

        conn.execute(
            "INSERT INTO todos (title, description, priority, due_date) VALUES (?1, ?2, ?3, ?4)",
            params![title, description, priority, due_date],
        ).unwrap();

        let mut stmt = conn.prepare("SELECT due_date FROM todos WHERE id = 1").unwrap();
        let retrieved_due_date: Option<String> = stmt.query_row([], |row| row.get(0)).unwrap();

        assert!(retrieved_due_date.is_none());
    }
}
