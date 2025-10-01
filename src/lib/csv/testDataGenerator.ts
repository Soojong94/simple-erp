import type { Customer, Product, TransactionItem } from '../../types'
import { customerAPI, productAPI, transactionAPI } from '../tauri'

// 랜덤 헬퍼
const randomPick = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
const randomInt = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min
const randomPrice = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1) / 100) * 100 + min

// 샘플 데이터
const customerNames = [
  '삼성식품', 'CJ프레시웨이', '롯데마트', '이마트', '홈플러스',
  '농협하나로마트', '대상', '동원F&B', '풀무원', '오뚜기',
  '신세계푸드', '이랜드이츠', '아워홈', 'GS리테일', '세븐일레븐',
  '코스트코', '킴스클럽', '하나로마트', '메가마트', '트레이더스',
  '우리육가공', '한국축산', '고기마을', '정육코너', '한우농가',
  '한돈협회', '양돈농가', '축산물유통', '육류도매', '고기세상',
  '프리미엄푸드', '신선식품', '정육마트', '고기천국', '육류센터',
  '한우플라자', '돼지마을', '치킨월드', '닭가슴살전문', '오리전문점',
  '육가공센터', '정육점', '고기마켓', '육류전문', '축산마트',
  '프레시마트', '고기창고', '육류왕국', '고기대장', '정육대장'
]

const ceoNames = ['김철수', '이영희', '박민수', '최지연', '정우성', '강소라', '임수정', '송중기', '전지현', '이민호']

const addresses = [
  '서울시 강남구 테헤란로 123', '서울시 송파구 올림픽로 456',
  '경기도 성남시 분당구 판교로 789', '인천시 연수구 송도대로 321',
  '부산시 해운대구 마린시티 654', '대구시 수성구 동대구로 987',
  '광주시 서구 상무대로 111', '대전시 유성구 대덕대로 222',
  '울산시 남구 삼산로 333', '경기도 수원시 팔달구 효원로 444'
]

const productNames = {
  돼지고기: ['삼겹살', '목살', '항정살', '갈매기살', '오겹살', '등심', '안심', '앞다리살', '뒷다리살', '가브리살'],
  소고기: ['등심', '안심', '채끝', '목심', '우둔', '설도', '양지', '사태', '갈비', '꽃갈비'],
  닭고기: ['닭가슴살', '닭다리', '닭날개', '통닭', '삼계탕용', '백숙용', '볶음탕용', '튀김용', '손질닭', '닭안심'],
  오리고기: ['오리가슴살', '오리다리', '오리날개', '훈제오리', '오리주물럭', '오리로스', '오리안심', '오리목살', '통오리', '반마리']
}

const origins = [
  '국내산(충청)', '국내산(전라)', '국내산(경상)', '국내산(제주)',
  '미국산', '호주산', '뉴질랜드산', '캐나다산'
]

const slaughterhouses = [
  '서울육가공센터', '경기육가공센터', '충청육가공센터', '전라육가공센터',
  '경상육가공센터', 'OO축산물센터', 'XX도축장', '△△육가공공장'
]

/**
 * 거래처 테스트 데이터 생성
 */
export async function generateTestCustomers(count: number = 100): Promise<void> {
  console.log(`🏢 거래처 ${count}개 생성 시작...`)
  
  for (let i = 0; i < count; i++) {
    const type = i % 2 === 0 ? 'customer' : 'supplier'
    const name = `${randomPick(customerNames)}_${i + 1}`
    
    try {
      await customerAPI.create({
        name,
        business_number: `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(10000, 99999)}`,
        ceo_name: randomPick(ceoNames),
        address: randomPick(addresses),
        phone: `010-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        email: `contact${i + 1}@example.com`,
        type,
        contact_person: randomPick(ceoNames),
        is_active: Math.random() > 0.1
      })
    } catch (error) {
      console.error(`거래처 생성 실패: ${name}`, error)
    }
    
    // 진행상황 로깅 (10%마다)
    if ((i + 1) % Math.ceil(count / 10) === 0) {
      console.log(`진행: ${i + 1}/${count} 거래처 생성 완료`)
    }
  }
  
  console.log(`✅ 거래처 ${count}개 생성 완료`)
}

/**
 * 상품 테스트 데이터 생성
 */
export async function generateTestProducts(count: number = 150): Promise<void> {
  console.log(`📦 상품 ${count}개 생성 시작...`)
  
  const categories = Object.keys(productNames) as Array<keyof typeof productNames>
  
  for (let i = 0; i < count; i++) {
    const category = randomPick(categories)
    const name = randomPick(productNames[category])
    const fullName = `${name}_${i + 1}`
    
    // 이력번호 생성
    const date = new Date()
    const yy = String(date.getFullYear()).slice(2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const seq = String(randomInt(1, 999)).padStart(3, '0')
    const code = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                 String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                 String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const traceability = `${yy}${mm}${dd}-${seq}-${code}`
    
    try {
      await productAPI.create({
        name: fullName,
        code: `${category.slice(0, 2).toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
        category,
        unit: 'kg',
        unit_price: randomPrice(5000, 50000),
        description: `신선한 ${category} ${name}`,
        traceability_number: traceability,
        origin: randomPick(origins),
        slaughterhouse: randomPick(slaughterhouses),
        use_inventory_management: Math.random() > 0.5,
        is_active: Math.random() > 0.05
      })
    } catch (error) {
      console.error(`상품 생성 실패: ${fullName}`, error)
    }
    
    // 진행상황 로깅
    if ((i + 1) % Math.ceil(count / 10) === 0) {
      console.log(`진행: ${i + 1}/${count} 상품 생성 완료`)
    }
  }
  
  console.log(`✅ 상품 ${count}개 생성 완료`)
}

/**
 * 거래 테스트 데이터 생성
 */
export async function generateTestTransactions(count: number = 200): Promise<void> {
  console.log(`📊 거래 ${count}개 생성 시작...`)
  
  // 기존 거래처와 상품 조회
  const customers = await customerAPI.getAll()
  const products = await productAPI.getAll()
  
  if (customers.length === 0 || products.length === 0) {
    throw new Error('거래처 또는 상품이 없습니다. 먼저 생성해주세요.')
  }
  
  const salesCustomers = customers.filter(c => c.type === 'customer')
  const purchaseCustomers = customers.filter(c => c.type === 'supplier')
  
  if (salesCustomers.length === 0 || purchaseCustomers.length === 0) {
    throw new Error('고객 또는 공급업체가 없습니다.')
  }
  
  // 최근 180일 내의 랜덤 날짜 생성
  const getRandomDate = () => {
    const today = new Date()
    const daysAgo = randomInt(0, 180)
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split('T')[0]
  }
  
  for (let i = 0; i < count; i++) {
    const isSales = i % 2 === 0
    const customer = randomPick(isSales ? salesCustomers : purchaseCustomers)
    
    // 거래당 1-5개의 상품 추가
    const itemCount = randomInt(1, 5)
    const items: Omit<TransactionItem, 'id' | 'transaction_id'>[] = []
    
    for (let j = 0; j < itemCount; j++) {
      const product = randomPick(products)
      const quantity = randomInt(10, 100)
      const unitPrice = product.unit_price || randomPrice(5000, 50000)
      const totalPrice = quantity * unitPrice
      
      items.push({
        product_id: product.id!,
        product_name: product.name,
        quantity,
        unit: product.unit,
        unit_price: unitPrice,
        total_price: totalPrice,
        traceability_number: product.traceability_number || '',
        origin: product.origin || '',
        slaughterhouse: product.slaughterhouse || '',
        notes: Math.random() > 0.7 ? '신선도 양호' : ''
      })
    }
    
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)
    const taxAmount = Math.floor(totalAmount * 0.1)
    
    try {
      await transactionAPI.create({
        transaction_date: getRandomDate(),
        transaction_type: isSales ? 'sales' : 'purchase',
        customer_id: customer.id!,
        customer_name: customer.name,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        notes: Math.random() > 0.8 ? '빠른 배송 요청' : '',
        items
      })
    } catch (error) {
      console.error(`거래 생성 실패: ${i + 1}번째`, error)
    }
    
    // 진행상황 로깅
    if ((i + 1) % Math.ceil(count / 10) === 0) {
      console.log(`진행: ${i + 1}/${count} 거래 생성 완료`)
    }
  }
  
  console.log(`✅ 거래 ${count}개 생성 완료`)
}

/**
 * 전체 테스트 데이터 생성
 */
export async function generateAllTestData(): Promise<void> {
  console.log('🚀 전체 테스트 데이터 생성 시작...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const startTime = Date.now()
  
  try {
    await generateTestCustomers(100)
    await generateTestProducts(150)
    await generateTestTransactions(200)
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✨ 모든 테스트 데이터 생성 완료!')
    console.log(`📊 총 데이터: 거래처 100개, 상품 150개, 거래 200개`)
    console.log(`⏱️ 소요 시간: ${elapsed}초`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (error) {
    console.error('❌ 테스트 데이터 생성 중 오류 발생:', error)
    throw error
  }
}
