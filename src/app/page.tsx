/**
 * 首页 - 不爽榜
 * 拆分后的简洁版本，只负责组合组件
 */

'use client'

import { useState, useMemo } from 'react'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import AnnoyanceCard from '@/components/AnnoyanceCard'
import AnnoyanceForm from '@/components/AnnoyanceForm'
import CategoryFilter, { Category, getCategoryLabel } from '@/components/CategoryFilter'
import { useAnnoyances } from '@/hooks/useAnnoyances'

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<Category>('all')
  
  const {
    annoyances,
    myUpvotes,
    isFirstLoading,
    upvoting,
    submitAnnoyance,
    handleUpvote
  } = useAnnoyances()

  // 筛选后的列表
  const filteredAnnoyances = useMemo(() => {
    return activeFilter === 'all' 
      ? annoyances 
      : annoyances.filter(item => item.category === activeFilter)
  }, [annoyances, activeFilter])

  // 各分类的数量（用于Tab显示）
  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      all: annoyances.length,
      tool: 0,
      life: 0,
      work: 0,
      study: 0
    }
    annoyances.forEach(item => {
      if (item.category in counts) {
        counts[item.category as Exclude<Category, 'all'>]++
      }
    })
    return counts
  }, [annoyances])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 头部 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">😤 不爽榜</h1>
          <p className="text-gray-600 text-sm sm:text-base">记录不爽，发现机会</p>
        </div>

        {/* 输入表单 */}
        <AnnoyanceForm onSubmit={submitAnnoyance} />

        {/* 分类筛选 */}
        <CategoryFilter 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={categoryCounts}
        />

        {/* 列表区域 */}
        <div>
          {isFirstLoading ? (
            <LoadingSkeleton count={3} />
          ) : filteredAnnoyances.length === 0 ? (
            <EmptyState
              icon={activeFilter === 'all' ? '📭' : '🔍'}
              title={
                activeFilter === 'all' 
                  ? '还没有人发布不爽' 
                  : `暂时没有「${getCategoryLabel(activeFilter)}」的不爽`
              }
              description={activeFilter === 'all' ? '来做第一个吧！' : '试试其他分类'}
            />
          ) : (
            <div className="space-y-4">
              {filteredAnnoyances.map(item => (
                <AnnoyanceCard
                  key={item.id}
                  annoyance={item}
                  isUpvoted={myUpvotes.has(item.id)}
                  isUpvoting={upvoting === item.id}
                  onUpvote={handleUpvote}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}