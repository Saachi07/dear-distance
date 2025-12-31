'use client'

import Link from 'next/link'
import { HeartCrack, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center max-w-lg w-full border border-rose-gold/20">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-rose-gold/10 rounded-full">
            <HeartCrack className="w-16 h-16 text-rose-gold" />
          </div>
        </div>
        
        <h1 className="text-4xl font-handwriting text-vintage-ink mb-4">
          Oops, wrong turn
        </h1>
        
        <p className="text-vintage-ink/70 mb-8 text-lg font-serif">
          We couldn't find the page you were looking for. It might have moved or dissolved into a memory.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-md group"
          >
            <Home className="w-5 h-5" />
            Return to Dashboard
          </Link>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent text-vintage-ink/60 hover:text-vintage-ink transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}