export interface Customer {
  id?: number
  name: string
  business_number?: string
  ceo_name?: string
  address?: string
  phone?: string
  email?: string
  customer_type: 'customer' | 'supplier'
  created_at?: string
}

export interface Product {
  id?: number
  name: string
  code?: string
  unit: string
  unit_price: number
  tax_rate: number
  created_at?: string
}

export interface Transaction {
  id?: number
  customer_id: number
  transaction_type: 'sales' | 'purchase'
  transaction_date: string
  total_amount: number
  tax_amount: number
  supply_amount: number
  status: 'pending' | 'completed' | 'cancelled'
  memo?: string
  created_at?: string
}

export interface TransactionItem {
  id?: number
  transaction_id: number
  product_id?: number
  product_name: string
  quantity: number
  unit_price: number
  amount: number
  tax_amount: number
}

export interface TransactionWithItems {
  transaction: Transaction
  items: TransactionItem[]
  customer: Customer
}

export interface TaxInvoice {
  id?: number
  transaction_id: number
  invoice_number: string
  issue_date: string
  pdf_path?: string
  email_sent: boolean
  created_at?: string
}

export interface Company {
  id?: number
  name: string
  business_number?: string
  ceo_name?: string
  address?: string
  phone?: string
  email?: string
  created_at?: string
}
