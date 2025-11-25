'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { ImageIcon, Plus, Heart, Calendar, ArrowLeft, Upload, X } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createActivity } from '@/lib/notifications'
import { fetchPartnerId } from '@/lib/partner'

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
  const router = useRouter()
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
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; file: File }>>([])

  const loadMemories = useCallback(async () => {
    if (!user) return

    const partnerId = await fetchPartnerId(supabase, user.id)

    if (!partnerId) {
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
      .order('memory_date', { ascending: false, nullsFirst: false })
    if (error) {
      console.error('Error loading memories:', error)
    } else {
      setMemories(data || [])
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      loadMemories()
    }
  }, [user, loadMemories])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `memories/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('dear-distance-media')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('dear-distance-media')
          .getPublicUrl(filePath)

        setUploadedImages(prev => [...prev, { url: publicUrl, file }])
      } catch (error) {
        console.error('Error uploading image:', error)
        alert('Failed to upload image')
      }
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)

    try {
      const partnerId = await fetchPartnerId(supabase, user.id)

      if (!partnerId) {
        alert('Please connect with your partner in settings first')
        return
      }

      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)

      const { data: memory, error } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          partner_id: partnerId,
          title: formData.title || null,
          description: formData.description || null,
          quote: formData.quote || null,
          memory_date: formData.memory_date || null,
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single()

      if (error) throw error

      // Upload images
      if (uploadedImages.length > 0 && memory) {
        const mediaData = uploadedImages.map(img => ({
          memory_id: memory.id,
          type: 'photo' as const,
          url: img.url,
        }))

        await supabase.from('media').insert(mediaData)
      }

      // Create activity
      await createActivity(user.id, partnerId, 'memory_added', {
        memory_id: memory.id,
        title: memory.title,
      })

      setFormData({ title: '', description: '', quote: '', memory_date: '', tags: '' })
      setUploadedImages([])
      setShowForm(false)
      loadMemories()
    } catch (error) {
      console.error('Error creating memory:', error)
      const message = error instanceof Error ? error.message : 'Failed to create memory'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <ImageIcon className="w-16 h-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-6xl">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-vintage-ink/70 hover:text-vintage-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
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
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">Images</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <Image
                        src={img.url}
                        alt={`Upload ${idx + 1}`}
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-rose-gold/10 text-rose-gold rounded-lg hover:bg-rose-gold/20 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
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
            <ImageIcon className="w-16 h-16 mx-auto text-rose-gold mb-4" />
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
                    <Image
                      src={memory.media[0].url}
                      alt={memory.title || 'Memory'}
                      width={800}
                      height={400}
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
                  <p className="text-rose-gold italic mb-2">&ldquo;{memory.quote}&rdquo;</p>
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
