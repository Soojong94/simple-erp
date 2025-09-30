import { invoke } from '@tauri-apps/api/tauri'
import type { Customer } from '../../types'
import { STORAGE_KEYS, getFromStorage, setToStorage, getNextId, delay, isTauri } from './helpers/storage'
import { backupTrigger } from './helpers/backup'

// 고객 관리 API
export const customerAPI = {
  getAll: async (customerType?: 'customer' | 'supplier') => {
    if (isTauri()) {
      return invoke<Customer[]>('get_customers', { customer_type: customerType })
    } else {
      await delay(300)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      return customerType 
        ? customers.filter(c => c.type === customerType)
        : customers
    }
  },
  
  getById: async (id: number) => {
    if (isTauri()) {
      return invoke<Customer>('get_customer_by_id', { id })
    } else {
      await delay(200)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const customer = customers.find(c => c.id === id)
      if (!customer) throw new Error('Customer not found')
      return customer
    }
  },
  
  create: async (customerData: Omit<Customer, 'id' | 'created_at'>) => {
    if (isTauri()) {
      return invoke<Customer>('create_customer', { request: customerData })
    } else {
      await delay(500)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const newCustomer: Customer = {
        ...customerData,
        id: getNextId('customer'),
        created_at: new Date().toISOString()
      }
      customers.push(newCustomer)
      setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
      backupTrigger.trigger() // 자동 백업 트리거
      return newCustomer
    }
  },
  
  update: async (id: number, customerData: Partial<Omit<Customer, 'id' | 'created_at'>>) => {
    if (isTauri()) {
      return invoke<Customer>('update_customer', { id, request: customerData })
    } else {
      await delay(400)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const index = customers.findIndex(c => c.id === id)
      if (index === -1) throw new Error('Customer not found')
      customers[index] = { ...customers[index], ...customerData }
      setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
      backupTrigger.trigger() // 자동 백업 트리거
      return customers[index]
    }
  },
  
  delete: async (id: number) => {
    if (isTauri()) {
      return invoke<void>('delete_customer', { id })
    } else {
      await delay(300)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const index = customers.findIndex(c => c.id === id)
      if (index === -1) throw new Error('Customer not found')
      customers.splice(index, 1)
      setToStorage(STORAGE_KEYS.CUSTOMERS, customers)
      backupTrigger.trigger() // 자동 백업 트리거
    }
  },
  
  search: async (query: string, customerType?: 'customer' | 'supplier') => {
    if (isTauri()) {
      return invoke<Customer[]>('search_customers', { query, customer_type: customerType })
    } else {
      await delay(200)
      const customers = getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, [])
      const filtered = customers.filter(c => {
        const matchesType = !customerType || c.type === customerType
        const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase()) ||
                            (c.business_number && c.business_number.includes(query)) ||
                            (c.contact_person && c.contact_person.toLowerCase().includes(query.toLowerCase()))
        return matchesType && matchesQuery
      })
      return filtered
    }
  }
}
