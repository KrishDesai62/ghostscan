'use client'
import { motion } from 'framer-motion'

interface AnimatedStaggerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function AnimatedStagger({ children, className, staggerDelay = 0.08 }: AnimatedStaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-30px' }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: staggerDelay } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedStaggerItemProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedStaggerItem({ children, className }: AnimatedStaggerItemProps) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
