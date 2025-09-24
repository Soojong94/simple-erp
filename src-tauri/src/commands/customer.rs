use crate::database::DbPool;
use crate::errors::AppResult;
use crate::models::{Customer, CreateCustomerRequest, UpdateCustomerRequest};
use crate::services::customer;
use tauri::State;

#[tauri::command]
pub async fn get_customers(db: State<'_, DbPool>, customer_type: Option<String>) -> Result<Vec<Customer>, String> {
    customer::get_customers(&db, customer_type).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_customer_by_id(db: State<'_, DbPool>, id: i64) -> Result<Option<Customer>, String> {
    customer::get_customer_by_id(&db, id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_customer(db: State<'_, DbPool>, request: CreateCustomerRequest) -> Result<Customer, String> {
    customer::create_customer(&db, request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_customer(db: State<'_, DbPool>, id: i64, request: UpdateCustomerRequest) -> Result<Customer, String> {
    customer::update_customer(&db, id, request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_customer(db: State<'_, DbPool>, id: i64) -> Result<(), String> {
    customer::delete_customer(&db, id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_customers(db: State<'_, DbPool>, query: String, customer_type: Option<String>) -> Result<Vec<Customer>, String> {
    customer::search_customers(&db, &query, customer_type).await.map_err(|e| e.to_string())
}
