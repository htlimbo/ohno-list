/**
 * 我的不爽页面
 * 拆分后的简洁版本
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import AnnoyanceCard from '@/components/AnnoyanceCard'
import StatsCard from '@/components/StatsCard'
import TabSwitch, { TabType } from '@/components/TabSwitch'
import { useMyData } from '@/hooks/useMyData'

export default function MyPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('published')

  const {
    myAnnoyances,
    upvotedAnnoyances,
    myUpvotes,
    isLoading,
    upvoting,
    deleting,
    stats,
    handleUpvote,
    handleDelete,
    handleCancelUpvote
  } = useMyData()

  const currentList = activeTab === 'published' ? myAnnoyances : upvotedAnnoyances

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 标题 */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">我的不爽</h1>

        {/* 统计卡片 */}
        <StatsCard {...stats} />

        {/* Tab切换 */}
        <TabSwitch
          activeTab={activeTab}
          onTabChange={setActiveTab}
          publishedCount={stats.publishedCount}
          upvotedCount={stats.upvotedCount}
        />

        {/* 列表区域 */}
        <div>
          {isLoading ? (
            <LoadingSkeleton count={3} />
          ) : currentList.length === 0 ? (
            <EmptyState
              icon={activeTab === 'published' ? '😴' : '🔍'}
              title={
                activeTab === 'published'
                  ? '你还没有发布过不爽'
                  : '你还没有点赞过任何不爽'
              }
              description={
                activeTab === 'published'
                  ? '去首页记录第一个不爽吧'
                  : '去首页看看有什么不爽的'
              }
              actionText="去首页"
              onAction={() => router.push('/')}
            />
          ) : (
            <div className="space-y-4">
              {currentList.map(item => (
                <AnnoyanceCard
                  key={item.id}
                  annoyance={item}
                  isUpvoted={myUpvotes.has(item.id)}
                  isUpvoting={upvoting === item.id}
                  showDelete={true}
                  isDeleting={deleting === item.id}
                  onUpvote={handleUpvote}
                  onDelete={
                    activeTab === 'published'
                      ? handleDelete
                      : handleCancelUpvote
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}