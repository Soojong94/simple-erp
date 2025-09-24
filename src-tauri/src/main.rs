// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod errors;
mod models;
mod services;
mod commands;

use database::init_db;
use commands::*;

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize database
            let handle = app.handle();
            tauri::async_runtime::spawn(async move {
                match init_db(&handle).await {
                    Ok(pool) => {
                        // Store the database pool in app state
                        handle.manage(pool);
                        println!("Database initialized successfully!");
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                        std::process::exit(1);
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Company commands
            get_company,
            create_company,
            update_company,
            
            // Customer commands
            get_customers,
            get_customer_by_id,
            create_customer,
            update_customer,
            delete_customer,
            search_customers,
            
            // Product commands
            get_products,
            get_product_by_id,
            create_product,
            update_product,
            delete_product,
            search_products,
            get_products_by_category,
            
            // Transaction commands
            get_transactions,
            get_transaction_by_id,
            create_transaction,
            update_transaction,
            delete_transaction,
            confirm_transaction,
            cancel_transaction,
            get_transaction_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
