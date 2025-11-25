'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Confetti from 'react-confetti'
import { Gift, Heart } from 'lucide-react'

interface GiftBoxAnimationProps {
  onOpen?: () => void
  children?: React.ReactNode
}

export function GiftBoxAnimation({ onOpen, children }: GiftBoxAnimationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5000)
    onOpen?.()
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={300}
          gravity={0.1}
          colors={['#f43f5e', '#ec4899', '#f472b6', '#fbbf24', '#f59e0b']}
        />
      )}
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="relative cursor-pointer"
          onClick={!isOpen ? handleOpen : undefined}
          whileHover={!isOpen ? { scale: 1.05 } : {}}
          whileTap={!isOpen ? { scale: 0.95 } : {}}
        >
          {!isOpen ? (
            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Gift box */}
              <div className="relative w-64 h-64">
                {/* Box base */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600 rounded-lg shadow-2xl" />
                
                {/* Box lid */}
                <motion.div
                  className="absolute inset-x-0 top-0 h-20 bg-gradient-to-br from-rose-500 to-rose-700 rounded-t-lg shadow-xl"
                  animate={isOpen ? { y: -80, rotateX: 180 } : {}}
                  transition={{ duration: 0.8 }}
                />
                
                {/* Ribbon vertical */}
                <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-rose-300 transform -translate-x-1/2 rounded" />
                
                {/* Ribbon horizontal */}
                <div className="absolute top-1/2 left-0 right-0 h-8 bg-rose-300 transform -translate-y-1/2 rounded" />
                
                {/* Bow */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <div className="w-16 h-16 bg-rose-200 rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-rose-600" />
                  </div>
                </div>
              </div>
              
              <p className="text-center mt-4 text-vintage-ink font-handwriting text-lg">
                Click to open your gift! 🎁
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md"
            >
              <Gift className="w-16 h-16 mx-auto text-rose-gold mb-4" />
              {children || (
                <div className="text-center">
                  <Heart className="w-12 h-12 mx-auto text-rose-gold mb-2" />
                  <p className="text-vintage-ink font-handwriting text-xl">
                    Surprise! 💕
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  )
}

