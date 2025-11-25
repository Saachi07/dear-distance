'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import LetterDetail from '@/components/LetterDetail'
import { ArrowLeft, Loader } from 'lucide-react'
import Link from 'next/link'

interface Letter {
  id: string
  title: string
  content: string
  author_id: string
  created_at: string
  open_when: string | null
  is_draft: boolean
  author: {
    display_name: string
  }
}

export default function LetterPage() {
  const params = useParams()
  const letterId = params?.id as string
  const supabase = createSupabaseClient()
  
  const [letter, setLetter] = useState<Letter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!letterId) return

    const fetchLetter = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('letters')
          .select(`
            id,
            title,
            content,
            author_id,
            created_at,
            open_when,
            is_draft,
            author:profiles(display_name)
          `)
          .eq('id', letterId)
          .single()

        if (fetchError) {
          setError('Letter not found')
          console.error('Fetch error:', fetchError)
          return
        }

        setLetter(data)
      } catch (err) {
        setError('Error loading letter')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLetter()
  }, [letterId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-rose-gold" />
      </div>
    )
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-soft-pink via-white to-dusty-blue px-4">
        <div className="text-center">
          <h1 className="text-3xl font-handwriting text-vintage-ink mb-4">Oops!</h1>
          <p className="text-vintage-ink/70 mb-6">{error || 'Letter not found'}</p>
          <Link
            href="/letters"
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Letters
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/letters"
          className="mb-4 inline-flex items-center gap-2 text-vintage-ink/70 hover:text-vintage-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Letters
        </Link>

        <LetterDetail letter={letter} />
      </div>
    </div>
  )
}
