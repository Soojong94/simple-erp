import type { Customer, Product, TransactionWithItems } from '../types'

/**
 * 테스트용 거래처 데이터 생성
 */
export function generateCustomers(): Customer[] {
  const customerNames = [
    '삼성식품', 'LG마트', '현대식자재', 'SK푸드', '롯데마트',
    '이마트 본점', '홈플러스 강남점', '농협 하나로마트', 
    '코스트코 양재점', 'GS25 본사', '세븐일레븐 대구점', '미니스톱 부산점'
  ]
  
  const supplierNames = [
    '대한축산', '한우명가', '돼지왕국', '닭고기도매', 
    '축산유통센터', '신선육가공', '프리미엄미트', '농협축산물'
  ]

  const customers: Customer[] = []
  let id = 1

  // 고객 생성
  customerNames.forEach((name, index) => {
    customers.push({
      id: id++,
      name,
      business_number: `${100 + index}-${10 + index}-${10000 + index}`,
      type: 'customer',
      contact_person: `김담당${index + 1}`,
      phone: `02-${1000 + index * 100}-${1000 + index}`,
      email: `contact${index + 1}@${name.replace(/\s/g, '').toLowerCase()}.com`,
      address: `서울시 강남구 테헤란로 ${100 + index * 10}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })

  // 공급업체 생성
  supplierNames.forEach((name, index) => {
    customers.push({
      id: id++,
      name,
      business_number: `${200 + index}-${20 + index}-${20000 + index}`,
      type: 'supplier',
      contact_person: `박사장${index + 1}`,
      phone: `031-${2000 + index * 100}-${2000 + index}`,
      email: `sales${index + 1}@${name.replace(/\s/g, '').toLowerCase()}.com`,
      address: `경기도 안양시 동안구 시민대로 ${200 + index * 10}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })

  return customers
}

/**
 * 테스트용 상품 데이터 생성
 */
export function generateProducts(): Product[] {
  const productData = [
    // 돼지고기 (6개)
    { name: '삼겹살', category: '돼지고기', price: 15000 },
    { name: '목살', category: '돼지고기', price: 12000 },
    { name: '앞다리살', category: '돼지고기', price: 9000 },
    { name: '뒷다리살', category: '돼지고기', price: 8000 },
    { name: '등심', category: '돼지고기', price: 14000 },
    { name: '갈비', category: '돼지고기', price: 16000 },
    
    // 소고기 (6개)
    { name: '채끝', category: '소고기', price: 35000 },
    { name: '등심', category: '소고기', price: 40000 },
    { name: '안심', category: '소고기', price: 45000 },
    { name: '양지', category: '소고기', price: 25000 },
    { name: '사태', category: '소고기', price: 20000 },
    { name: '갈비살', category: '소고기', price: 38000 },
    
    // 닭고기 (6개)
    { name: '닭다리', category: '닭고기', price: 5000 },
    { name: '닭가슴살', category: '닭고기', price: 6000 },
    { name: '닭날개', category: '닭고기', price: 7000 },
    { name: '닭목', category: '닭고기', price: 4000 },
    { name: '닭안심', category: '닭고기', price: 8000 },
    { name: '통닭', category: '닭고기', price: 12000 },
    
    // 오리고기 (6개)
    { name: '오리다리', category: '오리고기', price: 9000 },
    { name: '오리가슴살', category: '오리고기', price: 10000 },
    { name: '오리날개', category: '오리고기', price: 8000 },
    { name: '통오리', category: '오리고기', price: 18000 },
    { name: '오리목살', category: '오리고기', price: 11000 },
    { name: '오리안심', category: '오리고기', price: 12000 }
  ]

  const products: Product[] = []
  
  productData.forEach((item, index) => {
    const categoryCode = item.category.substring(0, 2).toUpperCase()
    const nameCode = item.name.substring(0, 2).toUpperCase()
    const code = `${categoryCode}${nameCode}${String(index + 1).padStart(3, '0')}`
    
    products.push({
      id: index + 1,
      name: item.name,
      code,
      category: item.category,
      unit: 'kg',
      unit_price: item.price,
      description: `국내산 ${item.category} ${item.name} (1등급)`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })

  return products
}

/**
 * 테스트용 거래 데이터 생성
 */
export function generateTransactions(
  customers: Customer[], 
  products: Product[]
): TransactionWithItems[] {
  const transactions: TransactionWithItems[] = []
  
  const customerList = customers.filter(c => c.type === 'customer')
  const supplierList = customers.filter(c => c.type === 'supplier')
  
  // 최근 6개월 날짜 생성
  const today = new Date()
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(today.getMonth() - 6)
  
  let transactionId = 1

  // 매출 거래 18개 생성
  for (let i = 0; i < 18; i++) {
    const customer = customerList[i % customerList.length]
    const randomDate = new Date(
      sixMonthsAgo.getTime() + 
      Math.random() * (today.getTime() - sixMonthsAgo.getTime())
    )
    
    // 1-3개 랜덤 상품 선택
    const itemCount = Math.floor(Math.random() * 3) + 1
    const selectedProducts = []
    for (let j = 0; j < itemCount; j++) {
      selectedProducts.push(products[Math.floor(Math.random() * products.length)])
    }

    // 거래 아이템 생성
    const items = selectedProducts.map((product, idx) => {
      const quantity = Math.floor(Math.random() * 20) + 5 // 5-24 kg
      const unitPrice = product.unit_price || 10000
      const totalPrice = quantity * unitPrice
      
      return {
        id: transactionId * 100 + idx,
        transaction_id: transactionId,
        product_id: product.id!,
        product_name: product.name,
        quantity,
        unit: 'kg',
        unit_price: unitPrice,
        total_price: totalPrice,
        traceability_number: `${randomDate.getFullYear().toString().slice(-2)}${String(randomDate.getMonth() + 1).padStart(2, '0')}${String(randomDate.getDate()).padStart(2, '0')}-${String(transactionId).padStart(3, '0')}-${String(idx + 1).padStart(3, '0')}`,
        notes: ''
      }
    })

    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
    const taxAmount = Math.round(totalAmount * 0.1)

    transactions.push({
      id: transactionId++,
      customer_id: customer.id!,
      customer_name: customer.name,
      transaction_type: 'sales',
      transaction_date: randomDate.toISOString().split('T')[0],
      due_date: '',
      total_amount: totalAmount,
      tax_amount: taxAmount,
      notes: `${customer.name}에 ${items.length}개 상품 판매`,
      items,
      created_at: randomDate.toISOString(),
      updated_at: randomDate.toISOString()
    })
  }

  // 매입 거래 12개 생성
  for (let i = 0; i < 12; i++) {
    const supplier = supplierList[i % supplierList.length]
    const randomDate = new Date(
      sixMonthsAgo.getTime() + 
      Math.random() * (today.getTime() - sixMonthsAgo.getTime())
    )
    
    // 1-4개 랜덤 상품 선택
    const itemCount = Math.floor(Math.random() * 4) + 1
    const selectedProducts = []
    for (let j = 0; j < itemCount; j++) {
      selectedProducts.push(products[Math.floor(Math.random() * products.length)])
    }

    // 거래 아이템 생성
    const items = selectedProducts.map((product, idx) => {
      const quantity = Math.floor(Math.random() * 50) + 10 // 10-59 kg
      const unitPrice = Math.round((product.unit_price || 10000) * 0.7) // 공급가는 70%
      const totalPrice = quantity * unitPrice
      
      return {
        id: transactionId * 100 + idx,
        transaction_id: transactionId,
        product_id: product.id!,
        product_name: product.name,
        quantity,
        unit: 'kg',
        unit_price: unitPrice,
        total_price: totalPrice,
        traceability_number: `${randomDate.getFullYear().toString().slice(-2)}${String(randomDate.getMonth() + 1).padStart(2, '0')}${String(randomDate.getDate()).padStart(2, '0')}-${String(transactionId).padStart(3, '0')}-${String(idx + 1).padStart(3, '0')}`,
        notes: ''
      }
    })

    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
    const taxAmount = Math.round(totalAmount * 0.1)

    transactions.push({
      id: transactionId++,
      customer_id: supplier.id!,
      customer_name: supplier.name,
      transaction_type: 'purchase',
      transaction_date: randomDate.toISOString().split('T')[0],
      due_date: '',
      total_amount: totalAmount,
      tax_amount: taxAmount,
      notes: `${supplier.name}에서 ${items.length}개 상품 매입`,
      items,
      created_at: randomDate.toISOString(),
      updated_at: randomDate.toISOString()
    })
  }

  // 날짜순 정렬 (최신순)
  transactions.sort((a, b) => 
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  )

  return transactions
}

/**
 * 모든 테스트 데이터 생성 및 localStorage 저장
 */
export function generateAndSaveTestData() {
  try {
    
    // 데이터 생성
    const customers = generateCustomers()
    const products = generateProducts()
    const transactions = generateTransactions(customers, products)
    
    // localStorage에 저장
    localStorage.setItem('simple-erp-customers', JSON.stringify(customers))
    localStorage.setItem('simple-erp-products', JSON.stringify(products))
    localStorage.setItem('simple-erp-transactions', JSON.stringify(transactions))
    
    // Next IDs 업데이트
    const nextIds = {
      customers: customers.length + 1,
      products: products.length + 1,
      transactions: transactions.length + 1
    }
    localStorage.setItem('simple-erp-next-ids', JSON.stringify(nextIds))
    
    
    return {
      success: true,
      data: { customers, products, transactions },
      message: '테스트 데이터가 생성되었습니다!'
    }
  } catch (error) {
    console.error('❌ 테스트 데이터 생성 실패:', error)
    return {
      success: false,
      error,
      message: '테스트 데이터 생성 중 오류가 발생했습니다.'
    }
  }
}
