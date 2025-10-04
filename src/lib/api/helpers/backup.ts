import { debounce } from '../../utils'
import { exportBackup, shouldBackupToday, isAutoBackupEnabled } from '../../backup'
import { isTauri } from './storage'

/**
 * 데이터 변경 시 자동 백업 트리거 (디바운스 적용)
 */
const triggerAutoBackup = debounce(async () => {
  // 브라우저 환경에서만 실행 (타우리는 향후 분리 처리)
  if (isTauri()) return
  
  // 자동 백업이 비활성화되어 있으면 스킵
  if (!isAutoBackupEnabled()) return
  
  // 오늘 이미 백업이 되었다면 스킵
  if (!shouldBackupToday()) return
  
  try {
    await exportBackup(true) // 자동 백업 플래그
  } catch (error) {
    console.error('자동 백업 실패:', error)
  }
}, 2000) // 2초 디바운스

/**
 * 모든 CRUD 작업 후 호출할 백업 트리거
 */
export const backupTrigger = {
  /**
   * 데이터 변경 시 자동 백업 트리거
   */
  trigger: () => {
    triggerAutoBackup()
  }
}
