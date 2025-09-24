use crate::database::DbPool;
use crate::errors::AppResult;
use crate::models::{Company, CreateCompanyRequest, UpdateCompanyRequest};
use crate::services::company;
use tauri::State;

#[tauri::command]
pub async fn get_company(db: State<'_, DbPool>) -> Result<Option<Company>, String> {
    company::get_company(&db).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_company(db: State<'_, DbPool>, request: CreateCompanyRequest) -> Result<Company, String> {
    company::create_company(&db, request).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_company(db: State<'_, DbPool>, id: i64, request: UpdateCompanyRequest) -> Result<Company, String> {
    company::update_company(&db, id, request).await.map_err(|e| e.to_string())
}
