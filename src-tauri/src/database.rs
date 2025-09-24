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
    
    // Read and execute the migration file
    let migration_sql = include_str!("../migrations/001_initial.sql");
    
    // Split the migration into individual statements
    let statements: Vec<&str> = migration_sql
        .split(';')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();
    
    for statement in statements {
        if !statement.is_empty() {
            println!("Executing: {}", &statement[..50.min(statement.len())]);
            sqlx::query(statement).execute(pool).await?;
        }
    }
    
    println!("Database migrations completed successfully!");
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
