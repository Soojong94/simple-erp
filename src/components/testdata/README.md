# 🧪 Test Data Components

개발 및 테스트를 위한 더미 데이터 생성 컴포넌트입니다.

## 📂 파일 구조

```
testdata/
└── TestDataSection.tsx    # 테스트 데이터 생성 UI 섹션
```

## 🎯 주요 컴포넌트

### TestDataSection.tsx

개발자 도구 섹션으로, 거래처/상품/거래 데이터를 대량 생성할 수 있는 UI를 제공합니다.

#### Props

```tsx
interface TestDataSectionProps {
  onGenerateCustomers: (count: number) => Promise<void>      // 거래처 생성
  onGenerateProducts: (count: number) => Promise<void>       // 상품 생성
  onGenerateTransactions: (count: number) => Promise<void>   // 거래 생성
  onGenerateAll: () => Promise<void>                         // 전체 생성
}
```

#### 주요 기능

1. **개별 데이터 생성**
   - 🏢 거래처: 1~500개 (기본 100개)
   - 📦 상품: 1~500개 (기본 150개)
   - 📊 거래: 1~1000개 (기본 200개)
   - 각 항목별 생성 개수 조정 가능

2. **일괄 데이터 생성**
   - 거래처 100개 + 상품 150개 + 거래 200개를 한번에 생성
   - 그라디언트 버튼으로 시각적 강조

3. **안전장치**
   - 생성 전 확인(confirm) 다이얼로그
   - 중복 실행 방지 (isGenerating 상태)
   - 경고 메시지 표시

#### 생성되는 데이터 특징

##### 거래처 (Customers)
- 고객과 공급업체 균등 생성
- 다양한 업체명, 사업자번호
- 대표자, 연락처, 주소 등 포함

##### 상품 (Products)
- 돼지고기, 소고기, 닭고기, 오리고기 카테고리별 생성
- 상품명, 상품코드
- 단가, 이력번호, 원산지, 도축장 정보 포함

##### 거래 (Transactions)
- 매출/매입 거래 균등 생성
- 각 거래당 1~5개의 상품 포함
- 최근 180일 내 랜덤 날짜 할당
- ⚠️ 거래처와 상품이 먼저 필요함

## 💡 사용 예시

```tsx
import TestDataSection from './components/testdata/TestDataSection'
import { 
  generateTestCustomers, 
  generateTestProducts, 
  generateTestTransactions 
} from './lib/testData'

function SettingsPage() {
  const handleGenerateAll = async () => {
    await generateTestCustomers(100)
    await generateTestProducts(150)
    await generateTestTransactions(200)
  }
  
  return (
    <div className="space-y-6">
      <TestDataSection
        onGenerateCustomers={generateTestCustomers}
        onGenerateProducts={generateTestProducts}
        onGenerateTransactions={generateTestTransactions}
        onGenerateAll={handleGenerateAll}
      />
    </div>
  )
}
```

## ⚠️ 주의사항

### 사용 시 유의점
1. **개발/테스트 목적으로만** 사용
2. **실제 데이터와 혼합**될 수 있으므로 주의
3. 생성 전 **백업 권장**
4. 생성된 데이터는 **수동 삭제** 필요

### 성능 고려사항
- 대량 데이터 생성 시 **수십 초~몇 분** 소요 가능
- 생성 중 UI 블로킹 (로딩 스피너 표시)
- 브라우저 환경에서는 메모리 제한 고려

## 🎨 UI 특징

### 경고 메시지
- 노란색 배경(bg-yellow-50)의 눈에 띄는 경고 섹션
- 아이콘과 함께 주의사항 리스트 표시

### 생성 버튼
- 각 데이터 타입별 색상 구분
  - 거래처: 파란색 (blue-600)
  - 상품: 초록색 (green-600)
  - 거래: 보라색 (purple-600)
  - 전체: 그라디언트 (blue-600 → purple-600)

### 로딩 상태
- 생성 중 버튼 비활성화
- 회전 스피너 애니메이션
- "생성 중..." 텍스트 표시

### 안내 정보
- 파란색 배경(bg-blue-50)의 정보 섹션
- 생성되는 데이터 상세 설명
- 예상 소요 시간 안내

## 🔧 의존성

- `generateTestCustomers()` - 거래처 생성 함수
- `generateTestProducts()` - 상품 생성 함수
- `generateTestTransactions()` - 거래 생성 함수

## 📋 향후 개선 사항

- [ ] 진행률 표시 (프로그레스 바)
- [ ] 생성 중 취소 기능
- [ ] 특정 날짜 범위 지정
- [ ] 특정 카테고리만 생성
- [ ] 생성된 데이터 일괄 삭제 기능
- [ ] 데이터 검증 및 중복 체크
- [ ] 백그라운드에서 생성 (Web Worker)
