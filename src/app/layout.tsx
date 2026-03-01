import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GhostScan — Know What They Know',
  description: 'Verify your identity, scan breach intelligence, and take back your data.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#080b12] text-white antialiased font-sans">{children}</body>
    </html>
  )
}
