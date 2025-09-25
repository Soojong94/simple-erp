import { useQuery } from '@tanstack/react-query'
import { companyAPI, customerAPI, productAPI, transactionAPI } from '../lib/tauri'
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
  type BackupSettings,
  type BackupFileInfo
} from '../lib/backup'

// 컴포넌트 imports
import BackupMessage from '../components/backup/BackupMessage'
import BackupSection from '../components/backup/BackupSection'
import CompanyInfoSection from '../components/company/CompanyInfoSection'
import SystemInfoSection from '../components/system/SystemInfoSection'

// CSV 관리 컴포넌트들
import CustomerCSVManager from '../components/csv/CustomerCSVManager'
import ProductCSVManager from '../components/csv/ProductCSVManager'
import TransactionCSVExporter from '../components/csv/TransactionCSVExporter'

// 테스트 데이터 생성
import { generateTestData, clearAllData } from '../lib/testData'

type TabType = 'company' | 'backup' | 'csv' | 'system' | 'dev'

export default function Settings() {
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
  }>({
    isBackingUp: false,
    isRestoring: false,
    isLoadingFiles: false,
    autoBackupEnabled: isAutoBackupEnabled(),
    settings: getBackupSettings(),
    backupFiles: [],
    message: '',
    messageType: null
  })

  // 데이터 쿼리들
  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyAPI.get()
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll()
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll()
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionAPI.getAll()
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
        showMessage(result.error || '백업 파일을 읽을 수 없습니다.', 'error')
        return
      }

      const confirmRestore = window.confirm(
        `백업 파일을 복원하시겠습니까?\n\n` +
        `백업 날짜: ${new Date(result.data.metadata.backupDate).toLocaleString('ko-KR')}\n` +
        `총 레코드: ${result.data.metadata.totalRecords}개\n` +
        `앱 버전: ${result.data.metadata.appVersion}\n\n` +
        `⚠️ 현재 데이터가 모두 덮어씌워집니다!`
      )

      if (!confirmRestore) {
        showMessage('복원이 취소되었습니다.', 'info')
        return
      }

      restoreBackupData(result.data)
      
      showMessage(
        `백업 복원이 완료되었습니다. (${result.data.metadata.totalRecords}개 레코드)`,
        'success'
      )

      // 페이지 새로고침으로 모든 데이터 갱신
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Restore backup error:', error)
      showMessage('복원 중 오류가 발생했습니다.', 'error')
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

  // 테스트 데이터 생성 상태
  const [isGeneratingData, setIsGeneratingData] = useState(false)
  const [isClearingData, setIsClearingData] = useState(false)

  // 테스트 데이터 생성
  const handleGenerateTestData = async () => {
    setIsGeneratingData(true)
    try {
      const result = await generateTestData()
      showMessage(
        `테스트 데이터 생성 완료! 거래처: ${result.customers}개, 상품: ${result.products}개, 거래: ${result.transactions}개`,
        'success'
      )
    } catch (error) {
      console.error('테스트 데이터 생성 실패:', error)
      showMessage('테스트 데이터 생성 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsGeneratingData(false)
    }
  }

  // 데이터 전체 삭제
  const handleClearAllData = async () => {
    setIsClearingData(true)
    try {
      await clearAllData()
    } catch (error) {
      console.error('데이터 삭제 실패:', error)
      showMessage('데이터 삭제 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsClearingData(false)
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

  // 탭 구성
  const tabs = [
    { id: 'company' as TabType, name: '회사 정보', icon: '🏢' },
    { id: 'backup' as TabType, name: '백업 관리', icon: '💾' },
    { id: 'csv' as TabType, name: 'CSV 관리', icon: '📊' },
    { id: 'system' as TabType, name: '시스템 정보', icon: '⚙️' },
    ...(import.meta.env.DEV ? [{ id: 'dev' as TabType, name: '개발자 도구', icon: '🛠️' }] : [])
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
        )}

        {activeTab === 'csv' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {customers && <CustomerCSVManager customers={customers} />}
              {products && <ProductCSVManager products={products} />}
            </div>
            {transactions && (
              <div className="max-w-2xl">
                <TransactionCSVExporter transactions={transactions} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <SystemInfoSection 
            backupSettings={backupStatus.settings}
          />
        )}
      </div>
    </div>
  )
}
