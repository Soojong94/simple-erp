import { useMemo } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import type { TransactionWithItems, Product } from '../types'

interface UseChartDataParams {
  transactions?: TransactionWithItems[]
  products?: Product[]
}

export const useChartData = ({ transactions, products }: UseChartDataParams) => {
  // 월별 매출 추이 데이터 생성 (최근 6개월)
  const monthlyData = useMemo(() => {
    if (!transactions) return []
    
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthStart = startOfMonth(date)
      const monthEnd = endOfMonth(date)
      
      const monthlySales = transactions.filter(t => {
        if (!t.transaction_date || t.transaction_type !== 'sales' || t.status !== 'confirmed') return false
        const transactionDate = new Date(t.transaction_date)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      }).reduce((sum, t) => sum + t.total_amount, 0)

      const monthlyPurchases = transactions.filter(t => {
        if (!t.transaction_date || t.transaction_type !== 'purchase' || t.status !== 'confirmed') return false
        const transactionDate = new Date(t.transaction_date)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      }).reduce((sum, t) => sum + t.total_amount, 0)

      months.push({
        month: format(date, 'M월'),
        매출: monthlySales,
        매입: monthlyPurchases,
        수익: monthlySales - monthlyPurchases
      })
    }
    return months
  }, [transactions])

  // 거래처별 매출 비중 데이터 (상위 5개)
  const customerSalesData = useMemo(() => {
    if (!transactions) return []
    
    const customerSales: { [key: string]: number } = {}
    
    transactions.filter(t => t.transaction_type === 'sales' && t.status === 'confirmed')
      .forEach(t => {
        const customerName = t.customer_name || '미지정'
        customerSales[customerName] = (customerSales[customerName] || 0) + t.total_amount
      })

    const sortedCustomers = Object.entries(customerSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']
    
    return sortedCustomers.map(([name, amount], index) => ({
      name,
      value: amount,
      color: colors[index]
    }))
  }, [transactions])

  // 상품 카테고리별 판매량 데이터
  const categoryData = useMemo(() => {
    if (!transactions || !products) return []
    
    const categorySales: { [key: string]: number } = {}
    
    transactions.filter(t => t.transaction_type === 'sales' && t.status === 'confirmed')
      .forEach(t => {
        t.items?.forEach(item => {
          const product = products.find(p => p.name === item.product_name)
          const category = product?.category || '기타'
          categorySales[category] = (categorySales[category] || 0) + item.quantity
        })
      })

    return Object.entries(categorySales).map(([category, quantity]) => ({
      category,
      quantity: Math.round(quantity * 100) / 100, // 소수점 2자리까지
      emoji: category === '돼지고기' ? '🐷' :
             category === '소고기' ? '🐄' :
             category === '닭고기' ? '🐔' :
             category === '오리고기' ? '🦆' : '🍖'
    }))
  }, [transactions, products])

  // 이번 달 매출 계산
  const thisMonthSales = useMemo(() => {
    if (!transactions) return 0
    
    return transactions.filter(t => {
      if (!t.transaction_date) return false
      const transactionDate = new Date(t.transaction_date)
      const now = new Date()
      return transactionDate.getMonth() === now.getMonth() &&
             transactionDate.getFullYear() === now.getFullYear() &&
             t.transaction_type === 'sales' &&
             t.status === 'confirmed'
    }).reduce((sum, t) => sum + t.total_amount, 0)
  }, [transactions])

  return {
    monthlyData,
    customerSalesData,
    categoryData,
    thisMonthSales
  }
}
