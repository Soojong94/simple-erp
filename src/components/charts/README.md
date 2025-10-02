# Charts Components

Recharts 라이브러리 기반 데이터 시각화 차트 컴포넌트 모음

## 📋 파일 목록

### 1. MonthlySalesChart.tsx
**역할**: 월별 매출/매입/수익 추이를 보여주는 라인 차트

**기능**
- 월별 매출, 매입, 수익 데이터를 꺾은선 그래프로 표시
- 세 가지 지표를 동시에 비교 가능
- 로딩 상태 처리 (스피너 표시)
- 반응형 디자인

**Props**
```typescript
interface MonthlySalesChartProps {
  data: MonthlyDataPoint[]   // 월별 데이터 배열
  isLoading: boolean         // 로딩 상태
}

interface MonthlyDataPoint {
  month: string    // "2024-01" 형식
  매출: number
  매입: number
  수익: number
}
```

**차트 특징**
- **매출**: 녹색 선 (굵기 3, 점 크기 4)
- **매입**: 빨간색 선 (굵기 2, 점 크기 3)
- **수익**: 남색 점선 (굵기 2, 점 크기 3, 대시 패턴)
- Y축: 백만원 단위 표시 (₩XM)
- 툴팁: 전체 금액을 formatCurrency로 표시

**사용 예시**
```typescript
<MonthlySalesChart 
  data={[
    { month: '2024-01', 매출: 5000000, 매입: 3000000, 수익: 2000000 },
    { month: '2024-02', 매출: 6000000, 매입: 3500000, 수익: 2500000 }
  ]}
  isLoading={false}
/>
```

---

### 2. CustomerSalesPieChart.tsx
**역할**: 거래처별 매출 비중을 보여주는 파이 차트

**기능**
- 상위 거래처별 매출 비중을 도넛 차트로 표시
- 각 거래처의 비율을 퍼센트로 표시
- 범례에서 정확한 금액 확인 가능
- 로딩 및 빈 데이터 상태 처리

**Props**
```typescript
interface CustomerSalesPieChartProps {
  data: CustomerSalesData[]   // 거래처 매출 데이터
  isLoading: boolean          // 로딩 상태
}

interface CustomerSalesData {
  name: string     // 거래처명
  value: number    // 매출액
  color: string    // 차트 색상 (hex)
}
```

**차트 특징**
- 도넛 차트 형태 (innerRadius: 60, outerRadius: 100)
- 각 섹터에 거래처명 + 비율(%) 표시
- 섹터 간 5도 간격
- 툴팁에 정확한 금액 표시
- 하단에 색상 범례 + 금액 리스트

**상태별 UI**
- 로딩 중: 스피너 표시
- 데이터 없음: 📊 아이콘 + "매출 데이터가 없습니다" 메시지
- 데이터 있음: 차트 + 범례

**사용 예시**
```typescript
<CustomerSalesPieChart 
  data={[
    { name: '신선마트', value: 5000000, color: '#3b82f6' },
    { name: '대박식당', value: 3000000, color: '#10b981' },
    { name: '건강식품점', value: 2000000, color: '#f59e0b' }
  ]}
  isLoading={false}
/>
```

---

### 3. CategorySalesBarChart.tsx
**역할**: 상품 카테고리별 판매량을 보여주는 막대 차트

**기능**
- 카테고리별 총 판매량(kg)을 막대 그래프로 표시
- 카테고리별 이모지 표시
- 데이터 없을 시 렌더링 하지 않음

**Props**
```typescript
interface CategorySalesBarChartProps {
  data: CategoryData[]   // 카테고리 판매 데이터
  isLoading: boolean     // 로딩 상태
}

interface CategoryData {
  category: string   // 카테고리명 (예: "소고기")
  quantity: number   // 판매량 (kg)
  emoji: string      // 이모지 (예: "🥩")
}
```

**차트 특징**
- X축: 카테고리명 (이모지 + 이름)
- Y축: 판매량 (kg 단위)
- 막대 색상: 주황색 (#f59e0b)
- 상단 모서리 둥글게 처리
- 툴팁: 판매량 + "kg" 표시

**사용 예시**
```typescript
<CategorySalesBarChart 
  data={[
    { category: '소고기', quantity: 150, emoji: '🥩' },
    { category: '돼지고기', quantity: 200, emoji: '🥓' },
    { category: '닭고기', quantity: 120, emoji: '🍗' }
  ]}
  isLoading={false}
/>
```

---

## 🎨 공통 디자인 패턴

### 레이아웃
```jsx
<div className="bg-white shadow rounded-lg p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    {이모지} {제목}
  </h3>
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      {/* 차트 컴포넌트 */}
    </ResponsiveContainer>
  </div>
</div>
```

### 툴팁 스타일
```typescript
contentStyle={{ 
  backgroundColor: '#fff', 
  border: '1px solid #e5e7eb' 
}}
```

### 로딩 스피너
```jsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
```

---

## 📊 차트 비교

| 차트 | 용도 | 데이터 형식 | 주요 시각화 |
|------|------|------------|------------|
| MonthlySalesChart | 시간에 따른 추이 | 월별 숫자 | 라인 차트 |
| CustomerSalesPieChart | 구성 비율 | 거래처별 금액 | 도넛 차트 + 범례 |
| CategorySalesBarChart | 카테고리 비교 | 카테고리별 수량 | 막대 차트 |

---

## 🔧 의존성

### Recharts
```typescript
import {
  LineChart, Line,
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
```

### 유틸리티
```typescript
import { formatCurrency } from '../../lib/utils'
```

---

## 💡 사용처

### Dashboard.tsx
```typescript
import MonthlySalesChart from '@/components/charts/MonthlySalesChart'
import CustomerSalesPieChart from '@/components/charts/CustomerSalesPieChart'
import CategorySalesBarChart from '@/components/charts/CategorySalesBarChart'

function Dashboard() {
  const { monthlyData, customerData, categoryData, isLoading } = useChartData()
  
  return (
    <div className="space-y-6">
      <MonthlySalesChart data={monthlyData} isLoading={isLoading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerSalesPieChart data={customerData} isLoading={isLoading} />
        <CategorySalesBarChart data={categoryData} isLoading={isLoading} />
      </div>
    </div>
  )
}
```

---

## 🎯 차트 커스터마이징 가이드

### 색상 변경
```typescript
// 라인 차트
<Line dataKey="매출" stroke="#custom-color" />

// 파이 차트
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

// 막대 차트
<Bar dataKey="quantity" fill="#custom-color" />
```

### 툴팁 커스터마이징
```typescript
<Tooltip 
  formatter={(value, name) => [formatValue(value), customName]}
  labelFormatter={(label) => customLabel}
  contentStyle={{ /* 커스텀 스타일 */ }}
/>
```

### 크기 조정
```typescript
// 차트 높이 변경
<div className="h-96"> {/* h-64 대신 h-96 */}
  <ResponsiveContainer width="100%" height="100%">
```

### 애니메이션 추가
```typescript
<Line 
  dataKey="매출" 
  stroke="#10b981"
  animationDuration={1000}
  animationEasing="ease-in-out"
/>
```

---

## 📝 개선 아이디어

1. **인터랙티브 필터링**
   - 범례 클릭으로 데이터 시리즈 토글
   - 기간 선택 기능

2. **데이터 내보내기**
   - 차트를 이미지로 저장
   - CSV 내보내기

3. **비교 모드**
   - 전년 대비 비교
   - 목표 대비 실적 표시

4. **드릴다운**
   - 월별 데이터를 클릭하면 일별 데이터 표시
   - 거래처 클릭 시 상세 정보

5. **테마 지원**
   - 다크 모드 차트 색상
   - 사용자 정의 색상 팔레트

6. **성능 최적화**
   - 대용량 데이터 가상화
   - 차트 메모이제이션

---

## 🚨 주의사항

1. **데이터 형식**
   - 날짜는 일관된 형식 사용 (YYYY-MM)
   - 숫자는 number 타입 보장

2. **빈 데이터 처리**
   - 데이터 없을 시 적절한 메시지 표시
   - null/undefined 체크

3. **성능**
   - 데이터 포인트가 많을 경우 샘플링 고려
   - ResponsiveContainer 사용으로 리렌더링 최소화

4. **접근성**
   - 색상만으로 정보 전달하지 않기
   - 범례 제공

5. **모바일 대응**
   - 작은 화면에서 레이블 겹침 주의
   - 터치 인터랙션 고려
