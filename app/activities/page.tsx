'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Sparkles,
  Heart,
  Calendar,
  Music,
  Camera,
  CheckCircle2,
  PlusCircle,
  Gift,
} from 'lucide-react'

const curatedDateIdeas = [
  {
    title: 'Golden Hour Picnic',
    description: 'Pack your favorite snacks, a blanket, and watch the sunset together.',
    category: 'Outdoors',
    duration: '2 hrs',
  },
  {
    title: 'Memory Lane Night',
    description: 'Recreate your first date or cook a dish that means something to both of you.',
    category: 'At Home',
    duration: 'Evening',
  },
  {
    title: 'Art Crawl Adventure',
    description: 'Visit a local gallery or museum, then grab coffee and sketch each other.',
    category: 'Creative',
    duration: '3 hrs',
  },
  {
    title: 'Stargazing & Stories',
    description: 'Drive somewhere quiet, bring music, and share stories under the stars.',
    category: 'Outdoors',
    duration: 'Late night',
  },
  {
    title: 'Cozy Movie Studio',
    description: 'Build a fort, pick a theme, and curate a movie marathon with custom tickets.',
    category: 'At Home',
    duration: 'Night',
  },
  {
    title: 'Adventure Dice',
    description: 'Create dice with activities, foods, and locations—roll to let fate plan your date.',
    category: 'Playful',
    duration: 'Flexible',
  },
]

const conversationPrompts = [
  'What would our dream tiny home look like and where would we park it?',
  'Which five songs describe our relationship story so far?',
  'What tradition do you want us to start this year?',
  'If we wrote a children’s book about us, what would the lesson be?',
  'Where do you picture us celebrating a future anniversary?',
]

const funChallenges = [
  { id: 'playlist', title: 'Create a 10-song “us” playlist', icon: <Music className="w-4 h-4" /> },
  { id: 'photo', title: 'Take 5 candid photos of each other today', icon: <Camera className="w-4 h-4" /> },
  { id: 'love-note', title: 'Hide a surprise love note somewhere unexpected', icon: <Heart className="w-4 h-4" /> },
  { id: 'calendar', title: 'Plan a micro date for each day next week', icon: <Calendar className="w-4 h-4" /> },
  { id: 'gift', title: 'Create a digital mini gift (playlist, meme pack, etc.)', icon: <Gift className="w-4 h-4" /> },
]

export default function ActivitiesPage() {
  const router = useRouter()
  const [customIdeas, setCustomIdeas] = useState<string[]>([])
  const [newIdea, setNewIdea] = useState('')
  const [featuredIdea, setFeaturedIdea] = useState(() => curatedDateIdeas[0])
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedIdeas = localStorage.getItem('customDateIdeas')
    const storedChallenges = localStorage.getItem('completedFunChallenges')
    if (storedIdeas) {
      setCustomIdeas(JSON.parse(storedIdeas))
    }
    if (storedChallenges) {
      setCompletedChallenges(JSON.parse(storedChallenges))
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('customDateIdeas', JSON.stringify(customIdeas))
  }, [customIdeas])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('completedFunChallenges', JSON.stringify(completedChallenges))
  }, [completedChallenges])

  const randomIdea = () => {
    const pool = curatedDateIdeas
    const next = pool[Math.floor(Math.random() * pool.length)]
    setFeaturedIdea(next)
  }

  const addCustomIdea = () => {
    if (!newIdea.trim()) return
    setCustomIdeas([...customIdeas, newIdea.trim()])
    setNewIdea('')
  }

  const removeCustomIdea = (index: number) => {
    setCustomIdeas(customIdeas.filter((_, idx) => idx !== index))
  }

  const toggleChallenge = (id: string) => {
    setCompletedChallenges(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const groupedIdeas = useMemo(() => {
    const map: Record<string, typeof curatedDateIdeas> = {}
    curatedDateIdeas.forEach(idea => {
      if (!map[idea.category]) {
        map[idea.category] = []
      }
      map[idea.category].push(idea)
    })
    return map
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-dusty-blue py-8 px-4 pb-24 md:pb-8">
      <div className="container mx-auto max-w-5xl">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-vintage-ink/70 hover:text-vintage-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="uppercase text-xs tracking-[0.3em] text-rose-gold">New</p>
            <h1 className="text-4xl font-handwriting text-vintage-ink mb-2">Activities</h1>
            <p className="text-vintage-ink/70 max-w-2xl">
              A playful hub for date ideas, mini challenges, and sweet prompts to keep the spark alive.
            </p>
          </div>
          <button
            onClick={randomIdea}
            className="flex items-center gap-2 px-5 py-3 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Surprise us
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-rose-gold/20">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-gold mb-2">Spotlight idea</p>
            <h2 className="text-2xl font-semibold text-vintage-ink mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-gold" />
              {featuredIdea.title}
            </h2>
            <p className="text-vintage-ink/80 mb-4">{featuredIdea.description}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-rose-gold/10 text-rose-gold">{featuredIdea.category}</span>
              <span className="px-3 py-1 rounded-full bg-vintage-paper/60 text-vintage-ink/70">
                {featuredIdea.duration}
              </span>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-rose-gold/20">
            <p className="text-xs uppercase tracking-[0.3em] text-rose-gold mb-2">Custom ideas</p>
            <h2 className="text-2xl font-semibold text-vintage-ink mb-4">Build your own list</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                placeholder="Add a cozy idea..."
                className="flex-1 px-4 py-2 border border-vintage-ink/20 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent outline-none"
              />
              <button
                onClick={addCustomIdea}
                className="px-4 py-2 bg-rose-gold text-white rounded-lg font-semibold hover:bg-rose-gold/90 transition-all"
              >
                Add
              </button>
            </div>
            {customIdeas.length === 0 ? (
              <p className="text-sm text-vintage-ink/70">Your ideas will live here. Add as many as you like!</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {customIdeas.map((idea, idx) => (
                  <li
                    key={`${idea}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-vintage-paper/60 px-3 py-2 text-sm text-vintage-ink"
                  >
                    <span>{idea}</span>
                    <button
                      onClick={() => removeCustomIdea(idx)}
                      className="text-vintage-ink/50 hover:text-rose-gold transition-colors text-xs"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedIdeas).map(([category, ideas]) => (
            <div key={category} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-vintage-ink/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-vintage-ink">{category} adventures</h3>
                <span className="text-sm text-vintage-ink/60">{ideas.length} ideas</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {ideas.map((idea) => (
                  <div
                    key={idea.title}
                    className="p-4 rounded-xl border border-vintage-ink/10 bg-vintage-paper/60 hover:shadow-lg transition-shadow"
                  >
                    <h4 className="font-semibold text-vintage-ink mb-1">{idea.title}</h4>
                    <p className="text-sm text-vintage-ink/70 mb-3">{idea.description}</p>
                    <div className="flex items-center gap-3 text-xs text-vintage-ink/60">
                      <span>{idea.duration}</span>
                      <span className="w-1 h-1 bg-rose-gold rounded-full" />
                      <span>Save to your list ➜</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-vintage-ink/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-rose-gold" />
              <h3 className="text-xl font-semibold text-vintage-ink">Conversation sparks</h3>
            </div>
            <div className="space-y-3">
              {conversationPrompts.map((prompt) => (
                <div key={prompt} className="p-3 rounded-xl bg-vintage-paper/70 text-sm text-vintage-ink/90">
                  {prompt}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-vintage-ink/10">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="w-5 h-5 text-rose-gold" />
              <h3 className="text-xl font-semibold text-vintage-ink">Mini challenges</h3>
            </div>
            <div className="space-y-3">
              {funChallenges.map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => toggleChallenge(challenge.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    completedChallenges[challenge.id]
                      ? 'border-rose-gold bg-rose-gold/10 text-rose-gold'
                      : 'border-vintage-ink/10 bg-vintage-paper/60 text-vintage-ink'
                  }`}
                >
                  <span>{challenge.icon}</span>
                  <span className="flex-1 text-left text-sm">{challenge.title}</span>
                  {completedChallenges[challenge.id] && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

