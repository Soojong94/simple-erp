use crate::database::DbPool;
use crate::errors::{AppError, AppResult};
use crate::models::{
    Transaction, TransactionItem, TransactionWithItems, TransactionItemWithProduct,
    CreateTransactionRequest, CreateTransactionItemRequest, UpdateTransactionRequest,
    Customer, Product
};
use chrono::Utc;
use sqlx::Row;

pub async fn get_transactions(
    pool: &DbPool, 
    transaction_type: Option<String>,
    customer_id: Option<i64>,
    limit: Option<i32>,
    offset: Option<i32>
) -> AppResult<Vec<TransactionWithItems>> {
    let mut where_conditions = Vec::new();
    let mut params: Vec<Box<dyn sqlx::Encode<'_, sqlx::Sqlite> + Send>> = Vec::new();
    
    if let Some(ttype) = transaction_type {
        where_conditions.push("t.transaction_type = ?");
        params.push(Box::new(ttype));
    }
    
    if let Some(cid) = customer_id {
        where_conditions.push("t.customer_id = ?");
        params.push(Box::new(cid));
    }
    
    let where_clause = if where_conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", where_conditions.join(" AND "))
    };
    
    let limit_clause = match (limit, offset) {
        (Some(l), Some(o)) => format!("LIMIT {} OFFSET {}", l, o),
        (Some(l), None) => format!("LIMIT {}", l),
        _ => String::new(),
    };
    
    let query = format!(
        r#"
        SELECT t.* FROM transactions t
        {}
        ORDER BY t.transaction_date DESC, t.created_at DESC
        {}
        "#,
        where_clause, limit_clause
    );
    
    let mut query_builder = sqlx::query_as::<_, Transaction>(&query);
    
    // Add parameters
    if let Some(ttype) = transaction_type.as_ref() {
        query_builder = query_builder.bind(ttype);
    }
    if let Some(cid) = customer_id {
        query_builder = query_builder.bind(cid);
    }
    
    let transactions = query_builder.fetch_all(pool).await?;
    
    let mut result = Vec::new();
    for transaction in transactions {
        let transaction_with_items = get_transaction_with_items(pool, transaction.id).await?;
        if let Some(twi) = transaction_with_items {
            result.push(twi);
        }
    }
    
    Ok(result)
}

pub async fn get_transaction_by_id(pool: &DbPool, id: i64) -> AppResult<Option<TransactionWithItems>> {
    get_transaction_with_items(pool, id).await
}

async fn get_transaction_with_items(pool: &DbPool, id: i64) -> AppResult<Option<TransactionWithItems>> {
    // Get transaction
    let transaction = sqlx::query_as::<_, Transaction>(
        "SELECT * FROM transactions WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    
    let transaction = match transaction {
        Some(t) => t,
        None => return Ok(None),
    };
    
    // Get customer
    let customer = sqlx::query_as::<_, Customer>(
        "SELECT * FROM customers WHERE id = ?"
    )
    .bind(transaction.customer_id)
    .fetch_one(pool)
    .await?;
    
    // Get transaction items with products
    let items = sqlx::query(
        r#"
        SELECT 
            ti.id, ti.transaction_id, ti.product_id, ti.quantity, 
            ti.unit_price, ti.tax_rate, ti.subtotal, ti.tax_amount, ti.total_amount,
            p.id as p_id, p.name as p_name, p.code as p_code, p.description as p_description,
            p.unit_price as p_unit_price, p.unit as p_unit, p.tax_rate as p_tax_rate,
            p.category as p_category, p.is_active as p_is_active, 
            p.created_at as p_created_at, p.updated_at as p_updated_at
        FROM transaction_items ti
        JOIN products p ON ti.product_id = p.id
        WHERE ti.transaction_id = ?
        ORDER BY ti.id
        "#
    )
    .bind(id)
    .fetch_all(pool)
    .await?;
    
    let mut transaction_items = Vec::new();
    for row in items {
        let item = TransactionItem {
            id: row.get("id"),
            transaction_id: row.get("transaction_id"),
            product_id: row.get("product_id"),
            quantity: row.get("quantity"),
            unit_price: row.get("unit_price"),
            tax_rate: row.get("tax_rate"),
            subtotal: row.get("subtotal"),
            tax_amount: row.get("tax_amount"),
            total_amount: row.get("total_amount"),
        };
        
        let product = Product {
            id: row.get("p_id"),
            name: row.get("p_name"),
            code: row.get("p_code"),
            description: row.get("p_description"),
            unit_price: row.get("p_unit_price"),
            unit: row.get("p_unit"),
            tax_rate: row.get("p_tax_rate"),
            category: row.get("p_category"),
            is_active: row.get("p_is_active"),
            created_at: row.get("p_created_at"),
            updated_at: row.get("p_updated_at"),
        };
        
        transaction_items.push(TransactionItemWithProduct { item, product });
    }
    
    Ok(Some(TransactionWithItems {
        transaction,
        items: transaction_items,
        customer,
    }))
}

pub async fn create_transaction(pool: &DbPool, request: CreateTransactionRequest) -> AppResult<TransactionWithItems> {
    let now = Utc::now();
    
    // Validate transaction type
    if !matches!(request.transaction_type.as_str(), "sale" | "purchase") {
        return Err(AppError::Validation(
            "Transaction type must be 'sale' or 'purchase'".to_string()
        ));
    }
    
    // Validate that customer exists
    let customer_exists = sqlx::query("SELECT id FROM customers WHERE id = ?")
        .bind(request.customer_id)
        .fetch_optional(pool)
        .await?;
    
    if customer_exists.is_none() {
        return Err(AppError::NotFound("Customer not found".to_string()));
    }
    
    // Validate items and calculate totals
    if request.items.is_empty() {
        return Err(AppError::Validation("Transaction must have at least one item".to_string()));
    }
    
    let mut total_amount = 0.0;
    let mut tax_amount = 0.0;
    
    // Validate each item and calculate totals
    for item in &request.items {
        if item.quantity <= 0.0 {
            return Err(AppError::Validation("Item quantity must be positive".to_string()));
        }
        
        if item.unit_price < 0.0 {
            return Err(AppError::Validation("Item unit price cannot be negative".to_string()));
        }
        
        if item.tax_rate < 0.0 || item.tax_rate > 1.0 {
            return Err(AppError::Validation("Tax rate must be between 0.0 and 1.0".to_string()));
        }
        
        // Validate that product exists
        let product_exists = sqlx::query("SELECT id FROM products WHERE id = ? AND is_active = true")
            .bind(item.product_id)
            .fetch_optional(pool)
            .await?;
        
        if product_exists.is_none() {
            return Err(AppError::NotFound("Product not found or inactive".to_string()));
        }
        
        let subtotal = item.quantity * item.unit_price;
        let item_tax_amount = subtotal * item.tax_rate;
        let item_total = subtotal + item_tax_amount;
        
        total_amount += item_total;
        tax_amount += item_tax_amount;
    }
    
    // Start transaction
    let mut tx = pool.begin().await?;
    
    // Create transaction
    let transaction_id = sqlx::query(
        r#"
        INSERT INTO transactions (
            customer_id, transaction_type, transaction_date, 
            total_amount, tax_amount, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?)
        "#
    )
    .bind(request.customer_id)
    .bind(&request.transaction_type)
    .bind(request.transaction_date)
    .bind(total_amount)
    .bind(tax_amount)
    .bind(&request.notes)
    .bind(now)
    .bind(now)
    .execute(&mut *tx)
    .await?
    .last_insert_rowid();
    
    // Create transaction items
    for item in &request.items {
        let subtotal = item.quantity * item.unit_price;
        let item_tax_amount = subtotal * item.tax_rate;
        let item_total = subtotal + item_tax_amount;
        
        sqlx::query(
            r#"
            INSERT INTO transaction_items (
                transaction_id, product_id, quantity, unit_price, 
                tax_rate, subtotal, tax_amount, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(transaction_id)
        .bind(item.product_id)
        .bind(item.quantity)
        .bind(item.unit_price)
        .bind(item.tax_rate)
        .bind(subtotal)
        .bind(item_tax_amount)
        .bind(item_total)
        .execute(&mut *tx)
        .await?;
    }
    
    tx.commit().await?;
    
    let transaction = get_transaction_with_items(pool, transaction_id).await?
        .ok_or_else(|| AppError::NotFound("Created transaction not found".to_string()))?;
    
    Ok(transaction)
}

pub async fn update_transaction(pool: &DbPool, id: i64, request: UpdateTransactionRequest) -> AppResult<TransactionWithItems> {
    let now = Utc::now();
    
    // Validate that transaction exists
    let existing = sqlx::query("SELECT id FROM transactions WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    
    if existing.is_none() {
        return Err(AppError::NotFound("Transaction not found".to_string()));
    }
    
    // Validate customer if provided
    if let Some(customer_id) = request.customer_id {
        let customer_exists = sqlx::query("SELECT id FROM customers WHERE id = ?")
            .bind(customer_id)
            .fetch_optional(pool)
            .await?;
        
        if customer_exists.is_none() {
            return Err(AppError::NotFound("Customer not found".to_string()));
        }
    }
    
    // Validate status if provided
    if let Some(ref status) = request.status {
        if !matches!(status.as_str(), "draft" | "confirmed" | "cancelled") {
            return Err(AppError::Validation(
                "Status must be 'draft', 'confirmed', or 'cancelled'".to_string()
            ));
        }
    }
    
    // Build dynamic update query
    let mut query_parts = Vec::new();
    
    if request.customer_id.is_some() {
        query_parts.push("customer_id = ?");
    }
    if request.transaction_date.is_some() {
        query_parts.push("transaction_date = ?");
    }
    if request.status.is_some() {
        query_parts.push("status = ?");
    }
    if request.notes.is_some() {
        query_parts.push("notes = ?");
    }
    
    if query_parts.is_empty() {
        return Err(AppError::Validation("No fields to update".to_string()));
    }
    
    query_parts.push("updated_at = ?");
    
    let query_str = format!(
        "UPDATE transactions SET {} WHERE id = ?",
        query_parts.join(", ")
    );
    
    let mut query = sqlx::query(&query_str);
    
    // Add parameters
    if let Some(customer_id) = request.customer_id {
        query = query.bind(customer_id);
    }
    if let Some(transaction_date) = request.transaction_date {
        query = query.bind(transaction_date);
    }
    if let Some(status) = &request.status {
        query = query.bind(status);
    }
    if let Some(notes) = &request.notes {
        query = query.bind(notes);
    }
    
    query = query.bind(now).bind(id);
    
    query.execute(pool).await?;
    
    let transaction = get_transaction_with_items(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Updated transaction not found".to_string()))?;
    
    Ok(transaction)
}

pub async fn delete_transaction(pool: &DbPool, id: i64) -> AppResult<()> {
    // Check if transaction has tax invoices
    let invoice_count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM tax_invoices WHERE transaction_id = ?"
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    
    if invoice_count.0 > 0 {
        return Err(AppError::Business(
            "Cannot delete transaction that has tax invoices. Cancel the transaction instead.".to_string()
        ));
    }
    
    // Start transaction
    let mut tx = pool.begin().await?;
    
    // Delete transaction items first
    sqlx::query("DELETE FROM transaction_items WHERE transaction_id = ?")
        .bind(id)
        .execute(&mut *tx)
        .await?;
    
    // Delete transaction
    let rows_affected = sqlx::query("DELETE FROM transactions WHERE id = ?")
        .bind(id)
        .execute(&mut *tx)
        .await?
        .rows_affected();
    
    if rows_affected == 0 {
        return Err(AppError::NotFound("Transaction not found".to_string()));
    }
    
    tx.commit().await?;
    Ok(())
}

pub async fn confirm_transaction(pool: &DbPool, id: i64) -> AppResult<TransactionWithItems> {
    let now = Utc::now();
    
    let rows_affected = sqlx::query(
        "UPDATE transactions SET status = 'confirmed', updated_at = ? WHERE id = ? AND status = 'draft'"
    )
    .bind(now)
    .bind(id)
    .execute(pool)
    .await?
    .rows_affected();
    
    if rows_affected == 0 {
        return Err(AppError::Business(
            "Transaction not found or not in draft status".to_string()
        ));
    }
    
    let transaction = get_transaction_with_items(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Confirmed transaction not found".to_string()))?;
    
    Ok(transaction)
}

pub async fn cancel_transaction(pool: &DbPool, id: i64) -> AppResult<TransactionWithItems> {
    let now = Utc::now();
    
    let rows_affected = sqlx::query(
        "UPDATE transactions SET status = 'cancelled', updated_at = ? WHERE id = ? AND status IN ('draft', 'confirmed')"
    )
    .bind(now)
    .bind(id)
    .execute(pool)
    .await?
    .rows_affected();
    
    if rows_affected == 0 {
        return Err(AppError::Business(
            "Transaction not found or already cancelled".to_string()
        ));
    }
    
    let transaction = get_transaction_with_items(pool, id).await?
        .ok_or_else(|| AppError::NotFound("Cancelled transaction not found".to_string()))?;
    
    Ok(transaction)
}

#[derive(Debug, serde::Serialize)]
pub struct TransactionSummary {
    pub count: i64,
    pub total_amount: f64,
    pub tax_amount: f64,
}

pub async fn get_transaction_summary(pool: &DbPool, transaction_type: Option<String>, start_date: Option<chrono::DateTime<Utc>>, end_date: Option<chrono::DateTime<Utc>>) -> AppResult<TransactionSummary> {
    let mut where_conditions = vec!["status != 'cancelled'"];
    
    if transaction_type.is_some() {
        where_conditions.push("transaction_type = ?");
    }
    if start_date.is_some() {
        where_conditions.push("transaction_date >= ?");
    }
    if end_date.is_some() {
        where_conditions.push("transaction_date <= ?");
    }
    
    let where_clause = format!("WHERE {}", where_conditions.join(" AND "));
    
    let query = format!(
        r#"
        SELECT 
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as total_amount,
            COALESCE(SUM(tax_amount), 0) as tax_amount
        FROM transactions
        {}
        "#,
        where_clause
    );
    
    let mut query_builder = sqlx::query(&query);
    
    if let Some(ttype) = &transaction_type {
        query_builder = query_builder.bind(ttype);
    }
    if let Some(start) = start_date {
        query_builder = query_builder.bind(start);
    }
    if let Some(end) = end_date {
        query_builder = query_builder.bind(end);
    }
    
    let row = query_builder.fetch_one(pool).await?;
    
    Ok(TransactionSummary {
        count: row.get("count"),
        total_amount: row.get("total_amount"),
        tax_amount: row.get("tax_amount"),
    })
}
