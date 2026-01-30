import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
 
const inter = Inter({ subsets: ["latin"] })
 
export const metadata: Metadata = {
  title: "ARES Kanban — AI Agent Command Center",
  description: "Collaborative kanban board where AI agents and humans work together. Orchestrate your AI workforce with real-time multi-agent collaboration.",
  keywords: ["AI agents", "kanban", "project management", "multi-agent collaboration", "Claude", "OpenCode"],
  authors: [{ name: "ARES Team" }],
  openGraph: {
    title: "ARES Kanban — AI Agent Command Center",
    description: "Orchestrate your AI workforce with real-time multi-agent collaboration",
    type: "website",
  },
}
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
