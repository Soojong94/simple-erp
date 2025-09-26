export interface Customer {
  id?: number
  name: string
  business_number?: string
  ceo_name?: string
  address?: string
  phone?: string
  email?: string
  type: 'customer' | 'supplier'  // customer_type → type 으로 통일
  contact_person?: string
  is_active: boolean
  created_at?: string
}

export interface Product {
  id?: number
  name: string
  code?: string
  category?: string
  unit: string
  unit_price?: number  // 선택사항으로 변경 (거래처별로 다르니까)
  description?: string
  is_active: boolean
  created_at?: string
}

export interface Transaction {
  id?: number
  customer_id: number
  customer_name?: string  // 조인 결과용
  transaction_type: 'sales' | 'purchase'
  transaction_date: string
  due_date?: string
  total_amount: number
  tax_amount: number
  notes?: string
  created_at?: string
}

export interface TransactionItem {
  id?: number
  transaction_id: number
  product_id?: number
  product_name: string
  quantity: number  // kg 단위
  unit: string      // "kg"
  unit_price: number // kg당 가격
  total_price: number // quantity * unit_price
  traceability_number?: string  // 이력번호 - 새로 추가!
  notes?: string
}

export interface TransactionWithItems {
  id?: number
  customer_id: number
  customer_name: string
  transaction_type: 'sales' | 'purchase'
  transaction_date: string
  due_date?: string
  total_amount: number
  tax_amount: number
  notes?: string
  created_at?: string
  items: TransactionItem[]
}

export interface TaxInvoice {
  id?: number
  transaction_id: number
  invoice_number: string
  issue_date: string
  supplier_name: string
  supplier_business_number: string
  customer_name: string
  customer_business_number: string
  total_amount: number
  tax_amount: number
  status: 'issued' | 'sent' | 'received'
  pdf_path?: string
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
  business_type?: string
  tax_invoice_api_key?: string
  tax_invoice_cert_file?: string
  created_at?: string
}

// 거래처별 상품 가격 관리용 - 새로 추가!
export interface CustomerProductPrice {
  id?: number
  customer_id: number
  product_id: number
  current_price_per_kg: number
  last_updated: string
  is_active: boolean
}

// 가격 변경 이력 - 새로 추가!
export interface PriceHistory {
  id?: number
  customer_id: number
  product_id: number
  old_price: number
  new_price: number
  changed_date: string
  transaction_id?: number
  notes?: string
}

// 거래명세서 출력용 데이터
export interface DeliveryNote {
  transaction: TransactionWithItems
  customer: Customer
  company: Company
  print_date: string
}

// 정렬 관련 타입 정의
export type SortOrder = 'asc' | 'desc'

export interface SortOption {
  value: string
  label: string
  icon?: string
}

export interface SortConfig {
  sortBy: string
  sortOrder: SortOrder
}
