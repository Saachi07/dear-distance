'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { encrypt, hashPassword } from '@/lib/encryption'
import { LetterEditor } from '@/components/LetterEditor'
import { Save, Lock, Calendar, Eye, EyeOff } from 'lucide-react'

export default function NewLetterPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'unlisted'>('private')
  const [password, setPassword] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<Array<{ type: string; url: string }>>([])

  const handleSave = async () => {
    if (!user || !title || !content) {
      alert('Please fill in title and content')
      return
    }

    setLoading(true)

    try {
      // Get recipient ID if email provided
      let recipientId = null
      if (recipientEmail) {
        const { data: recipient } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', recipientEmail)
          .single()

        if (recipient) {
          recipientId = recipient.id
        }
      }

      // Encrypt content
      const encryptedContent = encrypt(content)

      // Prepare letter data
      const letterData: any = {
        sender_id: user.id,
        recipient_id: recipientId,
        title,
        content_encrypted: encryptedContent,
        visibility,
        password_hash: hasPassword && password ? hashPassword(password) : null,
        scheduled_reveal_at: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        is_unlocked: !scheduledDate,
      }

      const { data: letter, error: letterError } = await supabase
        .from('letters')
        .insert(letterData)
        .select()
        .single()

      if (letterError) throw letterError

      // Save media
      if (media.length > 0 && letter) {
        const mediaData = media.map(m => ({
          letter_id: letter.id,
          type: m.type,
          url: m.url,
        }))

        await supabase.from('media').insert(mediaData)
      }

      router.push(`/letters/${letter.id}`)
    } catch (error: any) {
      console.error('Error saving letter:', error)
      alert(error.message || 'Failed to save letter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-handwriting text-vintage-ink mb-8">Write a Letter</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                placeholder="My letter to you..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-2">
                Recipient Email (optional - leave empty for private letter)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                placeholder="partner@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-4">
                Letter Content
              </label>
              <LetterEditor
                content={content}
                onChange={setContent}
                onMediaAdd={(m) => setMedia([...media, m])}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">
                  Visibility
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setVisibility('private')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      visibility === 'private'
                        ? 'border-rose-gold bg-rose-gold/10'
                        : 'border-vintage-ink/20'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Private
                  </button>
                  <button
                    onClick={() => setVisibility('unlisted')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      visibility === 'unlisted'
                        ? 'border-rose-gold bg-rose-gold/10'
                        : 'border-vintage-ink/20'
                    }`}
                  >
                    <EyeOff className="w-4 h-4" />
                    Unlisted
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-2">
                  <input
                    type="checkbox"
                    checked={hasPassword}
                    onChange={(e) => setHasPassword(e.target.checked)}
                    className="rounded"
                  />
                  Password Protect
                </label>
                {hasPassword && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                    placeholder="Enter password"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-vintage-ink mb-2">
                <Calendar className="w-4 h-4" />
                Schedule Reveal (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
              />
              <p className="mt-1 text-xs text-vintage-ink/60">
                Letter will unlock automatically at this date and time
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Letter'}
              </button>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-white border border-vintage-ink/20 text-vintage-ink rounded-lg font-semibold hover:bg-vintage-paper/30 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
