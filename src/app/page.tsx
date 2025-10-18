'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/userFingerprint'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import AnnoyanceCard, { Annoyance } from '@/components/AnnoyanceCard'
import { useRouter } from 'next/navigation'

type TabType = 'published' | 'upvoted'

export default function MyPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('published')
  const [myAnnoyances, setMyAnnoyances] = useState<Annoyance[]>([])
  const [upvotedAnnoyances, setUpvotedAnnoyances] = useState<Annoyance[]>([])
  const [myUpvotes, setMyUpvotes] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [upvoting, setUpvoting] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  // 统计数据
  const [stats, setStats] = useState({
    publishedCount: 0,
    upvotedCount: 0,
    totalUpvotesReceived: 0,
    joinDays: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const fingerprint = getUserFingerprint()

      // 1. 加载我发布的
      const { data: myData, error: myError } = await supabase
        .from('annoyances')
        .select('*')
        .eq('user_fingerprint', fingerprint)
        .order('created_at', { ascending: false })

      if (myError) throw myError
      setMyAnnoyances(myData || [])

      // 2. 加载我点赞过的ID
      const { data: upvotesData, error: upvotesError } = await supabase
        .from('upvotes')
        .select('annoyance_id, created_at')
        .eq('user_fingerprint', fingerprint)
        .order('created_at', { ascending: false })

      if (upvotesError) throw upvotesError

      const upvotedIds = upvotesData?.map(item => item.annoyance_id) || []
      setMyUpvotes(new Set(upvotedIds))

      // 3. 加载我点赞的不爽详情
      if (upvotedIds.length > 0) {
        const { data: upvotedData, error: upvotedError } = await supabase
          .from('annoyances')
          .select('*')
          .in('id', upvotedIds)

        if (upvotedError) throw upvotedError

        // 按点赞时间排序（保持点赞顺序）
        const sortedData = upvotedIds
          .map(id => upvotedData?.find(item => item.id === id))
          .filter(Boolean) as Annoyance[]

        setUpvotedAnnoyances(sortedData)
      }

      // 4. 计算统计数据
      const totalUpvotes = myData?.reduce((sum, item) => sum + item.upvote_count, 0) || 0
      
      // 计算加入天数（从第一条发布算起）
      let joinDays = 0
      if (myData && myData.length > 0) {
        const firstPost = new Date(myData[myData.length - 1].created_at)
        const now = new Date()
        joinDays = Math.floor((now.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24))
      }

      setStats({
        publishedCount: myData?.length || 0,
        upvotedCount: upvotedIds.length,
        totalUpvotesReceived: totalUpvotes,
        joinDays: joinDays
      })

    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 点赞功能（和首页一样）
  async function handleUpvote(annoyanceId: number) {
    if (myUpvotes.has(annoyanceId) || upvoting === annoyanceId) {
      return
    }

    setUpvoting(annoyanceId)

    try {
      const fingerprint = getUserFingerprint()

      const { error: upvoteError } = await supabase
        .from('upvotes')
        .insert({
          annoyance_id: annoyanceId,
          user_fingerprint: fingerprint
        })

      if (upvoteError) {
        if (upvoteError.code === '23505') {
          setMyUpvotes(prev => new Set([...prev, annoyanceId]))
          return
        }
        throw upvoteError
      }

      const { error: updateError } = await supabase.rpc('increment_upvote', {
        annoyance_id: annoyanceId
      })

      if (updateError) throw updateError

      // 更新本地状态
      setMyAnnoyances(prev =>
        prev.map(item =>
          item.id === annoyanceId
            ? { ...item, upvote_count: item.upvote_count + 1 }
            : item
        )
      )

      setUpvotedAnnoyances(prev =>
        prev.map(item =>
          item.id === annoyanceId
            ? { ...item, upvote_count: item.upvote_count + 1 }
            : item
        )
      )

      setMyUpvotes(prev => new Set([...prev, annoyanceId]))

    } catch (error) {
      console.error('点赞失败:', error)
      alert('点赞失败，请重试')
    } finally {
      setUpvoting(null)
    }
  }

  // 删除功能
  async function handleDelete(annoyanceId: number) {
    if (!confirm('确定要删除这条不爽吗？')) {
      return
    }

    setDeleting(annoyanceId)

    try {
      // 1. 先删除相关的点赞记录
      const { error: deleteUpvotesError } = await supabase
        .from('upvotes')
        .delete()
        .eq('annoyance_id', annoyanceId)

      if (deleteUpvotesError) throw deleteUpvotesError

      // 2. 删除不爽记录
      const { error: deleteError } = await supabase
        .from('annoyances')
        .delete()
        .eq('id', annoyanceId)

      if (deleteError) throw deleteError

      // 3. 更新本地状态
      setMyAnnoyances(prev => prev.filter(item => item.id !== annoyanceId))
      
      // 4. 更新统计
      setStats(prev => ({
        ...prev,
        publishedCount: prev.publishedCount - 1
      }))

      alert('✅ 删除成功')

    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    } finally {
      setDeleting(null)
    }
  }

  // 取消点赞功能
  async function handleCancelUpvote(annoyanceId: number) {
    if (!confirm('确定要取消点赞吗？')) {
      return
    }

    setDeleting(annoyanceId)

    try {
      const fingerprint = getUserFingerprint()

      // 1. 删除点赞记录
      const { error: deleteError } = await supabase
        .from('upvotes')
        .delete()
        .eq('annoyance_id', annoyanceId)
        .eq('user_fingerprint', fingerprint)

      if (deleteError) throw deleteError

      // 2. 减少upvote_count
      const { error: decrementError } = await supabase.rpc('decrement_upvote', {
        annoyance_id: annoyanceId
      })

      if (decrementError) throw decrementError

      // 3. 更新本地状态
      setUpvotedAnnoyances(prev => prev.filter(item => item.id !== annoyanceId))
      setMyUpvotes(prev => {
        const newSet = new Set(prev)
        newSet.delete(annoyanceId)
        return newSet
      })

      // 4. 更新统计
      setStats(prev => ({
        ...prev,
        upvotedCount: prev.upvotedCount - 1
      }))

      alert('✅ 已取消点赞')

    } catch (error) {
      console.error('取消点赞失败:', error)
      alert('取消点赞失败，请重试')
    } finally {
      setDeleting(null)
    }
  }

  const currentList = activeTab === 'published' ? myAnnoyances : upvotedAnnoyances

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 标题 */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">我的不爽</h1>

        {/* 统计卡片 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.publishedCount}</div>
              <div className="text-sm text-gray-600 mt-1">发布了</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.upvotedCount}</div>
              <div className="text-sm text-gray-600 mt-1">点赞了</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalUpvotesReceived}</div>
              <div className="text-sm text-gray-600 mt-1">获得赞</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.joinDays}</div>
              <div className="text-sm text-gray-600 mt-1">天</div>
            </div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('published')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'published'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            📝 我发布的 ({stats.publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upvoted')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'upvoted'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            ❤️ 我点赞的 ({stats.upvotedCount})
          </button>
        </div>

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