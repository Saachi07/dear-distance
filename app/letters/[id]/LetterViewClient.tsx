'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { createSupabaseClient } from '@/lib/supabase/client'
import { decrypt, verifyPassword, hashPassword } from '@/lib/encryption'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { Heart, Lock, Calendar, User, Volume2, ArrowLeft, HelpCircle } from 'lucide-react'
import { EnvelopeAnimation } from '@/components/EnvelopeAnimation'
import { createActivity } from '@/lib/notifications'

interface Letter {
  id: string
  sender_id: string
  recipient_id: string | null
  title: string
  content_encrypted: string
  password_hash: string | null
  scheduled_reveal_at: string | null
  is_unlocked: boolean
  opened_at: string | null
  created_at: string
  letter_type: 'regular' | 'open_when' | null
  open_when_condition: string | null
  puzzle_type: 'riddle' | 'math' | 'word' | null
  puzzle_question: string | null
  puzzle_answer_hash: string | null
  sender: { display_name: string; email: string }
}

export default function LetterViewClient({ id }: { id: string }) {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const supabase = createSupabaseClient()
  const [letter, setLetter] = useState<Letter | null>(null)
  const [decryptedContent, setDecryptedContent] = useState<string>('')
  const [showEnvelope, setShowEnvelope] = useState(true)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [puzzleAnswer, setPuzzleAnswer] = useState('')
  const [puzzleError, setPuzzleError] = useState('')
  const [showEnvelopeAnimation, setShowEnvelopeAnimation] = useState(false)

  const loadLetter = useCallback(async () => {
    if (!id || !user) return

    try {
      const { data, error } = await supabase
        .from('letters')
        .select(`
          *,
          sender:profiles!letters_sender_id_fkey(display_name, email)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        const isSender = data.sender_id === user?.id
        const isRecipient = data.recipient_id === user?.id

        if (!isSender && !isRecipient) {
          router.push('/letters')
          return
        }

        setLetter(data)

        const isScheduledUnlock = data.scheduled_reveal_at && new Date(data.scheduled_reveal_at) <= new Date()
        const shouldBeUnlocked = data.is_unlocked || isScheduledUnlock || isSender

        if (isScheduledUnlock && !data.is_unlocked) {
          await supabase
            .from('letters')
            .update({
              is_unlocked: true,
              opened_at: new Date().toISOString(),
            })
            .eq('id', data.id)
          setIsUnlocked(true)
        } else {
          setIsUnlocked(data.is_unlocked || isSender)
        }

        if (data.letter_type === 'open_when' && !shouldBeUnlocked) {
          setShowEnvelopeAnimation(true)
        }

        if (shouldBeUnlocked) {
          try {
            const content = decrypt(data.content_encrypted)
            setDecryptedContent(content)
            setShowEnvelope(false)
            setShowEnvelopeAnimation(false)
          } catch (error) {
            console.error('Error decrypting:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error loading letter:', error)
      router.push('/letters')
    } finally {
      setLoading(false)
    }
  }, [id, router, supabase, user])

  useEffect(() => {
    if (userLoading) return

    if (id && user) {
      loadLetter()
    } else if (id && !user) {
      router.push('/auth/login')
    }
  }, [id, user, userLoading, router, loadLetter])

  const unlockLetter = async () => {
    if (!letter) return

    if (!isUnlocked) {
      await supabase
        .from('letters')
        .update({
          is_unlocked: true,
          opened_at: new Date().toISOString(),
        })
        .eq('id', letter.id)

      if (letter.sender_id !== user?.id) {
        await createActivity(user?.id || '', letter.sender_id, 'letter_opened', {
          letter_id: letter.id,
          title: letter.title,
        })
      }
    }

    setIsUnlocked(true)
  }

  const handlePasswordSubmit = () => {
    if (!letter || !letter.password_hash) return

    if (verifyPassword(password, letter.password_hash)) {
      setPasswordError('')
      unlockLetter()
      openEnvelope()
    } else {
      setPasswordError('Incorrect password')
    }
  }

  const handlePuzzleSubmit = () => {
    if (!letter || !letter.puzzle_answer_hash) return

    const answerHash = hashPassword(puzzleAnswer.toLowerCase().trim())
    if (answerHash === letter.puzzle_answer_hash) {
      setPuzzleError('')
      unlockLetter()
      openEnvelope()
    } else {
      setPuzzleError('Incorrect answer. Try again!')
    }
  }

  const openEnvelope = async () => {
    if (!isUnlocked && letter?.password_hash) {
      if (!password) return
      handlePasswordSubmit()
      return
    }

    setShowEnvelope(false)
    await unlockLetter()
    setShowConfetti(true)

    if (letter) {
      try {
        const content = decrypt(letter.content_encrypted)
        setDecryptedContent(content)
      } catch (error) {
        console.error('Error decrypting:', error)
        alert('Failed to decrypt letter')
      }
    }

    setTimeout(() => setShowConfetti(false), 5000)
  }

  const speakLetter = () => {
    if (!decryptedContent) return

    const utterance = new SpeechSynthesisUtterance(
      decryptedContent.replace(/<[^>]*>/g, '')
    )
    utterance.rate = 0.9
    utterance.pitch = 1.1
    speechSynthesis.speak(utterance)
  }

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-rose-gold">
          <Heart className="w-16 h-16" />
        </div>
      </div>
    )
  }

  if (!letter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-vintage-ink">Letter not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-vintage-ink/70 hover:text-vintage-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <AnimatePresence>
          {showEnvelopeAnimation && letter?.letter_type === 'open_when' && !isUnlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {letter.puzzle_type && letter.puzzle_question ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center mb-8">
                  <HelpCircle className="w-16 h-16 mx-auto text-rose-gold mb-4" />
                  <h2 className="text-2xl font-handwriting text-vintage-ink mb-4">
                    Solve the Puzzle
                  </h2>
                  <p className="text-vintage-ink mb-6">{letter.puzzle_question}</p>
                  <input
                    type="text"
                    value={puzzleAnswer}
                    onChange={(e) => setPuzzleAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePuzzleSubmit()}
                    className="w-full max-w-xs mx-auto px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none mb-2"
                    placeholder="Your answer..."
                  />
                  {puzzleError && (
                    <p className="text-red-500 text-sm mb-4">{puzzleError}</p>
                  )}
                  <button
                    onClick={handlePuzzleSubmit}
                    className="px-8 py-4 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg"
                  >
                    Submit Answer
                  </button>
                </div>
              ) : null}
              <EnvelopeAnimation
                openWhenText={letter.open_when_condition || 'you need this'}
                onOpen={() => {
                  setShowEnvelopeAnimation(false)
                  openEnvelope()
                }}
                isUnlocked={isUnlocked}
              />
            </motion.div>
          )}
          {showEnvelope && !isUnlocked && (
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mb-8"
              >
                <Heart className="w-24 h-24 mx-auto text-rose-gold fill-rose-gold" />
              </motion.div>

              <h2 className="text-3xl font-handwriting text-vintage-ink mb-4">
                You have a letter
              </h2>

              {letter.scheduled_reveal_at && new Date(letter.scheduled_reveal_at) > new Date() && (
                <div className="mb-6 p-4 bg-rose-gold/10 rounded-lg">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-rose-gold" />
                  <p className="text-vintage-ink">
                    This letter will unlock on{' '}
                    {new Date(letter.scheduled_reveal_at).toLocaleString()}
                  </p>
                </div>
              )}

              {letter.password_hash && (
                <div className="mb-6">
                  <Lock className="w-8 h-8 mx-auto mb-4 text-rose-gold" />
                  <p className="text-vintage-ink mb-4">This letter is password protected</p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    className="w-full max-w-xs mx-auto px-4 py-3 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none mb-2"
                    placeholder="Enter password"
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm">{passwordError}</p>
                  )}
                </div>
              )}

              <button
                onClick={openEnvelope}
                className="px-8 py-4 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg hover:shadow-xl"
              >
                Open Letter
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {(!showEnvelope || isUnlocked) && decryptedContent && !showEnvelopeAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12"
          >
            <div className="mb-6 pb-6 border-b border-vintage-ink/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">
                    {letter.title}
                  </h1>
                  <div className="flex items-center gap-2 text-vintage-ink/70">
                    <User className="w-4 h-4" />
                    <span>From {letter.sender.display_name || letter.sender.email}</span>
                  </div>
                </div>
                <button
                  onClick={speakLetter}
                  className="p-2 hover:bg-rose-gold/10 rounded-lg transition-colors"
                  title="Read aloud"
                >
                  <Volume2 className="w-5 h-5 text-rose-gold" />
                </button>
              </div>
              <p className="text-sm text-vintage-ink/60">
                {new Date(letter.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div
              className="prose prose-lg max-w-none vintage-paper p-6 rounded-lg"
              dangerouslySetInnerHTML={{ __html: decryptedContent }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}