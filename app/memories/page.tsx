'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Images, Plus, Heart, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

interface Memory {
  id: string
  title: string | null
  description: string | null
  quote: string | null
  memory_date: string | null
  tags: string[] | null
  created_at: string
  media: Array<{ url: string; type: string; thumbnail_url: string | null }>
}

export default function MemoriesPage() {
  const { user } = useUser()
  const supabase = createSupabaseClient()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quote: '',
    memory_date: '',
    tags: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      loadMemories()
    }
  }, [user])

  const loadMemories = async () => {
    if (!user) return

    // Get partner ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .single()

    if (!profile?.partner_id) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('memories')
      .select(`
        *,
        media(*)
      `)
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('memory_date', { ascending: false, nullsLast: true })

    if (error) {
      console.error('Error loading memories:', error)
    } else {
      setMemories(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)

    try {
      // Get partner ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single()

      if (!profile?.partner_id) {
        alert('Please connect with your partner in settings first')
        return
      }

      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)

      const { data: memory, error } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          partner_id: profile.partner_id,
          title: formData.title || null,
          description: formData.description || null,
          quote: formData.quote || null,
          memory_date: formData.memory_date || null,
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single()

      if (error) throw error

      setFormData({ title: '', description: '', quote: '', memory_date: '', tags: '' })
      setShowForm(false)
      loadMemories()
    } catch (error: any) {
      console.error('Error creating memory:', error)
      alert(error.message || 'Failed to create memory')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <Images className="w-16 h-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">Memory Gallery</h1>
            <p className="text-vintage-ink/70">Timeline of your moments together</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Memory
          </button>
        </div>

        {showForm && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="First visit..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none min-h-[100px]"
                  placeholder="Describe this moment..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">Quote</label>
                <input
                  type="text"
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="A memorable quote..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-vintage-ink mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.memory_date}
                    onChange={(e) => setFormData({ ...formData, memory_date: e.target.value })}
                    className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vintage-ink mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                    placeholder="first, visit, special"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Memory'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-white border border-vintage-ink/20 text-vintage-ink rounded-lg font-semibold hover:bg-vintage-paper/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {memories.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <Images className="w-16 h-16 mx-auto text-rose-gold mb-4" />
            <h2 className="text-2xl font-semibold text-vintage-ink mb-2">No memories yet</h2>
            <p className="text-vintage-ink/70">Start building your shared timeline!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                {memory.media && memory.media.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={memory.media[0].url}
                      alt={memory.title || 'Memory'}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-vintage-ink">{memory.title || 'Untitled Memory'}</h3>
                  <Heart className="w-5 h-5 text-rose-gold fill-rose-gold flex-shrink-0" />
                </div>
                {memory.memory_date && (
                  <div className="flex items-center gap-2 text-sm text-vintage-ink/70 mb-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(memory.memory_date), 'MMM d, yyyy')}
                  </div>
                )}
                {memory.quote && (
                  <p className="text-rose-gold italic mb-2">"{memory.quote}"</p>
                )}
                {memory.description && (
                  <p className="text-vintage-ink/80 text-sm mb-3">{memory.description}</p>
                )}
                {memory.tags && memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {memory.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-rose-gold/10 text-rose-gold text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
