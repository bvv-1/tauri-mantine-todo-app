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
    section_id: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Section {
    id: i64,
    name: String,
}

struct DbConnection(Mutex<Connection>);

#[tauri::command]
fn get_sections(db: State<DbConnection>) -> Result<Vec<Section>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name FROM sections ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let sections = stmt
        .query_map([], |row| {
            Ok(Section {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(sections)
}

#[tauri::command]
fn get_todos(db: State<DbConnection>) -> Result<Vec<Todo>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, title, description, priority, due_date, completed, section_id FROM todos ORDER BY created_at DESC")
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
                section_id: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(todos)
}

#[tauri::command]
fn create_section(db: State<DbConnection>, name: String) -> Result<Section, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO sections (name, updated_at) VALUES (?1, CURRENT_TIMESTAMP)",
        params![name],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    Ok(Section {
        id,
        name,
    })
}

#[tauri::command]
fn add_todo(
    db: State<DbConnection>,
    title: String,
    description: Option<String>,
    priority: String,
    due_date: Option<String>,
    section_id: i64,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO todos (title, description, priority, due_date, section_id, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)",
        params![title, description, priority, due_date, section_id],
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
        "INSERT INTO archives (id, title, description, priority, due_date, completed, created_at, updated_at, section_id) 
         SELECT id, title, description, priority, due_date, completed, created_at, updated_at, section_id FROM todos WHERE id = ?1",
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
    section_id: i64,
) -> Result<(), String> {
    println!("Updating todo. due_date: {:?}", due_date);
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE todos SET title = ?1, description = ?2, priority = ?3, due_date = ?4, section_id = ?5, updated_at = CURRENT_TIMESTAMP WHERE id = ?6",
        params![title, description, priority, due_date, section_id, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn initialize_database() -> Result<Connection, Box<dyn std::error::Error>> {
    let mut conn = Connection::open("todo.db")?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "INSERT OR IGNORE INTO sections (name) VALUES ('(セクションなし)')",
        [],
    )?;

    let unsectioned_id: i64 = conn.query_row(
        "SELECT id FROM sections WHERE name = '(セクションなし)'",
        [],
        |row| row.get(0),
    )?;

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

    let tx = conn.transaction()?;

    // section_idカラムの存在とNULL許容性を確認
    let column_exists = {
        let mut stmt = tx.prepare("PRAGMA table_info(todos)")?;
        let columns: Vec<Result<String, _>> = stmt.query_map([], |row| row.get(1))?.collect();
        columns.iter().any(|c| c.as_deref() == Ok("section_id"))
    };

    if !column_exists {
        tx.execute(
            &format!(
                "ALTER TABLE todos ADD COLUMN section_id INTEGER NOT NULL DEFAULT {} REFERENCES sections(id)",
                unsectioned_id
            ),
            [],
        )?;
    } else {
        let is_nullable: bool = tx.query_row(
            "SELECT `notnull` FROM pragma_table_info('todos') WHERE name = 'section_id'",
            [],
            |row| Ok(row.get::<_, i64>(0)? == 0),
        )?;

        if is_nullable {
            tx.execute("UPDATE todos SET section_id = ?1 WHERE section_id IS NULL", params![unsectioned_id])?;

            tx.execute(
                "CREATE TABLE todos_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    priority TEXT DEFAULT 'medium',
                    due_date TEXT,
                    completed INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    section_id INTEGER NOT NULL REFERENCES sections(id)
                )",
                [],
            )?;
            tx.execute("INSERT INTO todos_new(id, title, description, priority, due_date, completed, created_at, updated_at, section_id) SELECT id, title, description, priority, due_date, completed, created_at, updated_at, section_id FROM todos", [])?;
            tx.execute("DROP TABLE todos", [])?;
            tx.execute("ALTER TABLE todos_new RENAME TO todos", [])?;
        }
    }

    // archivesテーブルのマイグレーション
    let column_exists = {
        let mut stmt = tx.prepare("PRAGMA table_info(archives)")?;
        let columns: Vec<Result<String, _>> = stmt.query_map([], |row| row.get(1))?.collect();
        columns.iter().any(|c| c.as_deref() == Ok("section_id"))
    };

    if !column_exists {
        tx.execute(
            "ALTER TABLE archives ADD COLUMN section_id INTEGER",
            [],
        )?;
    }
    
    tx.execute("UPDATE archives SET section_id = ?1 WHERE section_id IS NULL", params![unsectioned_id])?;

    tx.commit()?;

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
            update_todo,
            get_sections,
            create_section
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
