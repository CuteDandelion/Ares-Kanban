import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Multi-Agent Kanban Board',
  description: 'Kanban board with AI agent integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
