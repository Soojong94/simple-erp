use sqlx::{Pool, Sqlite, SqlitePool};
use std::path::PathBuf;
use tauri::AppHandle;
use anyhow::Result;

pub type DbPool = Pool<Sqlite>;

pub async fn init_db(app_handle: &AppHandle) -> Result<DbPool> {
    // 개발 중에는 프로젝트 루트의 data 폴더 사용
    let app_dir = app_handle
        .path_resolver()
        .resource_dir()
        .map(|p| p.parent().unwrap().to_path_buf())
        .unwrap_or_else(|| std::env::current_dir().unwrap())
        .join("data");
    
    // Ensure the data directory exists
    tokio::fs::create_dir_all(&app_dir).await?;
    
    let db_path = app_dir.join("simple_erp.db");
    let db_url = format!("sqlite:{}", db_path.display());
    
    println!("Connecting to database at: {}", db_url);
    
    // SQLite 연결 옵션 추가
    let pool = SqlitePool::connect_with(
        sqlx::sqlite::SqliteConnectOptions::new()
            .filename(&db_path)
            .create_if_missing(true)
    ).await?;
    
    // Run migrations
    run_migrations(&pool).await?;
    
    Ok(pool)
}

async fn run_migrations(pool: &DbPool) -> Result<()> {
    println!("Running database migrations...");

    // Create migrations tracking table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    ).execute(pool).await?;

    // Define all migration files in order
    let migrations = vec![
        ("001_initial.sql", include_str!("../migrations/001_initial.sql")),
        ("002_add_payment_fields.sql", include_str!("../migrations/002_add_payment_fields.sql")),
        ("003_add_current_balance.sql", include_str!("../migrations/003_add_current_balance.sql")),
        ("004_add_payment_types.sql", include_str!("../migrations/004_add_payment_types.sql")),
        ("005_add_inventory_tables.sql", include_str!("../migrations/005_add_inventory_tables.sql")),
        ("006_add_missing_columns.sql", include_str!("../migrations/006_add_missing_columns.sql")),
    ];

    for (name, migration_sql) in migrations {
        // Check if migration already applied
        let applied: Option<(i64,)> = sqlx::query_as(
            "SELECT id FROM _migrations WHERE name = ?"
        )
        .bind(name)
        .fetch_optional(pool)
        .await?;

        if applied.is_some() {
            println!("Migration {} already applied, skipping", name);
            continue;
        }

        println!("Applying migration: {}", name);

        // Split the migration into individual statements
        let statements: Vec<&str> = migration_sql
            .split(';')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty() && !s.starts_with("--"))
            .collect();

        for statement in statements {
            if !statement.is_empty() {
                println!("  Executing: {}", &statement[..50.min(statement.len())]);
                sqlx::query(statement).execute(pool).await?;
            }
        }

        // Record migration as applied
        sqlx::query("INSERT INTO _migrations (name) VALUES (?)")
            .bind(name)
            .execute(pool)
            .await?;

        println!("Migration {} completed", name);
    }

    println!("All database migrations completed successfully!");
    Ok(())
}

// Helper function to get database path for external tools
pub fn get_db_path(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path_resolver()
        .resource_dir()
        .map(|p| p.parent().unwrap().to_path_buf())
        .unwrap_or_else(|| std::env::current_dir().unwrap())
        .join("data");
    app_dir.join("simple_erp.db")
}
