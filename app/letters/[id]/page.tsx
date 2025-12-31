'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader } from 'lucide-react'
import Link from 'next/link'
import { EnvelopeAnimation } from '@/components/EnvelopeAnimation'
import { decrypt } from '@/lib/encryption'

// Helper interfaces for type safety
interface ProfileSubset {
  display_name: string | null
}

interface Letter {
  id: string
  title: string
  content: string 
  sender_id: string
  created_at: string
  open_when: string | null
  author: ProfileSubset
}

interface FullLetter {
  id: string
  title: string
  content_encrypted: string
  sender_id: string
  recipient_id: string | null;
  created_at: string
  open_when_condition: string | null 
  password_hash: string | null;
  scheduled_reveal_at: string | null;
  is_unlocked: boolean;
  opened_at: string | null;
  author: ProfileSubset | ProfileSubset[] 
  recipient_profile: ProfileSubset | ProfileSubset[] | null
}

// Helper to safely extract the display name
const getSingleProfile = (profiles: ProfileSubset | ProfileSubset[] | null): ProfileSubset => {
  if (!profiles) return { display_name: 'Unknown User' }
  if (Array.isArray(profiles) && profiles.length > 0) {
    return profiles[0]
  }
  return Array.isArray(profiles) ? { display_name: 'Unknown User' } : profiles
}

const LetterDetailPlaceholder = ({ letter, fullData }: { letter: Letter, fullData: FullLetter }) => {
  // Determine if the letter is already accessible (opened or unlocked)
  const initiallyOpened = fullData.opened_at !== null || fullData.is_unlocked;

  const [isOpened, setIsOpened] = useState(initiallyOpened)
  // Removed unused setIsUnlocked
  const [isUnlocked] = useState(fullData.is_unlocked)
  const [decryptedContent, setDecryptedContent] = useState(letter.content)

  // Automatically decrypt if the letter is already open when the page loads
  useEffect(() => {
    if (initiallyOpened) {
      try {
        const content = decrypt(fullData.content_encrypted);
        setDecryptedContent(content);
      } catch (e) {
        console.error("Auto-decryption failed:", e);
        setDecryptedContent("Error decrypting content. Please check your ENCRYPTION_KEY.");
      }
    }
  }, [initiallyOpened, fullData.content_encrypted]);

  const handleOpen = () => {
    try {
        const content = decrypt(fullData.content_encrypted);
        setDecryptedContent(content);
    } catch (e) {
        setDecryptedContent("Error decrypting content. Check your ENCRYPTION_KEY.");
        console.error(e);
    }
    setIsOpened(true);
  }

  const senderProfile = getSingleProfile(fullData.author);

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
          <div className="mt-8 pt-4 border-t border-vintage-ink/10 flex justify-between items-end">
            <div>
              {fullData.opened_at && (
                <p className="text-vintage-ink/60 text-sm">
                  Opened: {new Date(fullData.opened_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-vintage-ink/70 font-semibold">
                From: {senderProfile.display_name || 'Unknown Sender'}
              </p>
              <p className="text-vintage-ink/60 text-sm">
                Sent: {new Date(letter.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
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
            recipient_id,
            created_at,
            open_when_condition,
            password_hash,
            scheduled_reveal_at,
            is_unlocked,
            opened_at,
            author:profiles!sender_id(display_name),
            recipient_profile:profiles!recipient_id(display_name)
          `)
          .eq('id', letterId)
          .single()

        if (fetchError) {
          console.error('Fetch error details:', fetchError)
          setError(fetchError.message || 'Letter not found or access denied.')
          return
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = data as any;
        const authorProfile = getSingleProfile(rawData.author);

        const cleanedData: FullLetter = {
            ...rawData,
            author: authorProfile,
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
          <p className="text-red-500 mb-6 bg-white/50 p-4 rounded-lg max-w-md mx-auto">
            {error || 'Letter not found'}
          </p>
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
  
  const senderProfile = getSingleProfile(letter.author);

  const formattedLetter: Letter = {
    id: letter.id,
    title: letter.title,
    content: "Encrypted Content. Click to open.",
    sender_id: letter.sender_id,
    created_at: letter.created_at,
    open_when: letter.open_when_condition,
    author: senderProfile,
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