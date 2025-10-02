# ⚙️ System Components

시스템 정보 및 환경 설정 관련 컴포넌트입니다.

## 📂 파일 구조

```
system/
└── SystemInfoSection.tsx    # 시스템 정보 표시 섹션
```

## 🎯 주요 컴포넌트

### SystemInfoSection.tsx

애플리케이션의 시스템 정보를 표시하는 컴포넌트입니다. 설정(Settings) 페이지에서 사용됩니다.

#### Props

```tsx
interface SystemInfoSectionProps {
  backupSettings: BackupSettings  // 백업 설정 정보
}
```

#### 표시 정보

1. **앱 버전**
   - 현재 애플리케이션 버전 (Simple ERP v1.0)

2. **데이터 저장소**
   - Tauri 환경: "SQLite + localStorage"
   - 브라우저 환경: "localStorage (브라우저)"

3. **백업 위치**
   - Tauri 환경: 사용자 지정 폴더 또는 다운로드 폴더
   - 브라우저 환경: 브라우저 다운로드 폴더

4. **실행 환경**
   - Tauri 환경: "Tauri Desktop App"
   - 브라우저 환경: "Web Browser (Development)"

#### 사용 팁 섹션

사용자에게 유용한 정보 제공:
- 백업 폴더 지정 방법
- 백업 파일 관리 주의사항
- 데이터 변경 전 백업 권장사항
- Tauri 전용 기능 안내 (조건부 표시)

## 💡 사용 예시

```tsx
import SystemInfoSection from './components/system/SystemInfoSection'
import { getBackupSettings } from './lib/backup'

function SettingsPage() {
  const backupSettings = getBackupSettings()
  
  return (
    <div className="space-y-6">
      <SystemInfoSection backupSettings={backupSettings} />
      {/* 다른 설정 섹션들... */}
    </div>
  )
}
```

## 🔧 의존성

- `isTauriEnvironment()` - Tauri 환경 감지 유틸리티
- `BackupSettings` - 백업 설정 타입 정의

## 🎨 스타일 특징

- **카드 레이아웃**: 흰색 배경, 그림자, 둥근 모서리
- **정보 구분**: 각 항목별 하단 테두리
- **팁 섹션**: 회색 배경(bg-gray-50)으로 구분
- **반응형 패딩**: sm 브레이크포인트 대응

## 📋 향후 개선 사항

- [ ] 데이터베이스 용량 표시
- [ ] 마지막 백업 시간 표시
- [ ] 앱 업데이트 체크 기능
- [ ] 시스템 리소스 사용량 모니터링
- [ ] 데이터 무결성 검증 상태
