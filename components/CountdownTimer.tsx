'use client'

import { useEffect, useState } from 'react'
import { Clock, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CountdownTimerProps {
  targetDate: string | Date
  title: string
}

export function CountdownTimer({ targetDate, title }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const target = new Date(targetDate)
      const now = new Date()
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setIsExpired(true)
        setTimeRemaining('Time has arrived! 🎉')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div className="bg-gradient-to-br from-rose-gold/20 to-soft-pink/20 rounded-2xl p-8 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-6 h-6 text-rose-gold" />
        <h3 className="text-2xl font-semibold text-vintage-ink">{title}</h3>
      </div>
      <div className="flex items-center gap-2 text-vintage-ink/70 mb-4">
        <Calendar className="w-4 h-4" />
        <span>{new Date(targetDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</span>
      </div>
      <div className={`text-4xl font-bold ${isExpired ? 'text-rose-gold' : 'text-vintage-ink'}`}>
        {timeRemaining}
      </div>
      {!isExpired && (
        <p className="text-sm text-vintage-ink/60 mt-2">
          {formatDistanceToNow(new Date(targetDate), { addSuffix: true })}
        </p>
      )}
    </div>
  )
}
