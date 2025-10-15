'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/userFingerprint'

// 定义类型
interface Annoyance {
  id: number
  content: string
  category: string
  upvote_count: number
  created_at: string
  user_fingerprint: string
}

type Category = 'all' | 'tool' | 'life' | 'work' | 'study'

export default function Home() {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('tool')
  const [annoyances, setAnnoyances] = useState<Annoyance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [myUpvotes, setMyUpvotes] = useState<Set<number>>(new Set())
  const [upvoting, setUpvoting] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<Category>('all') // ⭐ 新增：当前筛选

  // 加载列表
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
          console.log('已经点过赞了')
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

  // ⭐ 新增：筛选逻辑
  const filteredAnnoyances = activeFilter === 'all' 
    ? annoyances 
    : annoyances.filter(item => item.category === activeFilter)

  // ⭐ 新增：分类配置
  const categories = [
    { value: 'all', label: '🌟 全部', emoji: '🌟' },
    { value: 'tool', label: '🔧 工具类', emoji: '🔧' },
    { value: 'life', label: '🏠 生活类', emoji: '🏠' },
    { value: 'work', label: '💼 工作类', emoji: '💼' },
    { value: 'study', label: '📚 学习类', emoji: '📚' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 头部 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">😤 不爽榜</h1>
          <p className="text-gray-600">记录不爽，发现机会</p>
        </div>

        {/* 输入区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="什么让你不爽？(按Enter提交)"
            aria-label="输入不爽内容"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          
          <div className="flex gap-3 mt-4">
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
              onClick={handleSubmit}
              disabled={isLoading || !content.trim()}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '提交中...' : '发布不爽'}
            </button>
          </div>
        </div>

        {/* ⭐ 新增：分类筛选Tab */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveFilter(cat.value as Category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeFilter === cat.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.label}
                {activeFilter === cat.value && (
                  <span className="ml-2 text-xs">
                    ({filteredAnnoyances.length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 - 使用筛选后的数据 */}
        <div className="space-y-4">
          {filteredAnnoyances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {activeFilter === 'all' 
                ? '还没有人发布不爽，来做第一个吧！'
                : `暂时没有「${getCategoryLabel(activeFilter)}」的不爽`
              }
            </div>
          ) : (
            filteredAnnoyances.map(item => {
              const isUpvoted = myUpvotes.has(item.id)
              const isUpvoting = upvoting === item.id

              return (
                <div 
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
                >
                  <p className="text-gray-800 mb-3">{item.content}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                      {getCategoryLabel(item.category)}
                    </span>
                    
                    <button 
                      onClick={() => handleUpvote(item.id)}
                      disabled={isUpvoted || isUpvoting}
                      className={`px-4 py-1 rounded-full transition-all ${
                        isUpvoted 
                          ? 'bg-red-600 text-white cursor-default' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      } ${isUpvoting ? 'opacity-50' : ''}`}
                    >
                      {isUpvoted ? '✓ 已不爽' : '😤 我也不爽'} {item.upvote_count}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// 辅助函数：获取分类标签
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    all: '全部',
    tool: '🔧 工具类',
    life: '🏠 生活类',
    work: '💼 工作类',
    study: '📚 学习类'
  }
  return labels[category] || category
}