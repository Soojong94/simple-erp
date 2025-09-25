import { customerAPI, productAPI, transactionAPI } from '../lib/tauri'

// 랜덤 데이터 생성 함수들
const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomFloat = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100

// 한국 고기업체 이름 데이터
const companyNames = [
  '삼성식품', '현대축산', 'LG푸드', '롯데미트', '대상 FNF',
  '진도축산', '청도축산', '보성축산', '하림', '마니커',
  '양념갈비명가', '한우명인', '돈까스클럽', '참푸드',
  '미트마켓', '축산왕', '고기마을', '정육점황제',
  '한국축산', '대한미트', '서울축산', '부산고기',
  '제주축산', '강원도축산', '충청도미트', '경상도푸드',
  '전라도축산', '경기축산', '인천미트', '대구고기'
]

const businessNumbers = [
  '123-45-67890', '234-56-78901', '345-67-89012', '456-78-90123',
  '567-89-01234', '678-90-12345', '789-01-23456', '890-12-34567',
  '901-23-45678', '012-34-56789', '121-34-56789', '131-34-56789',
  '141-34-56789', '151-34-56789', '161-34-56789', '171-34-56789',
  '181-34-56789', '191-34-56789', '201-34-56789', '211-34-56789'
]

const ceoNames = [
  '김철수', '이영희', '박민수', '최지은', '정혜원',
  '강동수', '윤서연', '임재현', '한미영', '오준석',
  '신다영', '배현우', '송지혜', '조민호', '허윤정',
  '남궁석', '황보영', '선우진', '독고영', '사공민'
]

const addresses = [
  '서울시 강남구 테헤란로 123', '부산시 해운대구 마린시티 456',
  '대구시 중구 동성로 789', '인천시 남동구 구월동 101',
  '광주시 서구 상무지구 202', '대전시 유성구 과학로 303',
  '울산시 남구 삼산동 404', '경기도 수원시 팔달구 505',
  '경상북도 안동시 상아동 606', '전라남도 목포시 하당 707',
  '충청북도 청주시 흥덕구 808', '강원도 춘천시 효자동 909',
  '제주특별자치도 제주시 1010', '경기도 성남시 분당구 1111',
  '경상남도 창원시 의창구 1212', '전라북도 전주시 완산구 1313',
  '충청남도 천안시 동남구 1414', '경기도 고양시 일산서구 1515',
  '부산시 부산진구 서면 1616', '대구시 달서구 월성동 1717'
]

const phones = [
  '010-1234-5678', '010-2345-6789', '010-3456-7890', '010-4567-8901',
  '010-5678-9012', '010-6789-0123', '010-7890-1234', '010-8901-2345',
  '010-9012-3456', '010-0123-4567', '010-1111-2222', '010-3333-4444',
  '010-5555-6666', '010-7777-8888', '010-9999-0000', '010-1122-3344',
  '010-5566-7788', '010-9900-1122', '010-3344-5566', '010-7788-9900'
]

const contactPersons = [
  '김과장', '이부장', '박대리', '최차장', '정팀장',
  '강실장', '윤사장', '임전무', '한상무', '오이사',
  '신부사장', '배회장', '송사원', '조대표', '허부회장',
  '남궁과장', '황보팀장', '선우대리', '독고부장', '사공실장'
]

// 상품 데이터
const productCategories = ['돼지고기', '소고기', '닭고기', '오리고기']
const productNames = {
  '돼지고기': ['삼겹살', '목살', '항정살', '갈비', '등심', '안심', '앞다리살', '뒷다리살'],
  '소고기': ['등심', '안심', '채끝', '갈비', '양지', '사태', '우둔', '설도'],
  '닭고기': ['닭다리', '닭가슴살', '닭날개', '닭목', '닭안심', '통닭', '닭껍질'],
  '오리고기': ['오리다리', '오리가슴살', '오리날개', '통오리', '오리목살']
}

// 이력번호 생성
const generateTraceabilityNumber = () => {
  const year = new Date().getFullYear().toString().slice(-2)
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const day = String(new Date().getDate()).padStart(2, '0')
  const serial = String(getRandomNumber(1, 999)).padStart(3, '0')
  const batch = String(getRandomNumber(1, 999)).padStart(3, '0')
  return `${year}${month}${day}-${serial}-${batch}`
}

// 랜덤 날짜 생성 (최근 6개월)
const getRandomDate = () => {
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)
  
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
  return new Date(randomTime).toISOString().split('T')[0]
}

// 데이터 생성 함수
export const generateTestData = async () => {
  try {
    console.log('🎲 테스트 데이터 생성 시작...')

    // 1. 거래처 20개 생성 (고객 12개, 공급업체 8개)
    console.log('👥 거래처 데이터 생성 중...')
    const customers = []
    
    for (let i = 0; i < 20; i++) {
      const isCustomer = i < 12 // 처음 12개는 고객, 나머지 8개는 공급업체
      const customer = {
        name: companyNames[i],
        business_number: businessNumbers[i],
        ceo_name: ceoNames[i],
        address: addresses[i],
        phone: phones[i],
        email: `${companyNames[i].toLowerCase().replace(/\s+/g, '')}@company.com`,
        type: isCustomer ? 'customer' as const : 'supplier' as const,
        contact_person: contactPersons[i],
        is_active: Math.random() > 0.1 // 90% 확률로 활성
      }
      
      const created = await customerAPI.create(customer)
      customers.push(created)
    }

    // 2. 상품 24개 생성 (카테고리별 6개씩)
    console.log('📦 상품 데이터 생성 중...')
    const products = []
    
    for (const category of productCategories) {
      const categoryProducts = productNames[category]
      for (let j = 0; j < 6; j++) {
        const productName = categoryProducts[j % categoryProducts.length]
        const product = {
          name: `${productName} ${j > categoryProducts.length - 1 ? '(특급)' : ''}`,
          code: `${category.charAt(0)}${String(j + 1).padStart(3, '0')}`,
          category,
          unit: 'kg',
          unit_price: getRandomFloat(8000, 25000), // kg당 8천원~2만5천원
          description: `신선한 ${category} ${productName}`,
          is_active: Math.random() > 0.05 // 95% 확률로 활성
        }
        
        const created = await productAPI.create(product)
        products.push(created)
      }
    }

    // 3. 거래 30개 생성
    console.log('💼 거래 데이터 생성 중...')
    const transactions = []
    
    for (let i = 0; i < 30; i++) {
      const isSales = Math.random() > 0.4 // 60% 확률로 매출
      const availableCustomers = customers.filter(c => 
        isSales ? c.type === 'customer' : c.type === 'supplier'
      )
      const selectedCustomer = getRandomElement(availableCustomers)
      
      // 거래에 포함할 상품 1-4개 랜덤 선택
      const itemCount = getRandomNumber(1, 4)
      const selectedProducts = []
      const usedProductIds = new Set()
      
      for (let j = 0; j < itemCount; j++) {
        let product
        do {
          product = getRandomElement(products.filter(p => p.is_active))
        } while (usedProductIds.has(product.id))
        
        usedProductIds.add(product.id)
        selectedProducts.push(product)
      }
      
      // 거래 상품 생성
      const items = selectedProducts.map(product => ({
        product_name: product.name,
        quantity: getRandomFloat(0.5, 10.0), // 0.5kg ~ 10kg
        unit: 'kg',
        unit_price: product.unit_price! * getRandomFloat(0.8, 1.2), // 기준 가격의 80%~120%
        total_price: 0, // 자동 계산됨
        traceability_number: generateTraceabilityNumber(),
        notes: Math.random() > 0.7 ? '특급 품질' : ''
      }))
      
      // 총액 계산
      items.forEach(item => {
        item.total_price = item.quantity * item.unit_price
      })
      
      const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
      const taxAmount = Math.round(subtotal * 0.1)
      const totalAmount = subtotal + taxAmount
      
      const transaction = {
        customer_id: selectedCustomer.id!,
        transaction_type: isSales ? 'sales' as const : 'purchase' as const,
        transaction_date: getRandomDate(),
        due_date: new Date(Date.now() + getRandomNumber(7, 30) * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0], // 7~30일 후
        total_amount: totalAmount,
        tax_amount: taxAmount,
        notes: Math.random() > 0.8 ? '긴급 주문' : '',
        items
      }
      
      const created = await transactionAPI.create(transaction)
      transactions.push(created)
    }

    console.log('✅ 테스트 데이터 생성 완료!')
    console.log(`👥 거래처: ${customers.length}개 (고객 ${customers.filter(c => c.type === 'customer').length}개, 공급업체 ${customers.filter(c => c.type === 'supplier').length}개)`)
    console.log(`📦 상품: ${products.length}개 (${productCategories.map(cat => `${cat} ${products.filter(p => p.category === cat).length}개`).join(', ')})`)
    console.log(`💼 거래: ${transactions.length}개 (매출 ${transactions.filter(t => t.transaction_type === 'sales').length}개, 매입 ${transactions.filter(t => t.transaction_type === 'purchase').length}개)`)
    
    alert('🎉 테스트 데이터가 성공적으로 생성되었습니다!\n페이지를 새로고침하면 데이터를 확인할 수 있습니다.')
    
    return {
      customers: customers.length,
      products: products.length,
      transactions: transactions.length
    }
    
  } catch (error) {
    console.error('❌ 테스트 데이터 생성 실패:', error)
    alert('테스트 데이터 생성 중 오류가 발생했습니다.')
    throw error
  }
}

// 기존 데이터 삭제 (선택사항)
export const clearAllData = async () => {
  if (confirm('⚠️ 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
    localStorage.clear()
    alert('✅ 모든 데이터가 삭제되었습니다.\n페이지를 새로고침해주세요.')
    window.location.reload()
  }
}
