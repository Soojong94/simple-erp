import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../lib/utils'

interface MonthlyDataPoint {
  month: string
  매출: number
  매입: number
  수익: number
}

interface MonthlySalesChartProps {
  data: MonthlyDataPoint[]
  isLoading: boolean
}

export default function MonthlySalesChart({ data, isLoading }: MonthlySalesChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 월별 매출 추이</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 월별 매출 추이</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `₩${(value / 1000000).toFixed(0)}M`} />
            <Tooltip 
              formatter={(value: any, name: string) => [formatCurrency(value), name]}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
            />
            <Line type="monotone" dataKey="매출" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="매입" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="수익" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
