use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Company {
    pub id: i64,
    pub name: String,
    pub business_number: String,
    pub address: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub representative: String,
    pub business_type: String,
    pub business_category: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub business_number: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub contact_person: Option<String>,
    pub customer_type: String, // 'customer' or 'supplier'
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: i64,
    pub name: String,
    pub code: Option<String>,
    pub description: Option<String>,
    pub unit_price: f64,
    pub unit: String, // 'unit', 'kg', 'box', etc.
    pub tax_rate: f64, // 0.1 for 10%
    pub category: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: i64,
    pub customer_id: i64,
    pub transaction_type: String, // 'sale' or 'purchase'
    pub transaction_date: DateTime<Utc>,
    pub total_amount: f64,
    pub tax_amount: f64,
    pub status: String, // 'draft', 'confirmed', 'cancelled'
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TransactionItem {
    pub id: i64,
    pub transaction_id: i64,
    pub product_id: i64,
    pub quantity: f64,
    pub unit_price: f64,
    pub tax_rate: f64,
    pub subtotal: f64,
    pub tax_amount: f64,
    pub total_amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionWithItems {
    #[serde(flatten)]
    pub transaction: Transaction,
    pub items: Vec<TransactionItemWithProduct>,
    pub customer: Customer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionItemWithProduct {
    #[serde(flatten)]
    pub item: TransactionItem,
    pub product: Product,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct TaxInvoice {
    pub id: i64,
    pub transaction_id: i64,
    pub invoice_number: String,
    pub issue_date: DateTime<Utc>,
    pub supplier_business_number: String,
    pub supplier_name: String,
    pub buyer_business_number: String,
    pub buyer_name: String,
    pub total_amount: f64,
    pub tax_amount: f64,
    pub status: String, // 'issued', 'sent', 'received'
    pub pdf_path: Option<String>,
    pub created_at: DateTime<Utc>,
}

// Request DTOs for creating/updating entities
#[derive(Debug, Deserialize)]
pub struct CreateCompanyRequest {
    pub name: String,
    pub business_number: String,
    pub address: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub representative: String,
    pub business_type: String,
    pub business_category: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCompanyRequest {
    pub name: Option<String>,
    pub business_number: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub representative: Option<String>,
    pub business_type: Option<String>,
    pub business_category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerRequest {
    pub name: String,
    pub business_number: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub contact_person: Option<String>,
    pub customer_type: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCustomerRequest {
    pub name: Option<String>,
    pub business_number: Option<String>,
    pub address: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub contact_person: Option<String>,
    pub customer_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub code: Option<String>,
    pub description: Option<String>,
    pub unit_price: f64,
    pub unit: String,
    pub tax_rate: f64,
    pub category: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub code: Option<String>,
    pub description: Option<String>,
    pub unit_price: Option<f64>,
    pub unit: Option<String>,
    pub tax_rate: Option<f64>,
    pub category: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    pub customer_id: i64,
    pub transaction_type: String,
    pub transaction_date: DateTime<Utc>,
    pub items: Vec<CreateTransactionItemRequest>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionItemRequest {
    pub product_id: i64,
    pub quantity: f64,
    pub unit_price: f64,
    pub tax_rate: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTransactionRequest {
    pub customer_id: Option<i64>,
    pub transaction_date: Option<DateTime<Utc>>,
    pub status: Option<String>,
    pub notes: Option<String>,
}
