'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Heart, Mail } from 'lucide-react'

interface EnvelopeAnimationProps {
  openWhenText: string
  onOpen: () => void
  isUnlocked: boolean
}

export function EnvelopeAnimation({ openWhenText, onOpen, isUnlocked }: EnvelopeAnimationProps) {
  const [isOpening, setIsOpening] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragY, setDragY] = useState(0)

  const handleOpen = () => {
    if (isUnlocked) {
      setIsOpening(true)
      setTimeout(() => {
        onOpen()
      }, 1000)
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const envelope = document.getElementById('envelope')
    if (envelope) {
      const rect = envelope.getBoundingClientRect()
      const relativeY = clientY - rect.top
      setDragY(Math.max(0, Math.min(200, relativeY - 100)))
      
      if (dragY > 150 && isUnlocked) {
        handleOpen()
      }
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (dragY > 150 && isUnlocked) {
      handleOpen()
    } else {
      setDragY(0)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        id="envelope"
        className="relative cursor-pointer"
        onClick={isUnlocked ? handleOpen : undefined}
        onMouseDown={isUnlocked ? handleDragStart : undefined}
        onMouseMove={isUnlocked ? handleDrag : undefined}
        onMouseUp={isUnlocked ? handleDragEnd : undefined}
        onMouseLeave={isUnlocked ? handleDragEnd : undefined}
        onTouchStart={isUnlocked ? handleDragStart : undefined}
        onTouchMove={isUnlocked ? handleDrag : undefined}
        onTouchEnd={isUnlocked ? handleDragEnd : undefined}
        animate={isOpening ? { scale: 1.1, rotateY: 180 } : {}}
        transition={{ duration: 1 }}
      >
        {/* Envelope */}
        <div className="relative w-80 h-64">
          {/* Envelope back */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-rose-200 to-rose-300 rounded-lg shadow-2xl"
            style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)',
            }}
          />
          
          {/* Envelope front */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg shadow-xl"
            style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)',
              transform: isOpening ? 'rotateX(180deg)' : `translateY(${-dragY}px)`,
              transformOrigin: 'bottom',
            }}
            animate={isOpening ? { rotateX: 180 } : { y: -dragY }}
            transition={{ duration: 0.3 }}
          >
            {/* Envelope flap */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-rose-300 to-rose-400 rounded-t-lg" />
          </motion.div>

          {/* Letter inside */}
          <motion.div
            className="absolute inset-x-4 bottom-4 bg-white rounded-lg shadow-lg p-6"
            animate={isOpening ? { y: -300, opacity: 0 } : { y: dragY, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ zIndex: isOpening ? 10 : 1 }}
          >
            <div className="text-center">
              <Heart className="w-8 h-8 mx-auto text-rose-gold mb-2" />
              <p className="text-vintage-ink font-handwriting text-lg">
                {openWhenText}
              </p>
            </div>
          </motion.div>

          {/* Text on envelope */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto text-rose-gold mb-2" />
              <p className="text-vintage-ink font-handwriting text-xl font-semibold">
                Open when...
              </p>
              <p className="text-rose-gold font-handwriting text-lg mt-2">
                {openWhenText}
              </p>
              {!isUnlocked && (
                <p className="text-vintage-ink/60 text-sm mt-4">
                  Complete the puzzle to unlock
                </p>
              )}
              {isUnlocked && !isOpening && (
                <p className="text-vintage-ink/60 text-sm mt-4 animate-pulse">
                  Click or drag to open
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

