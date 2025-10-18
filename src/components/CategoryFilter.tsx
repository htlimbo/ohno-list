/**
 * 分类筛选Tab组件
 */

'use client'

export type Category = 'all' | 'tool' | 'life' | 'work' | 'study'

interface CategoryFilterProps {
  activeFilter: Category
  onFilterChange: (category: Category) => void
  counts?: Record<Category, number>
}

const categories = [
  { value: 'all' as Category, label: '🌟 全部' },
  { value: 'tool' as Category, label: '🔧 工具类' },
  { value: 'life' as Category, label: '🏠 生活类' },
  { value: 'work' as Category, label: '💼 工作类' },
  { value: 'study' as Category, label: '📚 学习类' },
]

export default function CategoryFilter({ 
  activeFilter, 
  onFilterChange,
  counts 
}: CategoryFilterProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            type="button"
            key={cat.value}
            onClick={() => onFilterChange(cat.value)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium ${
              activeFilter === cat.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cat.label}
            {activeFilter === cat.value && counts && (
              <span className="ml-2 text-xs opacity-90">
                ({counts[cat.value] || 0})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// 导出辅助函数
export function getCategoryLabel(category: string): string {
  const cat = categories.find(c => c.value === category)
  return cat ? cat.label : category
}