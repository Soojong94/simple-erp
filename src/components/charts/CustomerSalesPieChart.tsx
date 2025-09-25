import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../lib/utils'

interface CustomerSalesData {
  name: string
  value: number
  color: string
}

interface CustomerSalesPieChartProps {
  data: CustomerSalesData[]
  isLoading: boolean
}

export default function CustomerSalesPieChart({ data, isLoading }: CustomerSalesPieChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 거래처별 매출 비중</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 거래처별 매출 비중</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm">매출 데이터가 없습니다</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 거래처별 매출 비중</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* 범례 */}
        <div className="mt-4 grid grid-cols-1 gap-1">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="flex-1 truncate">{entry.name}</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
