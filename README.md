# Simple ERP

중소기업용 무료 로컬 ERP 시스템

## 주요 특징

- 완전 무료 사용 (월 구독료 없음)
- 로컬 실행 (인터넷 연결 불필요)
- 경량 실행파일 (5MB 이하)
- 한국 비즈니스 환경 최적화

## 기능

- 거래처 관리 (고객/공급업체)
- 상품 관리
- 매출/매입 거래 관리
- 거래증명서/세금계산서 발행
- 기본 보고서 및 통계

## 기술 스택

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Rust (Tauri Framework)
- **Database**: SQLite (로컬 파일)
- **UI**: shadcn/ui 컴포넌트

## 설치 및 실행

### 개발 환경 설정

```bash
# 프로젝트 클론
git clone <repository-url>
cd simple-erp

# 의존성 설치
npm install

# 개발 서버 실행
npm run tauri:dev
```

### 프로덕션 빌드

```bash
# 실행 파일 생성
npm run tauri:build
```

## 프로젝트 구조

```
simple-erp/
├── src/                    # React 프론트엔드
│   ├── components/         # 재사용 컴포넌트
│   ├── pages/             # 페이지 컴포넌트
│   ├── lib/               # API 및 유틸리티
│   └── types/             # TypeScript 타입
├── src-tauri/             # Rust 백엔드
│   ├── src/               # Rust 소스코드
│   └── migrations/        # DB 마이그레이션
├── data/                  # SQLite 데이터베이스 저장소
└── invoices/              # PDF 문서 저장소
```

## 시스템 요구사항

- Windows 10+ / macOS 10.15+ / Linux
- 메모리: 최소 512MB
- 디스크: 50MB 여유공간

## 라이선스

MIT License
