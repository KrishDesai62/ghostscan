'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, KeyRound } from 'lucide-react'
import PasswordBreachChecker from '@/components/dashboard/PasswordBreachChecker'

export default function PasswordCheckerPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen grid-bg">
      <header className="sticky top-0 z-40 border-b border-[#1e2d45] bg-[#080b12]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#00ff9d] rounded-md flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-[#080b12]" />
            </div>
            <span className="font-bold">Ghost<span className="text-[#00ff9d]">Scan</span></span>
            <span className="hidden md:block text-gray-600 text-sm font-mono">| Password Breach Detector</span>
          </div>
          <button onClick={() => router.push('/dashboard')} className="gs-btn-ghost text-sm py-1.5 px-3 flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="gs-card px-4 py-3 text-xs text-gray-500 flex items-start gap-2">
          <KeyRound className="w-3.5 h-3.5 text-[#4cc9f0] mt-0.5 flex-shrink-0" />
          <span>
            This check uses the Have I Been Pwned Pwned Passwords API with k-anonymity. Your raw password is not sent.
          </span>
        </div>
        <PasswordBreachChecker />
      </main>
    </div>
  )
}
