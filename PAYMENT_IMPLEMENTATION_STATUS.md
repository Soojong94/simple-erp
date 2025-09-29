# 💵 수금 처리 기능 구현 상태

## ✅ 완료된 작업

### 1. 타입 정의 ✅
- `Transaction` 및 `TransactionWithItems`에 `'payment'` 타입 추가
- `reference_payment_id`, `is_displayed_in_invoice`, `displayed_in_transaction_id` 필드 추가

### 2. UI 컴포넌트 ✅  
- `TransactionBasicInfo`: "수금 처리" 옵션 추가 + 수금 금액 입력 필드
- `TransactionModal`: 
  - `paymentAmount` 상태 추가
  - `recentPayments` 조회 기능 추가 (미표시된 수금만)
  - 최근 수금 선택 UI 추가
  - payment 타입일 때 상품 목록 숨김 처리 (진행 중)

### 3. 백엔드 로직 ✅
- `tauri.ts`:
  - 매출 거래: 미수금 증가
  - **수금 처리: 미수금 감소** (신규 추가)
  - 수금 거래 참조 연결 (reference_payment_id 업데이트)

## 🚧 진행 중

### TransactionModal 조건부 렌더링
- payment 타입일 때 상품 목록 숨기기
- payment 타입일 때 간단한 요약만 표시

## 📋 다음 단계

1. **UI 완성**
   - payment 타입일 때 상품 섹션 완전히 숨김
   - 수금 요약 카드 표시

2. **테스트**
   - 수금 처리 거래 생성 → 미수금 감소 확인
   - 다음 매출 거래에서 수금 선택 → 거래증에 표시 확인

3. **거래증 출력**
   - 수금 거래증 템플릿 (상품 없음, 입금 정보만)
   - 매출 거래증에서 참조된 수금 정보 표시

## 🎯 최종 워크플로우

```
1. 수금 처리 (payment 타입 거래 생성)
   - 거래처 선택
   - 거래 유형: "수금 처리" 선택
   - 수금 금액 입력
   - 저장 → 미수금 자동 감소

2. 다음 매출 거래 생성
   - 거래처 선택
   - "최근 수금 내역" 섹션에 표시됨
   - 원하는 수금 체크박스 선택
   - 거래 저장 → 수금이 해당 거래에 연결됨

3. 거래증 출력
   - 선택한 수금 정보가 거래증에 함께 표시됨
   - 입금일, 입금 금액 표시
```
