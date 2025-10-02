# Modals Components

✅ **실제 사용 중** - Customers, Products, Transactions 페이지에서 활용

CRUD 작업을 위한 모달 대화상자 컴포넌트 모음

## 📌 사용 위치

**Customers.tsx**
```typescript
import CustomerModal from '../components/modals/CustomerModal'
```

**Products.tsx**
```typescript
import ProductModal from '../components/modals/ProductModal'
```

**Transactions.tsx**
```typescript
import TransactionModal from '../components/modals/TransactionModal'
```

---

## 📋 파일 목록

### 1. CustomerModal.tsx ✅ 사용 중
**역할**: 거래처 추가/수정 모달

**기능**
- 거래처 생성
- 거래처 수정
- 필수 필드 검증
- React Query mutation

### 2. ProductModal.tsx ✅ 사용 중
**역할**: 상품 추가/수정 모달

**기능**
- 상품 생성
- 상품 수정
- 카테고리 선택
- 필수 필드 검증

### 3. TransactionModal.tsx ✅ 사용 중
**역할**: 거래 추가/수정 모달

**기능**
- 거래 생성/수정
- 상품 목록 관리
- 거래처 선택
- 금액 자동 계산

**하위 컴포넌트 사용**
- `TransactionBasicInfo` - 기본 정보 입력
- `TransactionItemsList` - 상품 목록 관리
- `TransactionSummary` - 금액 요약
- `ProductDropdown` - 상품 선택 드롭다운
- `CustomerSelectionPanel` - 거래처 선택 패널

### 4. TransactionBasicInfo.tsx ✅ 사용 중
**역할**: 거래 기본 정보 입력 섹션

**입력 필드**
- 거래 유형 (매출/매입)
- 거래 날짜
- 거래처 선택
- 메모

### 5. TransactionItemsList.tsx ✅ 사용 중
**역할**: 거래 상품 목록 관리

**기능**
- 상품 추가
- 상품 삭제
- 수량/단가 입력
- 금액 계산

### 6. TransactionSummary.tsx ✅ 사용 중
**역할**: 거래 금액 요약 표시

**표시 항목**
- 총 수량
- 총 금액
- 부가세 (선택)

### 7. ProductDropdown.tsx ✅ 사용 중
**역할**: 상품 선택 커스텀 드롭다운

**기능**
- 상품 검색
- 카테고리 필터
- 최근 사용 상품 표시

### 8. CustomerSelectionPanel.tsx ✅ 사용 중
**역할**: 거래처 선택 패널

**기능**
- 거래처 검색
- 타입별 필터 (고객/공급업체)
- 최근 거래처 표시

### 9. TransactionModal_backup.tsx ⚠️ 백업 파일
**역할**: TransactionModal의 이전 버전 백업

**상태**: 미사용 (삭제 가능)

---

## 🔄 공통 패턴

### 모달 구조
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  item?: T  // 수정 시 전달
}

// 생성 모드: item이 undefined
// 수정 모드: item이 존재
```

### Form 처리
```typescript
const [formData, setFormData] = useState<T>({...})

const mutation = useMutation({
  mutationFn: (data) => {
    if (editingItem) {
      return api.update(editingItem.id, data)
    } else {
      return api.create(data)
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['...'] })
    onClose()
  }
})
```

### UI 레이아웃
```jsx
<div className="fixed inset-0 z-50 overflow-y-auto">
  {/* 배경 오버레이 */}
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
  
  {/* 모달 콘텐츠 */}
  <div className="inline-block transform overflow-hidden rounded-lg bg-white">
    {/* 헤더 */}
    <div className="bg-white px-4 pt-5 pb-4">
      <h3>제목</h3>
    </div>
    
    {/* 본문 */}
    <form onSubmit={handleSubmit}>
      {/* 입력 필드들 */}
    </form>
    
    {/* 푸터 */}
    <div className="bg-gray-50 px-4 py-3">
      <button type="submit">저장</button>
      <button type="button" onClick={onClose}>취소</button>
    </div>
  </div>
</div>
```

---

## 💡 사용 예시

### Customers 페이지
```typescript
import CustomerModal from '../components/modals/CustomerModal'

function Customers() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(undefined)
  
  return (
    <>
      <button onClick={() => {
        setEditingCustomer(undefined)
        setIsModalOpen(true)
      }}>
        거래처 추가
      </button>
      
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
      />
    </>
  )
}
```

---

## 🎯 주요 특징

### 1. 모듈화된 구조
- TransactionModal은 여러 하위 컴포넌트로 분리
- 재사용성 증가
- 유지보수 용이

### 2. 생성/수정 통합
- 하나의 모달로 생성과 수정 모두 처리
- item prop 유무로 모드 구분

### 3. 실시간 검증
- 필수 필드 검증
- 형식 검증
- 에러 메시지 표시

### 4. 자동 계산
- TransactionModal: 총 금액 자동 계산
- 수량 × 단가 = 금액

### 5. React Query 통합
- mutation으로 API 호출
- 성공 시 쿼리 무효화
- 자동 리페치

---

## 🔧 의존성

### 외부 라이브러리
```typescript
import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
```

### 내부 모듈
```typescript
import { customerAPI, productAPI, transactionAPI } from '../lib/tauri'
import type { Customer, Product, Transaction } from '../types'
```

---

## ⚠️ 주의사항

1. **TransactionModal_backup.tsx**
   - 백업 파일로 현재 미사용
   - 삭제 고려

2. **모달 닫기**
   - 저장 후 자동으로 닫힘
   - 취소 버튼으로 닫기
   - 배경 클릭으로 닫기

3. **데이터 초기화**
   - 모달 닫을 때 formData 초기화
   - editingItem undefined로 설정

4. **유효성 검증**
   - HTML5 required 속성 사용
   - 추가 검증 로직

---

## 📝 개선 아이디어

1. **모달 애니메이션**
   - 열기/닫기 부드러운 전환
   - fade in/out

2. **키보드 단축키**
   - ESC: 닫기
   - Ctrl+S: 저장

3. **자동 포커스**
   - 모달 열릴 때 첫 입력 필드 포커스

4. **더티 체크**
   - 수정 사항 있을 때 닫기 확인

5. **에러 처리 개선**
   - 필드별 에러 메시지
   - 인라인 검증

6. **로딩 상태**
   - 저장 중 버튼 비활성화
   - 스피너 표시

---

## 🐛 알려진 이슈

1. **TransactionModal_backup.tsx**
   - 백업 파일이 프로젝트에 포함
   - 버전 관리 시스템 사용 권장
   - 삭제 고려

2. **모달 중첩**
   - 모달 안에 또 다른 모달 열면 z-index 문제
   - 현재는 발생 안 함

3. **스크롤**
   - 긴 폼의 경우 모달 내부 스크롤
   - 모바일에서 확인 필요
