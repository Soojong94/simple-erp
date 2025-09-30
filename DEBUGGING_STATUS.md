## 🐛 **현재 상태 요약**

### ✅ **완료된 작업**
1. **모듈화 완료** - `tauri.ts` 파일을 6개 모듈로 분리
2. **거래 삭제 시 미수금 복원 구현** - `transactionAPI.delete`
3. **UI 개선** - 수금 내역 섹션을 맨 마지막으로 이동

### 🔍 **확인 필요한 문제**

#### **문제 1: 최근 수금 내역이 안 보인다**

**쿼리 조건 확인:**
```typescript
const { data: recentPayments } = useQuery({
  queryKey: ['recent-payments', formData.customer_id],
  queryFn: async () => {
    if (!formData.customer_id) return []
    const allTransactions = await transactionAPI.getAll()
    return allTransactions.filter(t =>
      t.transaction_type === 'payment' &&      // payment 타입
      t.customer_id === formData.customer_id && // 해당 거래처
      !t.is_displayed_in_invoice                // 아직 거래증에 미표시
    ).sort((a, b) =>
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )
  },
  enabled: formData.customer_id > 0 && formData.transaction_type === 'sales'
})
```

**렌더링 조건:**
```typescript
{formData.transaction_type === 'sales' && recentPayments && recentPayments.length > 0 && (
  // UI 표시
)}
```

**디버깅 체크리스트:**
- [ ] `formData.transaction_type`이 `'sales'`인가?
- [ ] `formData.customer_id`가 0보다 큰가?
- [ ] `recentPayments` 배열에 데이터가 있는가?
- [ ] `payment` 타입 거래가 생성되어 있는가?

#### **문제 2: 무게 자동 로딩**

**현재 구현 상태:**
```typescript
// 이미 구현되어 있음!
const productUsageStats = useMemo(() => {
  // ...
  stats.set(item.product_id, {
    count: current.count + 1,
    lastUsed: isMoreRecent ? transaction.transaction_date : current.lastUsed,
    lastQuantity: isMoreRecent ? item.quantity : current.lastQuantity, // ✅
    lastUnitPrice: isMoreRecent ? item.unit_price : current.lastUnitPrice,
    lastTraceability: isMoreRecent ? (item.traceability_number || '') : current.lastTraceability
  })
}, [formData.customer_id, allTransactions])

// 상품 선택 시 자동 로딩
if (stats && stats.lastQuantity > 0) {
  updatedItems[index].quantity = stats.lastQuantity // ✅ 작동 중
}
```

### 🧪 **테스트 시나리오**

#### **최근 수금 내역 테스트:**
1. 거래처 "ABC마트" 선택
2. 거래 구분을 "💵 수금 처리"로 선택
3. 수금 금액 50,000원 입력
4. 거래 저장
5. **새 거래 추가** 클릭
6. 거래처 "ABC마트" 선택
7. 거래 구분 "💰 매출"로 선택
8. ✅ **최근 수금 내역이 보여야 함**

#### **무게 자동 로딩 테스트:**
1. 거래처 "ABC마트" 선택
2. 상품 "삼겹살" 20kg으로 거래 생성
3. 거래 저장
4. **새 거래 추가** 클릭
5. 거래처 "ABC마트" 선택
6. 상품 "삼겹살" 선택
7. ✅ **수량이 자동으로 20kg로 로딩되어야 함**

### 📝 **다음 액션**

**옵션 A: 디버깅 로그 추가**
- `recentPayments` 쿼리 결과 확인
- 콘솔에 데이터 출력

**옵션 B: 조건 완화**
- `is_displayed_in_invoice` 조건 제거
- 모든 payment 거래 표시

**옵션 C: UI 테스트**
- 실제로 payment 거래 생성 후 확인
- 데이터가 있는데 안 보이는지 확인

어떤 옵션으로 진행하시겠습니까?
