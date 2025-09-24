use crate::database::DbPool;
use crate::errors::{AppError, AppResult};
use crate::models::{Company, CreateCompanyRequest, UpdateCompanyRequest};
use chrono::Utc;
use sqlx::Row;

pub async fn get_company(pool: &DbPool) -> AppResult<Option<Company>> {
    let company = sqlx::query_as::<_, Company>(
        "SELECT * FROM companies ORDER BY created_at DESC LIMIT 1"
    )
    .fetch_optional(pool)
    .await?;
    
    Ok(company)
}

pub async fn create_company(pool: &DbPool, request: CreateCompanyRequest) -> AppResult<Company> {
    let now = Utc::now();
    
    let id = sqlx::query(
        r#"
        INSERT INTO companies (
            name, business_number, address, phone, email, 
            representative, business_type, business_category,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&request.name)
    .bind(&request.business_number)
    .bind(&request.address)
    .bind(&request.phone)
    .bind(&request.email)
    .bind(&request.representative)
    .bind(&request.business_type)
    .bind(&request.business_category)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?
    .last_insert_rowid();
    
    let company = get_company_by_id(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Created company not found".to_string()))?;
    
    Ok(company)
}

pub async fn update_company(pool: &DbPool, id: i64, request: UpdateCompanyRequest) -> AppResult<Company> {
    let now = Utc::now();
    
    // Build dynamic update query
    let mut query_parts = Vec::new();
    
    if request.name.is_some() {
        query_parts.push("name = ?");
    }
    if request.business_number.is_some() {
        query_parts.push("business_number = ?");
    }
    if request.address.is_some() {
        query_parts.push("address = ?");
    }
    if request.phone.is_some() {
        query_parts.push("phone = ?");
    }
    if request.email.is_some() {
        query_parts.push("email = ?");
    }
    if request.representative.is_some() {
        query_parts.push("representative = ?");
    }
    if request.business_type.is_some() {
        query_parts.push("business_type = ?");
    }
    if request.business_category.is_some() {
        query_parts.push("business_category = ?");
    }
    
    if query_parts.is_empty() {
        return Err(AppError::Validation("No fields to update".to_string()));
    }
    
    query_parts.push("updated_at = ?");
    
    let query_str = format!(
        "UPDATE companies SET {} WHERE id = ?",
        query_parts.join(", ")
    );
    
    let mut query = sqlx::query(&query_str);
    
    // Add parameters in the same order as query_parts
    if let Some(name) = &request.name {
        query = query.bind(name);
    }
    if let Some(business_number) = &request.business_number {
        query = query.bind(business_number);
    }
    if let Some(address) = &request.address {
        query = query.bind(address);
    }
    if let Some(phone) = &request.phone {
        query = query.bind(phone);
    }
    if let Some(email) = &request.email {
        query = query.bind(email);
    }
    if let Some(representative) = &request.representative {
        query = query.bind(representative);
    }
    if let Some(business_type) = &request.business_type {
        query = query.bind(business_type);
    }
    if let Some(business_category) = &request.business_category {
        query = query.bind(business_category);
    }
    
    query = query.bind(now).bind(id);
    
    let rows_affected = query.execute(pool).await?.rows_affected();
    
    if rows_affected == 0 {
        return Err(AppError::NotFound("Company not found".to_string()));
    }
    
    let company = get_company_by_id(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Updated company not found".to_string()))?;
    
    Ok(company)
}

async fn get_company_by_id(pool: &DbPool, id: i64) -> AppResult<Option<Company>> {
    let company = sqlx::query_as::<_, Company>(
        "SELECT * FROM companies WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(company)
}
