'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { fetchPartnerId } from '@/lib/partner'
import { BookOpen, Send, User, ArrowLeft, ImageIcon, X } from 'lucide-react'
import { format } from 'date-fns'

interface JournalEntry {
  id: string
  content: string
  author_id: string
  created_at: string
  author: { display_name: string; email: string } | null
  media?: { url: string; type: string }[]
}

export default function JournalPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadEntries = useCallback(async () => {
    if (!user) return

    const partnerId = await fetchPartnerId(supabase, user.id)

    if (!partnerId) {
      setLoading(false)
      return
    }

    // Fetch entries and their associated media
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        author:profiles!author_id(display_name, email),
        media(url, type)
      `)
      .or(`author_id.eq.${user.id},partner_id.eq.${user.id}`)
      .or(`author_id.eq.${partnerId},partner_id.eq.${partnerId}`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading entries:', error)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      loadEntries()
    }
  }, [user, loadEntries])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || (!content.trim() && !selectedImage)) return

    setSubmitting(true)

    try {
      const partnerId = await fetchPartnerId(supabase, user.id)

      if (!partnerId) {
        alert('Please connect with your partner in settings first')
        return
      }

      // 1. Create Journal Entry
      const { data: entryData, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          author_id: user.id,
          partner_id: partnerId,
          content: content.trim(),
        })
        .select()
        .single()

      if (entryError) throw entryError

      // 2. Upload Image if selected
      if (selectedImage && entryData) {
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('journal_images')
          .upload(fileName, selectedImage)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('journal_images')
          .getPublicUrl(fileName)

        // Link media to journal entry
        await supabase.from('media').insert({
          journal_entry_id: entryData.id,
          type: 'photo',
          url: publicUrlData.publicUrl
        })
      }

      // 3. Add to Activity Feed
      await supabase.from('activities').insert({
        user_id: user.id,
        partner_id: partnerId,
        activity_type: 'journal_entry',
        activity_data: { 
          preview: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          has_image: !!selectedImage 
        }
      })

      setContent('')
      setSelectedImage(null)
      loadEntries()
    } catch (error) {
      console.error('Error submitting entry:', error)
      const message = error instanceof Error ? error.message : 'Failed to save entry'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <BookOpen className="w-16 h-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-4xl">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-vintage-ink/70 hover:text-vintage-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="mb-8">
          <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">Shared Journal</h1>
          <p className="text-vintage-ink/70">Write back and forth with your partner</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none min-h-[120px] resize-none"
            />
            
            {selectedImage && (
              <div className="relative inline-block">
                <div className="text-xs text-vintage-ink/60 mb-1">Attached Image:</div>
                <div className="bg-rose-gold/10 px-3 py-1 rounded-lg flex items-center gap-2 text-sm text-vintage-ink">
                  <ImageIcon className="w-4 h-4" />
                  {selectedImage.name}
                  <button 
                    type="button" 
                    onClick={() => setSelectedImage(null)}
                    className="hover:text-red-500 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-vintage-ink/70 hover:text-rose-gold transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                Add Photo
              </button>

              <button
                type="submit"
                disabled={submitting || (!content.trim() && !selectedImage)}
                className="flex items-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Posting...' : 'Post Entry'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-rose-gold mb-4" />
              <h2 className="text-2xl font-semibold text-vintage-ink mb-2">No entries yet</h2>
              <p className="text-vintage-ink/70">Start your shared journal by writing your first entry!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg ${
                  entry.author_id === user?.id ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[80%]'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-rose-gold" />
                  <span className="font-semibold text-vintage-ink">
                    {entry.author_id === user?.id
                      ? 'You'
                      : entry.author?.display_name || entry.author?.email}
                  </span>
                  <span className="text-xs text-vintage-ink/60">
                    • {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                
                {/* Render Attached Images */}
                {entry.media && entry.media.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={entry.media[0].url} 
                      alt="Journal attachment" 
                      className="w-full max-h-[300px] object-cover" 
                    />
                  </div>
                )}

                <div className="text-vintage-ink whitespace-pre-wrap">{entry.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}