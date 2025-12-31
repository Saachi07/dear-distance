'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { encrypt, hashPassword, hashPassword as hashPuzzleAnswer } from '@/lib/encryption'
import { LetterEditor } from '@/components/LetterEditor'
import { createActivity } from '@/lib/notifications'
import { Save, Lock, Calendar, EyeOff, ArrowLeft, Heart, Home, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function NewLetterPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  // Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'unlisted'>('private')
  const [password, setPassword] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<Array<{ type: string; url: string }>>([])
  
  // Letter Type State
  const [letterType, setLetterType] = useState<'regular' | 'open_when'>('regular')
  const [openWhenCondition, setOpenWhenCondition] = useState('')
  
  // Puzzle State
  const [hasPuzzle, setHasPuzzle] = useState(false)
  const [puzzleType, setPuzzleType] = useState<'riddle' | 'math' | 'word'>('riddle')
  const [puzzleQuestion, setPuzzleQuestion] = useState('')
  const [puzzleAnswer, setPuzzleAnswer] = useState('')

  // Success State
  const [isSuccess, setIsSuccess] = useState(false)
  const [createdLetterId, setCreatedLetterId] = useState<string | null>(null)

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
      const letterData = {
        sender_id: user.id,
        recipient_id: recipientId,
        title,
        content_encrypted: encryptedContent,
        visibility,
        password_hash: hasPassword && password ? hashPassword(password) : null,
        scheduled_reveal_at: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        is_unlocked: !scheduledDate && !hasPuzzle,
        letter_type: letterType,
        open_when_condition: letterType === 'open_when' ? openWhenCondition : null,
        puzzle_type: hasPuzzle ? puzzleType : null,
        puzzle_question: hasPuzzle ? puzzleQuestion : null,
        puzzle_answer_hash: hasPuzzle && puzzleAnswer ? hashPuzzleAnswer(puzzleAnswer) : null,
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

      // Create activity
      if (recipientId) {
        await createActivity(user.id, recipientId, 'letter_sent', {
          letter_id: letter.id,
          title: letter.title,
        })
      }

      // Success! Show success screen instead of redirecting
      setCreatedLetterId(letter.id)
      setIsSuccess(true)

    } catch (error) {
      console.error('Error saving letter:', error)
      const message = error instanceof Error ? error.message : 'Failed to save letter'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  // --- SUCCESS VIEW ---
  if (isSuccess && createdLetterId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center max-w-lg w-full border border-rose-gold/20 animate-fade-in">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-handwriting text-vintage-ink mb-4">
            Letter Sealed!
          </h1>
          
          <p className="text-vintage-ink/70 mb-8 font-serif">
            Your letter has been securely encrypted and saved. 
            {scheduledDate 
              ? ` It will be revealed on ${new Date(scheduledDate).toLocaleDateString()}.` 
              : " It's ready to be opened."}
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/letters/view?id=${createdLetterId}`} // FIX: Correct query param link
              className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-md group"
            >
              <Mail className="w-5 h-5" />
              View Letter
            </Link>
            
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-vintage-ink/20 text-vintage-ink rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <Home className="w-5 h-5" />
              Return to Dashboard
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-vintage-ink/60 hover:text-rose-gold underline transition-colors"
            >
              Write another letter
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- REGULAR FORM VIEW ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-vintage-ink/70 hover:text-vintage-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-handwriting text-vintage-ink mb-8">Write a Letter</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-2">
                Letter Type
              </label>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setLetterType('regular')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    letterType === 'regular'
                      ? 'border-rose-gold bg-rose-gold/10'
                      : 'border-vintage-ink/20'
                  }`}
                >
                  Regular Letter
                </button>
                <button
                  onClick={() => setLetterType('open_when')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    letterType === 'open_when'
                      ? 'border-rose-gold bg-rose-gold/10'
                      : 'border-vintage-ink/20'
                  }`}
                >
                  Open When...
                </button>
              </div>
            </div>

            {letterType === 'open_when' && (
              <div>
                <label className="block text-sm font-medium text-vintage-ink mb-2">
                  Open When...
                </label>
                <input
                  type="text"
                  value={openWhenCondition}
                  onChange={(e) => setOpenWhenCondition(e.target.value)}
                  className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                  placeholder="e.g., sad, missing me, want to hug me"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-vintage-ink mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                placeholder={letterType === 'open_when' ? `Open when ${openWhenCondition || '...'}` : "My letter to you..."}
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
                <input
                  type="checkbox"
                  checked={hasPuzzle}
                  onChange={(e) => setHasPuzzle(e.target.checked)}
                  className="rounded"
                />
                Add Puzzle/Riddle Protection
              </label>
              {hasPuzzle && (
                <div className="mt-4 space-y-4 p-4 bg-rose-gold/5 rounded-lg border border-rose-gold/20">
                  <div>
                    <label className="block text-sm font-medium text-vintage-ink mb-2">
                      Puzzle Type
                    </label>
                    <select
                      value={puzzleType}
                      onChange={(e) => setPuzzleType(e.target.value as 'riddle' | 'math' | 'word')}
                      className="w-full px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                    >
                      <option value="riddle">Riddle</option>
                      <option value="math">Math Problem</option>
                      <option value="word">Word Puzzle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vintage-ink mb-2">
                      Question
                    </label>
                    <input
                      type="text"
                      value={puzzleQuestion}
                      onChange={(e) => setPuzzleQuestion(e.target.value)}
                      className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                      placeholder="Enter your puzzle question..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vintage-ink mb-2">
                      Answer
                    </label>
                    <input
                      type="text"
                      value={puzzleAnswer}
                      onChange={(e) => setPuzzleAnswer(e.target.value)}
                      className="w-full px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
                      placeholder="The correct answer..."
                    />
                  </div>
                </div>
              )}
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