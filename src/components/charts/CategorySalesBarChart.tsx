import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CategoryData {
  category: string
  quantity: number
  emoji: string
}

interface CategorySalesBarChartProps {
  data: CategoryData[]
  isLoading: boolean
}

export default function CategorySalesBarChart({ data, isLoading }: CategorySalesBarChartProps) {
  if (isLoading || data.length === 0) {
    return null // 데이터가 없으면 렌더링하지 않음
  }

  return (
    <div className="mt-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🥩 상품 카테고리별 판매량 (kg)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="category" 
                tickFormatter={(value) => {
                  const item = data.find(d => d.category === value)
                  return `${item?.emoji} ${value}`
                }}
              />
              <YAxis tickFormatter={(value) => `${value}kg`} />
              <Tooltip 
                formatter={(value: any) => [`${value}kg`, '판매량']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="quantity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
