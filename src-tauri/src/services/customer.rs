use crate::database::DbPool;
use crate::errors::{AppError, AppResult};
use crate::models::{Customer, CreateCustomerRequest, UpdateCustomerRequest};
use chrono::Utc;

pub async fn get_customers(pool: &DbPool, customer_type: Option<String>) -> AppResult<Vec<Customer>> {
    let query = if let Some(ctype) = customer_type {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers WHERE customer_type = ? ORDER BY name"
        )
        .bind(ctype)
    } else {
        sqlx::query_as::<_, Customer>(
            "SELECT * FROM customers ORDER BY name"
        )
    };
    
    let customers = query.fetch_all(pool).await?;
    Ok(customers)
}

pub async fn get_customer_by_id(pool: &DbPool, id: i64) -> AppResult<Option<Customer>> {
    let customer = sqlx::query_as::<_, Customer>(
        "SELECT * FROM customers WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    Ok(customer)
}

pub async fn create_customer(pool: &DbPool, request: CreateCustomerRequest) -> AppResult<Customer> {
    let now = Utc::now();
    
    // Validate customer type
    if !matches!(request.customer_type.as_str(), "customer" | "supplier") {
        return Err(AppError::Validation(
            "Customer type must be 'customer' or 'supplier'".to_string()
        ));
    }
    
    let id = sqlx::query(
        r#"
        INSERT INTO customers (
            name, business_number, address, phone, email, 
            customer_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&request.name)
    .bind(&request.business_number)
    .bind(&request.address)
    .bind(&request.phone)
    .bind(&request.email)
    .bind(&request.customer_type)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?
    .last_insert_rowid();
    
    let customer = get_customer_by_id(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Created customer not found".to_string()))?;
    
    Ok(customer)
}

pub async fn update_customer(pool: &DbPool, id: i64, request: UpdateCustomerRequest) -> AppResult<Customer> {
    let now = Utc::now();
    
    // Validate customer type if provided
    if let Some(ref ctype) = request.customer_type {
        if !matches!(ctype.as_str(), "customer" | "supplier") {
            return Err(AppError::Validation(
                "Customer type must be 'customer' or 'supplier'".to_string()
            ));
        }
    }
    
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
    if request.customer_type.is_some() {
        query_parts.push("customer_type = ?");
    }
    
    if query_parts.is_empty() {
        return Err(AppError::Validation("No fields to update".to_string()));
    }
    
    query_parts.push("updated_at = ?");
    
    let query_str = format!(
        "UPDATE customers SET {} WHERE id = ?",
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
    if let Some(customer_type) = &request.customer_type {
        query = query.bind(customer_type);
    }
    
    query = query.bind(now).bind(id);
    
    let rows_affected = query.execute(pool).await?.rows_affected();
    
    if rows_affected == 0 {
        return Err(AppError::NotFound("Customer not found".to_string()));
    }
    
    let customer = get_customer_by_id(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Updated customer not found".to_string()))?;
    
    Ok(customer)
}

pub async fn delete_customer(pool: &DbPool, id: i64) -> AppResult<()> {
    let rows_affected = sqlx::query("DELETE FROM customers WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?
        .rows_affected();
    
    if rows_affected == 0 {
        return Err(AppError::NotFound("Customer not found".to_string()));
    }
    
    Ok(())
}

pub async fn search_customers(pool: &DbPool, query: &str, customer_type: Option<String>) -> AppResult<Vec<Customer>> {
    let search_query = format!("%{}%", query);
    
    let sql_query = if let Some(ctype) = customer_type {
        sqlx::query_as::<_, Customer>(
            r#"
            SELECT * FROM customers 
            WHERE customer_type = ? 
            AND (name LIKE ? OR business_number LIKE ?)
            ORDER BY name
            "#
        )
        .bind(ctype)
        .bind(&search_query)
        .bind(&search_query)
    } else {
        sqlx::query_as::<_, Customer>(
            r#"
            SELECT * FROM customers 
            WHERE name LIKE ? OR business_number LIKE ?
            ORDER BY name
            "#
        )
        .bind(&search_query)
        .bind(&search_query)
    };
    
    let customers = sql_query.fetch_all(pool).await?;
    Ok(customers)
}