import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ARES - Project Management',
  description: 'Modern project management with gaming aesthetics',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  )
}
