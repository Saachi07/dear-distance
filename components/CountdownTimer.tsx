'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CountdownTimerProps {
  targetDate: string
  title: string
  userTimezone?: string
  partnerTimezone?: string | null
}

export function CountdownTimer({ 
  targetDate, 
  title, 
  userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  partnerTimezone 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('')

  // Simple formatter for the specific timezones
  const formatTime = (date: string, zone: string) => {
    return new Date(date).toLocaleString('en-US', {
      timeZone: zone,
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const distance = target - now

      if (distance < 0) {
        setTimeLeft("It's time!")
        return
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24))
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      
      setTimeLeft(`${d}d ${h}h ${m}m`)
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-rose-500" />
        <h3 className="text-xl font-bold">{title}</h3>
      </div>

      <div className="text-3xl font-bold text-gray-800 mb-4">
        {timeLeft}
      </div>

      {/* The Comparison Section */}
      <div className="grid md:grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
        <div>
          <span className="block text-gray-500 text-xs uppercase">Your Time</span>
          <span className="font-medium">{formatTime(targetDate, userTimezone)}</span>
        </div>
        
        {partnerTimezone && partnerTimezone !== userTimezone && (
          <div>
            <span className="block text-gray-500 text-xs uppercase">Partner's Time</span>
            <span className="font-medium">{formatTime(targetDate, partnerTimezone)}</span>
          </div>
        )}
      </div>
    </div>
  )
}