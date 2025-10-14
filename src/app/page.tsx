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
}

export default function Home() {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('tool')
  const [annoyances, setAnnoyances] = useState<Annoyance[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 加载列表
  useEffect(() => {
    loadAnnoyances()
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

  // 提交不爽
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

  // 处理回车提交
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

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
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          
          <div className="flex gap-3 mt-4">
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              aria-label="选择分类"
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

        {/* 列表 */}
        <div className="space-y-4">
          {annoyances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              还没有人发布不爽，来做第一个吧！
            </div>
          ) : (
            annoyances.map(item => (
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
                    className="px-4 py-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                  >
                    😤 {item.upvote_count}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// 辅助函数：获取分类标签
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tool: '🔧 工具类',
    life: '🏠 生活类',
    work: '💼 工作类',
    study: '📚 学习类'
  }
  return labels[category] || category
}