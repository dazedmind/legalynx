import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LegalynX',
  description: 'Upload PDF documents and ask questions using AI-powered retrieval-augmented generation',
  keywords: 'RAG, PDF, AI, Document Analysis, Question Answering, LlamaIndex, Gemini',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <NextAuthSessionProvider> */}
          <AuthProvider>
            {children}
          </AuthProvider>
        {/* </NextAuthSessionProvider> */}
      </body>
    </html>
  )
}