'use client'
import { motion } from 'framer-motion'

const variants = {
  fadeUp: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } },
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  scaleIn: { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 } },
  slideLeft: { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } },
  slideRight: { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } },
}

type VariantKey = keyof typeof variants

interface AnimatedSectionProps {
  variant?: VariantKey
  delay?: number
  once?: boolean
  children: React.ReactNode
  className?: string
}

export function AnimatedSection({ variant = 'fadeUp', delay = 0, once = true, children, className }: AnimatedSectionProps) {
  const v = variants[variant]
  return (
    <motion.div
      initial={v.initial}
      whileInView={v.animate}
      viewport={{ once, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
