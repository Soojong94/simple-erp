import Papa from 'papaparse'
import type { Customer, Product, TransactionWithItems } from '../../types'

// CSV 파싱 옵션
const CSV_PARSE_OPTIONS = {
  header: true,
  skipEmptyLines: true,
  encoding: 'UTF-8',
  transformHeader: (header: string) => header.trim()
}

// CSV 생성 옵션  
const CSV_STRINGIFY_OPTIONS = {
  header: true,
  encoding: 'utf-8'
}

/**
 * 거래처 CSV 가져오기 (한국어 컬럼명 지원)
 */
export const importCustomersFromCSV = (csvContent: string): Promise<Customer[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      ...CSV_PARSE_OPTIONS,
      complete: (results) => {
        try {
          const customers: Customer[] = results.data.map((row: any, index: number) => {
            // 한국어/영어 컬럼명 매핑
            const getName = () => row['거래처명'] || row['name'] || row['거래처이름']
            const getType = () => row['거래처구분'] || row['type'] || row['구분']
            const getBusinessNumber = () => row['사업자번호'] || row['business_number'] || row['사업자등록번호']
            const getCeoName = () => row['대표자명'] || row['ceo_name'] || row['대표자']
            const getAddress = () => row['주소'] || row['address']
            const getPhone = () => row['전화번호'] || row['phone'] || row['연락처']
            const getEmail = () => row['이메일'] || row['email'] || row['메일']
            const getContactPerson = () => row['담당자'] || row['contact_person'] || row['담당자명']
            const getIsActive = () => row['활성상태'] || row['is_active'] || row['상태']

            // 필수 필드 검증
            const name = getName()
            if (!name || typeof name !== 'string' || name.trim() === '') {
              throw new Error(`${index + 1}행: 거래처명이 필요합니다`)
            }

            // 타입 검증 (한국어도 지원)
            const typeValue = getType()?.toLowerCase().trim()
            let type: 'customer' | 'supplier'
            
            if (typeValue === 'customer' || typeValue === '고객' || typeValue === '거래처') {
              type = 'customer'
            } else if (typeValue === 'supplier' || typeValue === '공급업체' || typeValue === '업체') {
              type = 'supplier'
            } else {
              throw new Error(`${index + 1}행: 거래처구분은 '고객', '공급업체', 'customer', 'supplier' 중 하나여야 합니다`)
            }

            // 활성 상태 처리 (한국어도 지원)
            const activeValue = getIsActive()
            let is_active = true
            if (activeValue === 'false' || activeValue === '비활성' || activeValue === 'N' || activeValue === '0') {
              is_active = false
            }

            return {
              name: name.trim(),
              business_number: getBusinessNumber()?.trim() || '',
              ceo_name: getCeoName()?.trim() || '',
              address: getAddress()?.trim() || '',
              phone: getPhone()?.trim() || '',
              email: getEmail()?.trim() || '',
              type,
              contact_person: getContactPerson()?.trim() || '',
              is_active
            }
          })

          if (customers.length === 0) {
            throw new Error('가져올 거래처 데이터가 없습니다')
          }

          resolve(customers)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`CSV 파싱 오류: ${error.message}`))
      }
    })
  })
}

/**
 * 거래처 CSV 내보내기 (한국어 컬럼명)
 */
export const exportCustomersToCSV = (customers: Customer[]): string => {
  const csvData = customers.map(customer => ({
    '거래처명': customer.name,
    '사업자번호': customer.business_number || '',
    '대표자명': customer.ceo_name || '',
    '주소': customer.address || '',
    '전화번호': customer.phone || '',
    '이메일': customer.email || '',
    '거래처구분': customer.type === 'customer' ? '고객' : '공급업체',
    '담당자': customer.contact_person || '',
    '활성상태': customer.is_active ? '활성' : '비활성',
    '등록일': customer.created_at || ''
  }))

  return Papa.unparse(csvData, CSV_STRINGIFY_OPTIONS)
}

/**
 * 상품 CSV 가져오기 (한국어 컬럼명 지원)
 */
export const importProductsFromCSV = (csvContent: string): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      ...CSV_PARSE_OPTIONS,
      complete: (results) => {
        try {
          const products: Product[] = results.data.map((row: any, index: number) => {
            // 한국어/영어 컬럼명 매핑
            const getName = () => row['상품명'] || row['name'] || row['제품명']
            const getCode = () => row['상품코드'] || row['code'] || row['코드']
            const getCategory = () => row['카테고리'] || row['category'] || row['분류']
            const getUnit = () => row['단위'] || row['unit']
            const getUnitPrice = () => row['단가'] || row['unit_price'] || row['가격'] || row['참고가격']
            const getDescription = () => row['설명'] || row['description'] || row['상품설명']
            const getIsActive = () => row['활성상태'] || row['is_active'] || row['상태']
            const getTraceability = () => row['이력번호'] || row['traceability_number']
            const getOrigin = () => row['원산지'] || row['origin']
            const getSlaughterhouse = () => row['도축장'] || row['slaughterhouse']

            // 필수 필드 검증
            const name = getName()
            if (!name || typeof name !== 'string' || name.trim() === '') {
              throw new Error(`${index + 1}행: 상품명이 필요합니다`)
            }

            const unit = getUnit()
            if (!unit || typeof unit !== 'string' || unit.trim() === '') {
              throw new Error(`${index + 1}행: 단위가 필요합니다`)
            }

            // 단가 검증
            let unit_price: number | undefined
            const priceValue = getUnitPrice()
            if (priceValue && priceValue !== '') {
              unit_price = parseFloat(priceValue)
              if (isNaN(unit_price) || unit_price < 0) {
                throw new Error(`${index + 1}행: 단가는 0 이상의 숫자여야 합니다`)
              }
            }

            // 활성 상태 처리
            const activeValue = getIsActive()
            let is_active = true
            if (activeValue === 'false' || activeValue === '비활성' || activeValue === 'N' || activeValue === '0') {
              is_active = false
            }

            return {
              name: name.trim(),
              code: getCode()?.trim() || '',
              category: getCategory()?.trim() || '',
              unit: unit.trim(),
              unit_price,
              description: getDescription()?.trim() || '',
              traceability_number: getTraceability()?.trim() || '',
              origin: getOrigin()?.trim() || '',           // ✅ 추가
              slaughterhouse: getSlaughterhouse()?.trim() || '',  // ✅ 추가
              is_active
            }
          })

          if (products.length === 0) {
            throw new Error('가져올 상품 데이터가 없습니다')
          }

          resolve(products)
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`CSV 파싱 오류: ${error.message}`))
      }
    })
  })
}

/**
 * 상품 CSV 내보내기 (한국어 컬럼명)
 */
// 📍 exportProductsToCSV 함수 수정
export const exportProductsToCSV = (products: Product[]): string => {
  const csvData = products.map(product => ({
    '상품명': product.name,
    '상품코드': product.code || '',
    '카테고리': product.category || '',
    '단위': product.unit,
    '단가': product.unit_price || '',
    '이력번호': product.traceability_number || '',
    '원산지': product.origin || '',           // ✅ 추가
    '도축장': product.slaughterhouse || '',    // ✅ 추가
    '설명': product.description || '',
    '활성상태': product.is_active ? '활성' : '비활성',
    '등록일': product.created_at || ''
  }))

  return Papa.unparse(csvData, CSV_STRINGIFY_OPTIONS)
}

/**
 * 거래 CSV 내보내기 (한국어 컬럼명)
 */
export const exportTransactionsToCSV = (transactions: TransactionWithItems[]): string => {
  const csvData: any[] = []

  transactions.forEach(transaction => {
    if (transaction.items && transaction.items.length > 0) {
      // 거래 상품별로 행 생성
      transaction.items.forEach(item => {
        // 📍 exportTransactionsToCSV 함수의 csvData.push 부분 수정
            csvData.push({
              '거래번호': transaction.id,
              '거래일': transaction.transaction_date,
              '거래구분': transaction.transaction_type === 'sales' ? '매출' : '매입',
              '거래처명': transaction.customer_name,
              '상태': transaction.status === 'confirmed' ? '확정' :
                      transaction.status === 'draft' ? '임시저장' : '취소',
              '상품명': item.product_name,
              '수량': item.quantity,
              '단위': item.unit,
              '단가': item.unit_price,
              '금액': item.total_price,
              '이력번호': item.traceability_number || '',
              '원산지': item.origin || '',                // ✅ 추가
              '도축장': item.slaughterhouse || '',         // ✅ 추가
              '거래총액': transaction.total_amount,
              '세금': transaction.tax_amount,
              '비고': transaction.notes || '',
              '상품비고': item.notes || ''
            })
      })
    } else {
      // 상품이 없는 거래는 기본 정보만 내보내기
      csvData.push({
        '거래번호': transaction.id,
        '거래일': transaction.transaction_date,
        '거래구분': transaction.transaction_type === 'sales' ? '매출' : '매입',
        '거래처명': transaction.customer_name,
        '상태': transaction.status === 'confirmed' ? '확정' :
                transaction.status === 'draft' ? '임시저장' : '취소',
        '상품명': '',
        '수량': '',
        '단위': '',
        '단가': '',
        '금액': '',
        '이력번호': '',
        '거래총액': transaction.total_amount,
        '세금': transaction.tax_amount,
        '비고': transaction.notes || '',
        '상품비고': ''
      })
    }
  })

  return Papa.unparse(csvData, CSV_STRINGIFY_OPTIONS)
}

/**
 * 파일 다운로드 헬퍼
 */
export const downloadCSV = (csvContent: string, filename: string) => {
  // BOM 추가로 한글 깨짐 방지
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * CSV 템플릿 생성 (한국어 컬럼명)
 */
export const generateCustomerCSVTemplate = (): string => {
  const template = [{
    '거래처명': '삼성식품',
    '사업자번호': '123-45-67890',
    '대표자명': '김대표',
    '주소': '서울시 강남구 테헤란로 123',
    '전화번호': '02-1234-5678',
    '이메일': 'contact@samsung-food.co.kr',
    '거래처구분': '고객',
    '담당자': '박담당',
    '활성상태': '활성'
  }]
  
  return Papa.unparse(template, CSV_STRINGIFY_OPTIONS)
}

// 📍 generateProductCSVTemplate 함수 수정
export const generateProductCSVTemplate = (): string => {
  const template = [{
    '상품명': '한돈 삼겹살',
    '상품코드': 'PORK-001',
    '카테고리': '돼지고기',
    '단위': 'kg',
    '단가': 15000,
    '이력번호': '250101-001-ABC',    // ✅ 추가
    '원산지': '국내산(충청)',         // ✅ 추가
    '도축장': 'OO육가공센터',         // ✅ 추가
    '설명': '신선한 국내산 돼지 삼겹살',
    '활성상태': '활성'
  }]
  
  return Papa.unparse(template, CSV_STRINGIFY_OPTIONS)
}
