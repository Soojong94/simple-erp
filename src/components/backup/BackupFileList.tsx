import { Folder, Trash2 } from 'lucide-react'
import { BackupFileInfo, formatFileSize } from '../../lib/backup'

interface BackupFileListProps {
  isLoading: boolean
  files: BackupFileInfo[]
  onDeleteFile: (file: BackupFileInfo) => void
}

export default function BackupFileList({ isLoading, files, onDeleteFile }: BackupFileListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <div className="mt-2 text-sm text-gray-500">백업 파일 목록 로딩 중...</div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <Folder className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">백업 파일이 없습니다</h3>
        <p className="mt-1 text-sm text-gray-500">수동 백업을 실행하여 첫 번째 백업 파일을 생성하세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div key={file.path} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{file.name}</span>
              {file.totalRecords && (
                <span className="text-xs text-gray-500">({file.totalRecords}개 레코드)</span>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
              <span>생성일: {new Date(file.created).toLocaleString('ko-KR')}</span>
              <span>크기: {formatFileSize(file.size)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDeleteFile(file)}
            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-400 hover:text-red-600 hover:bg-red-50"
            title="파일 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
