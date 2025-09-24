use crate::database::DbPool;
use crate::errors::AppResult;
use crate::models::{Product, CreateProductRequest, UpdateProductRequest};
use crate::services::product;
use tauri::State;

#[tauri::command]
pub async fn get_products(db: State<'_, DbPool>, active_only: bool) -> Result<Vec<Product>, String> {
    product::get_products(&db, active_only).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_product_by_id(db: State<'_, DbPool>, id: i64) -> Result<Option<Product>, String> {
    product::get_product_by_id(&db, id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_product(db: State<'_, DbPool>, request: CreateProductRequest) -> Result<Product, String> {
    product::create_product(&db, request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_product(db: State<'_, DbPool>, id: i64, request: UpdateProductRequest) -> Result<Product, String> {
    product::update_product(&db, id, request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_product(db: State<'_, DbPool>, id: i64) -> Result<(), String> {
    product::delete_product(&db, id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_products(db: State<'_, DbPool>, query: String, active_only: bool) -> Result<Vec<Product>, String> {
    product::search_products(&db, &query, active_only).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_products_by_category(db: State<'_, DbPool>, category: String, active_only: bool) -> Result<Vec<Product>, String> {
    product::get_products_by_category(&db, &category, active_only).await.map_err(|e| e.to_string())
}
