use crate::database::DbPool;
use crate::errors::AppResult;
use crate::models::{TransactionWithItems, CreateTransactionRequest, UpdateTransactionRequest};
use crate::services::transaction::{self, TransactionSummary};
use tauri::State;
use chrono::{DateTime, Utc};

#[tauri::command]
pub async fn get_transactions(
    db: State<'_, DbPool>, 
    transaction_type: Option<String>,
    customer_id: Option<i64>,
    limit: Option<i32>,
    offset: Option<i32>
) -> Result<Vec<TransactionWithItems>, String> {
    transaction::get_transactions(&db, transaction_type, customer_id, limit, offset)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_transaction_by_id(db: State<'_, DbPool>, id: i64) -> Result<Option<TransactionWithItems>, String> {
    transaction::get_transaction_by_id(&db, id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_transaction(db: State<'_, DbPool>, request: CreateTransactionRequest) -> Result<TransactionWithItems, String> {
    transaction::create_transaction(&db, request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_transaction(db: State<'_, DbPool>, id: i64, request: UpdateTransactionRequest) -> Result<TransactionWithItems, String> {
    transaction::update_transaction(&db, id, request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_transaction(db: State<'_, DbPool>, id: i64) -> Result<(), String> {
    transaction::delete_transaction(&db, id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn confirm_transaction(db: State<'_, DbPool>, id: i64) -> Result<TransactionWithItems, String> {
    transaction::confirm_transaction(&db, id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cancel_transaction(db: State<'_, DbPool>, id: i64) -> Result<TransactionWithItems, String> {
    transaction::cancel_transaction(&db, id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_transaction_summary(
    db: State<'_, DbPool>, 
    transaction_type: Option<String>,
    start_date: Option<DateTime<Utc>>,
    end_date: Option<DateTime<Utc>>
) -> Result<TransactionSummary, String> {
    transaction::get_transaction_summary(&db, transaction_type, start_date, end_date)
        .await
        .map_err(|e| e.to_string())
}
