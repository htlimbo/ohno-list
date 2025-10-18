'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/userFingerprint'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import AnnoyanceCard, { Annoyance } from '@/components/AnnoyanceCard'

type Category = 'all' | 'tool' | 'life' | 'work' | 'study'

export default function Home() {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('tool')
  const [annoyances, setAnnoyances] = useState<Annoyance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstLoading, setIsFirstLoading] = useState(true)  // ← 新增：首次加载
  const [myUpvotes, setMyUpvotes] = useState<Set<number>>(new Set())
  const [upvoting, setUpvoting] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<Category>('all')

  useEffect(() => {
    loadAnnoyances()
    loadMyUpvotes()
  }, [])

  async function loadAnnoyances() {
    try {
      const { data, error } = await supabase
        .from('annoyances')
        .select('*')
        .order('upvote_count', { ascending: false })
      
      if (error) throw error
      setAnnoyances(data || [])
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setIsFirstLoading(false)  // ← 首次加载完成
    }
  }

  async function loadMyUpvotes() {
    try {
      const fingerprint = getUserFingerprint()
      const { data, error } = await supabase
        .from('upvotes')
        .select('annoyance_id')
        .eq('user_fingerprint', fingerprint)
      
      if (error) throw error
      
      const upvotedIds = new Set(data?.map(item => item.annoyance_id) || [])
      setMyUpvotes(upvotedIds)
    } catch (error) {
      console.error('加载点赞记录失败:', error)
    }
  }

  async function handleSubmit() {
    if (!content.trim()) {
      alert('请输入内容')
      return
    }

    setIsLoading(true)
    try {
      const fingerprint = getUserFingerprint()
      
      const { error } = await supabase.from('annoyances').insert({
        content: content.trim(),
        category,
        user_fingerprint: fingerprint
      })
      
      if (error) throw error
      
      setContent('')
      await loadAnnoyances()
      
      // 提交成功提示（可选）
      alert('✅ 发布成功！')
    } catch (error) {
      console.error('提交失败:', error)
      alert('提交失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

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

      setAnnoyances(prev => 
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const filteredAnnoyances = activeFilter === 'all' 
    ? annoyances 
    : annoyances.filter(item => item.category === activeFilter)

  const categories = [
    { value: 'all', label: '🌟 全部' },
    { value: 'tool', label: '🔧 工具类' },
    { value: 'life', label: '🏠 生活类' },
    { value: 'work', label: '💼 工作类' },
    { value: 'study', label: '📚 学习类' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 头部 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">😤 不爽榜</h1>
          <p className="text-gray-600 text-sm sm:text-base">记录不爽，发现机会</p>
        </div>

        {/* 输入区域 */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="什么让你不爽？(按Enter提交，Shift+Enter换行)"
            aria-label="输入不爽内容"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              aria-label="选择不爽分类"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tool">🔧 工具类</option>
              <option value="life">🏠 生活类</option>
              <option value="work">💼 工作类</option>
              <option value="study">📚 学习类</option>
            </select>
            
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !content.trim()}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? '发布中...' : '发布不爽'}
            </button>
          </div>
        </div>

        {/* 分类筛选Tab */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                type="button"
                key={cat.value}
                onClick={() => setActiveFilter(cat.value as Category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium ${
                  activeFilter === cat.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.label}
                {activeFilter === cat.value && (
                  <span className="ml-2 text-xs opacity-90">
                    ({filteredAnnoyances.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 列表区域 */}
        <div>
          {isFirstLoading ? (
            // ← 首次加载：显示骨架屏
            <LoadingSkeleton count={3} />
          ) : filteredAnnoyances.length === 0 ? (
            // ← 没有数据：显示空状态
            <EmptyState
              icon={activeFilter === 'all' ? '📭' : '🔍'}
              title={
                activeFilter === 'all' 
                  ? '还没有人发布不爽' 
                  : `暂时没有「${categories.find(c => c.value === activeFilter)?.label}」的不爽`
              }
              description={activeFilter === 'all' ? '来做第一个吧！' : '试试其他分类'}
            />
          ) : (
            // ← 有数据：显示列表
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