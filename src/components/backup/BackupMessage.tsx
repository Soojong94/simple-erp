import { AlertCircle, CheckCircle } from 'lucide-react'

interface BackupMessageProps {
  message: string
  type: 'success' | 'error' | 'info'
}

export default function BackupMessage({ message, type }: BackupMessageProps) {
  return (
    <div className={`mt-4 rounded-md p-4 ${
      type === 'success' ? 'bg-green-50 border border-green-200' :
      type === 'error' ? 'bg-red-50 border border-red-200' :
      'bg-blue-50 border border-blue-200'
    }`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === 'success' && <CheckCircle className="h-5 w-5 text-green-400" />}
          {type === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
          {type === 'info' && <AlertCircle className="h-5 w-5 text-blue-400" />}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${
            type === 'success' ? 'text-green-800' :
            type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
