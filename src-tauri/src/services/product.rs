use crate::database::DbPool;
use crate::errors::{AppError, AppResult};
use crate::models::{Product, CreateProductRequest, UpdateProductRequest};
use chrono::Utc;

pub async fn get_products(pool: &DbPool, active_only: bool) -> AppResult<Vec<Product>> {
    let query = if active_only {
        sqlx::query_as::<_, Product>(
            "SELECT * FROM products WHERE is_active = true ORDER BY name"
        )
    } else {
        sqlx::query_as::<_, Product>(
            "SELECT * FROM products ORDER BY name"
        )
    };
    
    let products = query.fetch_all(pool).await?;
    Ok(products)
}

pub async fn get_product_by_id(pool: &DbPool, id: i64) -> AppResult<Option<Product>> {
    let product = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(product)
}

pub async fn create_product(pool: &DbPool, request: CreateProductRequest) -> AppResult<Product> {
    let now = Utc::now();
    
    // Validate unit price
    if request.unit_price < 0.0 {
        return Err(AppError::Validation(
            "Unit price cannot be negative".to_string()
        ));
    }
    
    // Validate tax rate
    if request.tax_rate < 0.0 || request.tax_rate > 1.0 {
        return Err(AppError::Validation(
            "Tax rate must be between 0.0 and 1.0".to_string()
        ));
    }
    
    // Check for duplicate product code if provided
    if let Some(ref code) = request.code {
        let existing = sqlx::query("SELECT id FROM products WHERE code = ?")
            .bind(code)
            .fetch_optional(pool)
            .await?;
        
        if existing.is_some() {
            return Err(AppError::Validation(
                "Product code already exists".to_string()
            ));
        }
    }
    
    let id = sqlx::query(
        r#"
        INSERT INTO products (
            name, code, description, unit_price, unit, 
            tax_rate, category, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, true, ?, ?)
        "#
    )
    .bind(&request.name)
    .bind(&request.code)
    .bind(&request.description)
    .bind(request.unit_price)
    .bind(&request.unit)
    .bind(request.tax_rate)
    .bind(&request.category)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?
    .last_insert_rowid();
    
    let product = get_product_by_id(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Created product not found".to_string()))?;
    
    Ok(product)
}

pub async fn update_product(pool: &DbPool, id: i64, request: UpdateProductRequest) -> AppResult<Product> {
    let now = Utc::now();
    
    // Validate unit price if provided
    if let Some(price) = request.unit_price {
        if price < 0.0 {
            return Err(AppError::Validation(
                "Unit price cannot be negative".to_string()
            ));
        }
    }
    
    // Validate tax rate if provided
    if let Some(tax_rate) = request.tax_rate {
        if tax_rate < 0.0 || tax_rate > 1.0 {
            return Err(AppError::Validation(
                "Tax rate must be between 0.0 and 1.0".to_string()
            ));
        }
    }
    
    // Check for duplicate product code if provided and different from current
    if let Some(ref code) = request.code {
        let existing = sqlx::query("SELECT id FROM products WHERE code = ? AND id != ?")
            .bind(code)
            .bind(id)
            .fetch_optional(pool)
            .await?;
        
        if existing.is_some() {
            return Err(AppError::Validation(
                "Product code already exists".to_string()
            ));
        }
    }
    
    // Build dynamic update query
    let mut query_parts = Vec::new();
    
    if request.name.is_some() {
        query_parts.push("name = ?");
    }
    if request.code.is_some() {
        query_parts.push("code = ?");
    }
    if request.description.is_some() {
        query_parts.push("description = ?");
    }
    if request.unit_price.is_some() {
        query_parts.push("unit_price = ?");
    }
    if request.unit.is_some() {
        query_parts.push("unit = ?");
    }
    if request.tax_rate.is_some() {
        query_parts.push("tax_rate = ?");
    }
    if request.category.is_some() {
        query_parts.push("category = ?");
    }
    if request.is_active.is_some() {
        query_parts.push("is_active = ?");
    }
    
    if query_parts.is_empty() {
        return Err(AppError::Validation("No fields to update".to_string()));
    }
    
    query_parts.push("updated_at = ?");
    
    let query_str = format!(
        "UPDATE products SET {} WHERE id = ?",
        query_parts.join(", ")
    );
    
    let mut query = sqlx::query(&query_str);
    
    // Add parameters in the same order as query_parts
    if let Some(name) = &request.name {
        query = query.bind(name);
    }
    if let Some(code) = &request.code {
        query = query.bind(code);
    }
    if let Some(description) = &request.description {
        query = query.bind(description);
    }
    if let Some(unit_price) = request.unit_price {
        query = query.bind(unit_price);
    }
    if let Some(unit) = &request.unit {
        query = query.bind(unit);
    }
    if let Some(tax_rate) = request.tax_rate {
        query = query.bind(tax_rate);
    }
    if let Some(category) = &request.category {
        query = query.bind(category);
    }
    if let Some(is_active) = request.is_active {
        query = query.bind(is_active);
    }
    
    query = query.bind(now).bind(id);
    
    let rows_affected = query.execute(pool).await?.rows_affected();
    
    if rows_affected == 0 {
        return Err(AppError::NotFound("Product not found".to_string()));
    }
    
    let product = get_product_by_id(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Updated product not found".to_string()))?;
    
    Ok(product)
}

pub async fn delete_product(pool: &DbPool, id: i64) -> AppResult<()> {
    // Check if product is used in any transactions
    let usage_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM transaction_items WHERE product_id = ?"
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    
    if usage_count.0 > 0 {
        return Err(AppError::Business(
            "Cannot delete product that is used in transactions. Consider deactivating instead.".to_string()
        ));
    }
    
    let rows_affected = sqlx::query("DELETE FROM products WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?
        .rows_affected();
    
    if rows_affected == 0 {
        return Err(AppError::NotFound("Product not found".to_string()));
    }
    
    Ok(())
}

pub async fn search_products(pool: &DbPool, query: &str, active_only: bool) -> AppResult<Vec<Product>> {
    let search_query = format!("%{}%", query);
    
    let sql_query = if active_only {
        sqlx::query_as::<_, Product>(
            r#"
            SELECT * FROM products 
            WHERE is_active = true 
            AND (name LIKE ? OR code LIKE ? OR description LIKE ? OR category LIKE ?)
            ORDER BY name
            "#
        )
        .bind(&search_query)
        .bind(&search_query)
        .bind(&search_query)
        .bind(&search_query)
    } else {
        sqlx::query_as::<_, Product>(
            r#"
            SELECT * FROM products 
            WHERE name LIKE ? OR code LIKE ? OR description LIKE ? OR category LIKE ?
            ORDER BY name
            "#
        )
        .bind(&search_query)
        .bind(&search_query)
        .bind(&search_query)
        .bind(&search_query)
    };
    
    let products = sql_query.fetch_all(pool).await?;
    Ok(products)
}

pub async fn get_products_by_category(pool: &DbPool, category: &str, active_only: bool) -> AppResult<Vec<Product>> {
    let query = if active_only {
        sqlx::query_as::<_, Product>(
            "SELECT * FROM products WHERE category = ? AND is_active = true ORDER BY name"
        )
        .bind(category)
    } else {
        sqlx::query_as::<_, Product>(
            "SELECT * FROM products WHERE category = ? ORDER BY name"
        )
        .bind(category)
    };
    
    let products = query.fetch_all(pool).await?;
    Ok(products)
}
