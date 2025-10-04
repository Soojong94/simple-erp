import { useQuery, useQueryClient } from '@tanstack/react-query'
import { companyAPI } from '../lib/tauri'
import { useState, useEffect, useRef } from 'react'
import { 
  exportBackup, 
  importBackup, 
  restoreBackupData, 
  isAutoBackupEnabled, 
  setAutoBackupEnabled,
  getBackupSettings,
  setBackupSettings,
  selectBackupFolder,
  listBackupFiles,
  deleteBackupFile,
  openBackupFolderInExplorer,
  isTauriEnvironment,
  deleteAllData,
  type BackupSettings,
  type BackupFileInfo
} from '../lib/backup'
import { deleteAccount } from '../lib/auth/index'

// 컴포넌트 imports
import BackupMessage from '../components/backup/BackupMessage'
import BackupSection from '../components/backup/BackupSection'
import CompanyInfoSection from '../components/company/CompanyInfoSection'
import SystemInfoSection from '../components/system/SystemInfoSection'
import TestDataSection from '../components/testdata/TestDataSection'

// 테스트 데이터 생성 함수
import {
  generateTestCustomers,
  generateTestProducts,
  generateTestTransactions,
  generateAllTestData
} from '../lib/csv/testDataGenerator'

type TabType = 'company' | 'backup' | 'system' | 'testdata' | 'account'

export default function Settings() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<TabType>('company')
  
  // 백업 상태
  const [backupStatus, setBackupStatus] = useState<{
    isBackingUp: boolean
    isRestoring: boolean
    isLoadingFiles: boolean
    autoBackupEnabled: boolean
    settings: BackupSettings
    backupFiles: BackupFileInfo[]
    message: string
    messageType: 'success' | 'error' | 'info' | null
  }>(() => {
    // 🔥 안전하게 초기화
    try {
      return {
        isBackingUp: false,
        isRestoring: false,
        isLoadingFiles: false,
        autoBackupEnabled: isAutoBackupEnabled(),
        settings: getBackupSettings(),
        backupFiles: [],
        message: '',
        messageType: null
      }
    } catch (error) {
      console.error('백업 상태 초기화 실패:', error)
      return {
        isBackingUp: false,
        isRestoring: false,
        isLoadingFiles: false,
        autoBackupEnabled: true,
        settings: { enabled: true, backupPath: '' },
        backupFiles: [],
        message: '',
        messageType: null
      }
    }
  })

  // 데이터 쿼리들
  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyAPI.get()
  })



  // 백업 파일 목록 로드
  useEffect(() => {
    if (isTauriEnvironment() && backupStatus.settings.backupPath) {
      loadBackupFiles()
    }
  }, [backupStatus.settings.backupPath])

  // 백업 상태 업데이트 함수
  const showMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setBackupStatus(prev => ({ ...prev, message, messageType: type }))
    setTimeout(() => {
      setBackupStatus(prev => ({ ...prev, message: '', messageType: null }))
    }, 5000)
  }

  // 백업 파일 목록 로드
  const loadBackupFiles = async () => {
    if (!backupStatus.settings.backupPath) return

    setBackupStatus(prev => ({ ...prev, isLoadingFiles: true }))
    try {
      const files = await listBackupFiles(backupStatus.settings.backupPath)
      setBackupStatus(prev => ({ ...prev, backupFiles: files }))
    } catch (error) {
      console.error('백업 파일 목록 로드 실패:', error)
      showMessage('백업 파일 목록을 불러올 수 없습니다.', 'error')
    } finally {
      setBackupStatus(prev => ({ ...prev, isLoadingFiles: false }))
    }
  }

  // 백업 폴더 선택
  const handleSelectBackupFolder = async () => {
    try {
      const selectedPath = await selectBackupFolder()
      if (selectedPath) {
        const newSettings = { 
          ...backupStatus.settings, 
          backupPath: selectedPath 
        }
        setBackupSettings(newSettings)
        setBackupStatus(prev => ({ ...prev, settings: newSettings }))
        showMessage(`백업 폴더가 설정되었습니다: ${selectedPath}`, 'success')
      }
    } catch (error) {
      console.error('백업 폴더 선택 실패:', error)
      showMessage('백업 폴더 선택 중 오류가 발생했습니다.', 'error')
    }
  }

  // 수동 백업
  const handleManualBackup = async () => {
    setBackupStatus(prev => ({ ...prev, isBackingUp: true }))
    
    try {
      const success = await exportBackup(false)
      if (success) {
        if (isTauriEnvironment() && backupStatus.settings.backupPath) {
          showMessage('백업이 완료되었습니다. 설정된 폴더에 저장되었습니다.', 'success')
          await loadBackupFiles()
        } else {
          showMessage('백업이 완료되었습니다. 다운로드 폴더를 확인하세요.', 'success')
        }
      } else {
        showMessage('백업 실패: 파일 생성 중 오류가 발생했습니다.', 'error')
      }
    } catch (error) {
      console.error('Manual backup error:', error)
      showMessage('백업 중 오류가 발생했습니다.', 'error')
    } finally {
      setBackupStatus(prev => ({ ...prev, isBackingUp: false }))
    }
  }

  // 백업 복원
  const handleRestoreBackup = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      showMessage('JSON 파일만 업로드 가능합니다.', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage('파일 크기가 너무 큽니다. (최대 10MB)', 'error')
      return
    }

    setBackupStatus(prev => ({ ...prev, isRestoring: true }))

    try {

      const result = await importBackup(file)

      if (!result.success || !result.data) {
        console.error('❌ [SETTINGS] 백업 파일 읽기 실패:', result.error)
        showMessage(result.error || '백업 파일을 읽을 수 없습니다.', 'error')
        return
      }

      // 🆕 현재 세션 조회
      const { getCurrentSession } = await import('../lib/auth/index')
      const session = getCurrentSession()

      if (!session) {
        console.error('❌ [SETTINGS] 세션이 없음')
        showMessage('로그인 후 복원해주세요.', 'error')
        return
      }

      // 🆕 회사 정보 비교
      const isSameCompany = result.data.companyInfo.companyId === session.company_id

      let confirmMessage = ''
      if (isSameCompany) {
        // 같은 회사: 안전한 복원
        confirmMessage =
          `✅ 같은 회사의 백업 파일입니다.\n\n` +
          `백업 회사: ${result.data.companyInfo.companyName}\n` +
          `백업 날짜: ${new Date(result.data.companyInfo.backupDate).toLocaleString('ko-KR')}\n` +
          `총 레코드: ${result.data.metadata.totalRecords}개\n\n` +
          `⚠️ 현재 데이터가 모두 삭제되고 백업 시점으로 복원됩니다.\n` +
          `계속하시겠습니까?`
      } else {
        // 다른 회사: 경고 표시
        confirmMessage =
          `⚠️ 다른 회사의 백업 파일입니다!\n\n` +
          `백업 회사: ${result.data.companyInfo.companyName} (ID: ${result.data.companyInfo.companyId})\n` +
          `현재 회사: 회사 ID ${session.company_id}\n` +
          `백업 날짜: ${new Date(result.data.companyInfo.backupDate).toLocaleString('ko-KR')}\n` +
          `총 레코드: ${result.data.metadata.totalRecords}개\n\n` +
          `🚨 현재 회사(${session.company_id})의 모든 데이터가 삭제되고\n` +
          `   다른 회사(${result.data.companyInfo.companyId})의 데이터로 교체됩니다.\n\n` +
          `정말로 복원하시겠습니까?`
      }

      const confirmRestore = window.confirm(confirmMessage)

      if (!confirmRestore) {
        showMessage('복원이 취소되었습니다.', 'info')
        return
      }

      restoreBackupData(result.data)

      // 🔄 React Query 캐시 완전 초기화
      queryClient.clear()

      showMessage(
        `백업 복원이 완료되었습니다. (${result.data.metadata.totalRecords}개 레코드)`,
        'success'
      )

      // 페이지 새로고침으로 모든 데이터 갱신
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('❌ [SETTINGS] 복원 중 오류:', error)
      showMessage(`복원 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error')
    } finally {
      setBackupStatus(prev => ({ ...prev, isRestoring: false }))
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // 자동 백업 토글
  const handleAutoBackupToggle = () => {
    const newEnabled = !backupStatus.autoBackupEnabled
    setAutoBackupEnabled(newEnabled)
    setBackupStatus(prev => ({ ...prev, autoBackupEnabled: newEnabled }))
    showMessage(
      `자동 백업이 ${newEnabled ? '활성화' : '비활성화'}되었습니다.`,
      'info'
    )
  }

  // 백업 파일 삭제
  const handleDeleteBackupFile = async (file: BackupFileInfo) => {
    const confirmDelete = window.confirm(
      `백업 파일을 삭제하시겠습니까?\n\n` +
      `파일명: ${file.name}\n` +
      `생성일: ${new Date(file.created).toLocaleString('ko-KR')}\n` +
      `크기: ${(file.size / 1024).toFixed(1)} KB`
    )

    if (!confirmDelete) return

    try {
      const success = await deleteBackupFile(file.path)
      if (success) {
        showMessage('백업 파일이 삭제되었습니다.', 'success')
        await loadBackupFiles()
      } else {
        showMessage('파일 삭제에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('파일 삭제 실패:', error)
      showMessage('파일 삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  // 백업 폴더 열기
  const handleOpenBackupFolder = async () => {
    if (!backupStatus.settings.backupPath) return

    try {
      const success = await openBackupFolderInExplorer(backupStatus.settings.backupPath)
      if (!success) {
        showMessage('폴더 열기에 실패했습니다.', 'error')
      }
    } catch (error) {
      console.error('폴더 열기 실패:', error)
      showMessage('폴더 열기 중 오류가 발생했습니다.', 'error')
    }
  }

  // 전체 데이터 삭제 핸들러
  const handleDeleteAllData = async () => {
    const confirmation = window.confirm(
      '⚠️ 경고: 모든 데이터가 영구적으로 삭제됩니다!\n\n' +
      '삭제될 데이터:\n' +
      '- 모든 거래처\n' +
      '- 모든 상품\n' +
      '- 모든 거래 내역\n' +
      '- 모든 거래처별 가격 정보\n\n' +
      '유지될 데이터:\n' +
      '✅ 회사 정보\n' +
      '✅ 사용자 계정\n\n' +
      '💾 백업 파일이 자동으로 다운로드됩니다.\n' +
      '계속하시겠습니까?'
    )

    if (!confirmation) return

    try {
      setBackupStatus(prev => ({ ...prev, isBackingUp: true }))
      const result = await deleteAllData()
      
      if (result.success) {
        showMessage('✅ 백업 완료 및 데이터 삭제 완료', 'success')
        
        // 1초 후 페이지 새로고침
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        showMessage(`❌ ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('데이터 삭제 실패:', error)
      showMessage('❌ 데이터 삭제 실패', 'error')
    } finally {
      setBackupStatus(prev => ({ ...prev, isBackingUp: false }))
    }
  }

  // localStorage 전체 초기화 핸들러
  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ 정말로 모든 데이터를 초기화하시겠습니까?\n\n' +
      '- 모든 사용자 계정이 삭제됩니다\n' +
      '- 모든 회사 데이터가 삭제됩니다\n' +
      '- 초기화 전 자동으로 백업이 생성됩니다\n' +
      '- admin과 demo 계정이 자동으로 재생성됩니다\n\n' +
      '이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmed) return

    try {

      // 1. 백업 생성
      setBackupStatus(prev => ({ ...prev, isBackingUp: true }))
      showMessage('💾 백업 생성 중...', 'info')

      try {
        await exportBackup(false)
      } catch (backupError) {
        console.warn('⚠️ 백업 실패 (계속 진행):', backupError)
      }

      // 2. localStorage 전체 클리어
      localStorage.clear()

      // 3. 성공 메시지 및 새로고침
      alert('✅ 전체 초기화가 완료되었습니다.\n\n데모 계정(admin/demo)이 자동으로 생성됩니다.')

      // 새로고침 (데모 계정 자동 생성됨)
      window.location.reload()

    } catch (error) {
      console.error('❌ 전체 초기화 실패:', error)
      alert('❌ 전체 초기화 중 오류가 발생했습니다.')
    } finally {
      setBackupStatus(prev => ({ ...prev, isBackingUp: false }))
    }
  }

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = async () => {
    // 세션 확인 먼저
    const currentSession = localStorage.getItem('simple-erp-current-session')

    if (!currentSession) {
      alert('❌ 세션이 만료되었습니다. 다시 로그인해주세요.')
      window.location.reload()
      return
    }

    const password = window.prompt('회원 탈퇴를 위해 비밀번호를 입력하세요:')

    if (!password) return

    try {
      const result = await deleteAccount(password)

      if (result.success) {
        alert('✅ 계정이 탈퇴되었습니다. 로그인 페이지로 이동합니다.')
        window.location.reload()
      } else {
        alert(`❌ ${result.error}`)
      }
    } catch (error) {
      console.error('회원 탈퇴 실패:', error)
      alert('❌ 회원 탈퇴 중 오류가 발생했습니다.')
    }
  }

  // 탭 구성
  const tabs = [
    { id: 'company' as TabType, name: '회사 정보', icon: '🏢' },
    { id: 'backup' as TabType, name: '백업 관리', icon: '💾' },
    { id: 'system' as TabType, name: '시스템 정보', icon: '⚙️' },
    // { id: 'testdata' as TabType, name: '테스트 데이터', icon: '🧪' },  // 배포용 숨김
    { id: 'account' as TabType, name: '계정 관리', icon: '👤' }
  ]

  if (error) {
    console.error('Settings API error:', error)
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">설정</h1>
          <p className="mt-2 text-sm text-gray-700">
            시스템 설정 및 회사 정보를 관리합니다.
          </p>
        </div>
      </div>

      {/* 백업 상태 메시지 */}
      {backupStatus.message && backupStatus.messageType && (
        <BackupMessage 
          message={backupStatus.message} 
          type={backupStatus.messageType} 
        />
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 탭 네비게이션 */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mt-8">
        {activeTab === 'company' && (
          <CompanyInfoSection
            company={company}
            isLoading={isLoading}
            onMessage={showMessage}
          />
        )}

        {activeTab === 'backup' && (
          <>
            <BackupSection
              isBackingUp={backupStatus.isBackingUp}
              isRestoring={backupStatus.isRestoring}
              isLoadingFiles={backupStatus.isLoadingFiles}
              autoBackupEnabled={backupStatus.autoBackupEnabled}
              settings={backupStatus.settings}
              backupFiles={backupStatus.backupFiles}
              onSelectFolder={handleSelectBackupFolder}
              onOpenFolder={handleOpenBackupFolder}
              onManualBackup={handleManualBackup}
              onRestore={handleRestoreBackup}
              onToggleAutoBackup={handleAutoBackupToggle}
              onRefreshFiles={loadBackupFiles}
              onDeleteFile={handleDeleteBackupFile}
            />

            {/* 전체 데이터 삭제 */}
            <div className="mt-8 border-t pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center">
                  <span className="mr-2">⚠️</span>
                  위험 영역
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  아래 작업은 되돌릴 수 없습니다. 실행 전 반드시 백업하세요.
                </p>
                <button
                  onClick={handleDeleteAllData}
                  disabled={backupStatus.isBackingUp}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {backupStatus.isBackingUp ? '처리 중...' : '🗑️ 모든 데이터 초기화'}
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'system' && (
          <SystemInfoSection 
            backupSettings={backupStatus.settings}
          />
        )}

        {activeTab === 'testdata' && (
          <TestDataSection
            onGenerateCustomers={generateTestCustomers}
            onGenerateProducts={generateTestProducts}
            onGenerateTransactions={generateTestTransactions}
            onGenerateAll={generateAllTestData}
          />
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* localStorage 전체 초기화 */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-orange-600 mb-2 flex items-center">
                  <span className="mr-2">🔄</span>
                  전체 데이터 초기화
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  모든 계정과 데이터를 초기화합니다. 초기화 후 데모 계정(admin/demo)이 자동 생성됩니다.
                </p>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-3">
                  <p className="text-sm text-orange-800 font-medium">
                    ⚠️ <strong>주의: 모든 사용자 계정과 회사 데이터가 삭제됩니다</strong>
                  </p>
                  <ul className="text-xs text-orange-700 mt-2 ml-4 list-disc">
                    <li>모든 사용자 계정 삭제</li>
                    <li>모든 회사 데이터 삭제</li>
                    <li>백업 설정 초기화</li>
                    <li>초기화 전 자동 백업 생성</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleClearAllData}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                전체 초기화
              </button>
            </div>

            {/* 회원 탈퇴 */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center">
                  <span className="mr-2">⚠️</span>
                  계정 탈퇴
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  계정 탈퇴 시 모든 데이터가 삭제됩니다. 탈퇴 전 자동으로 백업이 생성됩니다.
                </p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                계정 탈퇴
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
