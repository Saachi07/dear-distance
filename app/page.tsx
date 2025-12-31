'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from './providers'
import Link from 'next/link'
import { Heart, Mail, Lock } from 'lucide-react'

export default function Home() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-soft-pink via-white to-dusty-blue">
        <div className="animate-pulse text-rose-gold">
          <Heart className="w-16 h-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-heart-beat">
            <Heart className="w-20 h-20 mx-auto text-rose-gold fill-rose-gold" />
          </div>
          
          <h1 className="text-6xl font-handwriting mb-6 text-vintage-ink">
            Dear Distance
          </h1>
          
          <p className="text-xl text-vintage-ink/80 mb-12 max-w-2xl mx-auto">
            A personal, intimate space for long-distance partners to share letters, 
            memories, and moments together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-white/80 text-vintage-ink rounded-lg font-semibold hover:bg-white transition-all shadow-lg hover:shadow-xl border-2 border-rose-gold/30"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <Mail className="w-12 h-12 text-rose-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-vintage-ink">Rich Letters</h3>
              <p className="text-vintage-ink/70">
                Create beautiful letters with photos, voice recordings, videos, and music.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <Lock className="w-12 h-12 text-rose-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-vintage-ink">Private & Secure</h3>
              <p className="text-vintage-ink/70">
                Your letters are encrypted and protected. Share only with your partner.
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <Heart className="w-12 h-12 text-rose-gold mx-auto mb-4 fill-rose-gold" />
              <h3 className="text-xl font-semibold mb-2 text-vintage-ink">Memories Together</h3>
              <p className="text-vintage-ink/70">
                Build a shared timeline of photos, quotes, and precious moments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
