import { invoke } from '@tauri-apps/api/tauri'
import type { Customer, Product, Transaction, TransactionWithItems, TaxInvoice, Company } from '../types'

// 고객 관리 API
export const customerAPI = {
  create: (customer: Customer) => invoke<number>('create_customer', { customer }),
  getAll: () => invoke<Customer[]>('get_customers'),
  update: (id: number, customer: Customer) => invoke<boolean>('update_customer', { id, customer }),
  delete: (id: number) => invoke<boolean>('delete_customer', { id }),
}

// 상품 관리 API
export const productAPI = {
  create: (product: Product) => invoke<number>('create_product', { product }),
  getAll: () => invoke<Product[]>('get_products'),
  update: (id: number, product: Product) => invoke<boolean>('update_product', { id, product }),
  delete: (id: number) => invoke<boolean>('delete_product', { id }),
}

// 거래 관리 API
export const transactionAPI = {
  create: (transactionData: TransactionWithItems) => invoke<number>('create_transaction', { transactionData }),
  getAll: () => invoke<TransactionWithItems[]>('get_transactions'),
  getById: (id: number) => invoke<TransactionWithItems>('get_transaction_by_id', { id }),
  update: (id: number, transactionData: TransactionWithItems) => invoke<boolean>('update_transaction', { id, transactionData }),
  delete: (id: number) => invoke<boolean>('delete_transaction', { id }),
}

// 세금계산서 API
export const invoiceAPI = {
  generate: (transactionId: number) => invoke<string>('generate_tax_invoice', { transactionId }),
  getAll: () => invoke<TaxInvoice[]>('get_tax_invoices'),
}

// 회사 정보 API
export const companyAPI = {
  get: () => invoke<Company>('get_company_info'),
  update: (company: Company) => invoke<boolean>('update_company_info', { company }),
}

// 통계/보고서 API
export const reportAPI = {
  getSalesSummary: (startDate: string, endDate: string) => invoke('get_sales_summary', { startDate, endDate }),
  getPurchaseSummary: (startDate: string, endDate: string) => invoke('get_purchase_summary', { startDate, endDate }),
}
