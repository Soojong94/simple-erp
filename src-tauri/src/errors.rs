use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Business logic error: {0}")]
    Business(String),
    
    #[error("External service error: {0}")]
    External(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
    pub code: String,
    pub details: Option<String>,
}

impl From<AppError> for ErrorResponse {
    fn from(err: AppError) -> Self {
        match err {
            AppError::Database(e) => ErrorResponse {
                error: "Database operation failed".to_string(),
                code: "DATABASE_ERROR".to_string(),
                details: Some(e.to_string()),
            },
            AppError::NotFound(msg) => ErrorResponse {
                error: msg,
                code: "NOT_FOUND".to_string(),
                details: None,
            },
            AppError::Validation(msg) => ErrorResponse {
                error: msg,
                code: "VALIDATION_ERROR".to_string(),
                details: None,
            },
            AppError::Business(msg) => ErrorResponse {
                error: msg,
                code: "BUSINESS_ERROR".to_string(),
                details: None,
            },
            AppError::External(msg) => ErrorResponse {
                error: msg,
                code: "EXTERNAL_ERROR".to_string(),
                details: None,
            },
            AppError::Io(e) => ErrorResponse {
                error: "File system operation failed".to_string(),
                code: "IO_ERROR".to_string(),
                details: Some(e.to_string()),
            },
            AppError::Serialization(e) => ErrorResponse {
                error: "Data serialization failed".to_string(),
                code: "SERIALIZATION_ERROR".to_string(),
                details: Some(e.to_string()),
            },
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;
