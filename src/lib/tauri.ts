import { invoke } from '@tauri-apps/api/tauri'
import type { Customer, Product, Transaction, TransactionWithItems, TaxInvoice, Company } from '../types'

// 고객 관리 API
export const customerAPI = {
  getAll: (customerType?: 'customer' | 'supplier') => invoke<Customer[]>('get_customers', { customer_type: customerType }),
  getById: (id: number) => invoke<Customer>('get_customer_by_id', { id }),
  create: (customer: Omit<Customer, 'id' | 'created_at'>) => invoke<Customer>('create_customer', { request: customer }),
  update: (id: number, customer: Partial<Omit<Customer, 'id' | 'created_at'>>) => invoke<Customer>('update_customer', { id, request: customer }),
  delete: (id: number) => invoke<void>('delete_customer', { id }),
  search: (query: string, customerType?: 'customer' | 'supplier') => invoke<Customer[]>('search_customers', { query, customer_type: customerType }),
}

// 상품 관리 API
export const productAPI = {
  getAll: (activeOnly: boolean = true) => invoke<Product[]>('get_products', { active_only: activeOnly }),
  getById: (id: number) => invoke<Product>('get_product_by_id', { id }),
  create: (product: Omit<Product, 'id' | 'created_at'>) => invoke<Product>('create_product', { request: product }),
  update: (id: number, product: Partial<Omit<Product, 'id' | 'created_at'>>) => invoke<Product>('update_product', { id, request: product }),
  delete: (id: number) => invoke<void>('delete_product', { id }),
  search: (query: string, activeOnly: boolean = true) => invoke<Product[]>('search_products', { query, active_only: activeOnly }),
  getByCategory: (category: string, activeOnly: boolean = true) => invoke<Product[]>('get_products_by_category', { category, active_only: activeOnly }),
}

// 거래 관리 API
export const transactionAPI = {
  getAll: (transactionType?: 'sales' | 'purchase', customerId?: number, limit?: number, offset?: number) => 
    invoke<TransactionWithItems[]>('get_transactions', { 
      transaction_type: transactionType, 
      customer_id: customerId,
      limit,
      offset 
    }),
  getById: (id: number) => invoke<TransactionWithItems>('get_transaction_by_id', { id }),
  create: (transaction: any) => invoke<TransactionWithItems>('create_transaction', { request: transaction }),
  update: (id: number, transaction: any) => invoke<TransactionWithItems>('update_transaction', { id, request: transaction }),
  delete: (id: number) => invoke<void>('delete_transaction', { id }),
  confirm: (id: number) => invoke<TransactionWithItems>('confirm_transaction', { id }),
  cancel: (id: number) => invoke<TransactionWithItems>('cancel_transaction', { id }),
  getSummary: (startDate?: string, endDate?: string) => invoke<any>('get_transaction_summary', { start_date: startDate, end_date: endDate }),
}

// 세금계산서 API
export const invoiceAPI = {
  generate: (transactionId: number) => invoke<string>('generate_tax_invoice', { transactionId }),
  getAll: () => invoke<TaxInvoice[]>('get_tax_invoices'),
}

// 회사 정보 API
export const companyAPI = {
  get: () => invoke<Company>('get_company'),
  create: (company: Omit<Company, 'id' | 'created_at'>) => invoke<Company>('create_company', { request: company }),
  update: (id: number, company: Partial<Omit<Company, 'id' | 'created_at'>>) => invoke<Company>('update_company', { id, request: company }),
}

// 통계/보고서 API
export const reportAPI = {
  getSalesSummary: (startDate: string, endDate: string) => invoke('get_sales_summary', { startDate, endDate }),
  getPurchaseSummary: (startDate: string, endDate: string) => invoke('get_purchase_summary', { startDate, endDate }),
}
