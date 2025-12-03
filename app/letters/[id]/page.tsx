'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader } from 'lucide-react'
import Link from 'next/link'
import { EnvelopeAnimation } from '@/components/EnvelopeAnimation'
import { decrypt } from '@/lib/encryption'

interface Letter {
  id: string
  title: string
  content: string 
  sender_id: string // FIX: Changed from author_id to sender_id
  created_at: string
  open_when: string | null
  is_draft: boolean
  author: {
    display_name: string
  }
}

interface FullLetter {
  id: string
  title: string
  content_encrypted: string
  sender_id: string // FIX: Changed from author_id to sender_id
  created_at: string
  open_when_condition: string | null 
  is_draft: boolean
  password_hash: string | null;
  scheduled_reveal_at: string | null;
  is_unlocked: boolean;
  opened_at: string | null;
  author: {
    display_name: string
  }
}

// Placeholder to replace the functionality of the missing LetterDetail component
const LetterDetailPlaceholder = ({ letter, fullData }: { letter: Letter, fullData: FullLetter }) => {
  const [isOpened, setIsOpened] = useState(fullData.opened_at !== null)
  const [isUnlocked, setIsUnlocked] = useState(fullData.is_unlocked)
  const [decryptedContent, setDecryptedContent] = useState(letter.content)

  const handleOpen = () => {
    // Attempt to decrypt when opened
    try {
        const content = decrypt(fullData.content_encrypted);
        setDecryptedContent(content);
    } catch (e) {
        setDecryptedContent("Error decrypting content. Check your ENCRYPTION_KEY.");
        console.error(e);
    }
    setIsOpened(true);
  }

  return (
    <>
      <h1 className="text-4xl font-handwriting text-vintage-ink mb-6">{letter.title}</h1>

      {!isOpened ? (
        <EnvelopeAnimation 
          openWhenText={fullData.open_when_condition || "Just Because"}
          onOpen={handleOpen}
          isUnlocked={isUnlocked}
        />
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto">
          <p className="text-xl font-serif whitespace-pre-wrap">{decryptedContent}</p>
          <p className="mt-6 text-right text-vintage-ink/70">From: {letter.author.display_name} • Sent: {new Date(letter.created_at).toLocaleDateString()}</p>
          {fullData.opened_at && <p className="text-right text-vintage-ink/60 text-sm">Opened: {new Date(fullData.opened_at).toLocaleDateString()}</p>}
        </div>
      )}
    </>
  )
}


export default function LetterPage() {
  const params = useParams()
  const letterId = params?.id as string
  const supabase = createSupabaseClient()
  
  const [letter, setLetter] = useState<FullLetter | null>(null)
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
            content_encrypted,
            sender_id,
            created_at,
            open_when_condition,
            is_draft,
            password_hash,
            scheduled_reveal_at,
            is_unlocked,
            opened_at,
            author:profiles!letters_sender_id_fkey(display_name)
          `)
          .eq('id', letterId)
          .single()

        if (fetchError) {
          setError('Letter not found')
          console.error('Fetch error:', fetchError)
          return
        }

        // FIX: Extract single profile object from the array returned by Supabase to fix TypeScript error
        const rawData = data as any;
        const authorProfile = (Array.isArray(rawData.author) && rawData.author.length > 0) 
            ? rawData.author[0] 
            : { display_name: 'Unknown Sender' };

        const cleanedData: FullLetter = {
            ...rawData,
            author: authorProfile, // Assign the single object
        } as FullLetter;
        
        setLetter(cleanedData)
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
  
  const formattedLetter: Letter = {
    id: letter.id,
    title: letter.title,
    content: "Encrypted Content. Click to open.", // Placeholder before decryption
    sender_id: letter.sender_id,
    created_at: letter.created_at,
    open_when: letter.open_when_condition,
    is_draft: letter.is_draft,
    author: letter.author,
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

        <LetterDetailPlaceholder letter={formattedLetter} fullData={letter} />
      </div>
    </div>
  )
}