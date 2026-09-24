import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AppShell } from '@/components/layout/AppShell'
import { BusinessProvider } from '@/context/BusinessContext'
import { getActiveNegocioServer } from '@/lib/business-server'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NOVA App - Gestión Multi-Negocio (3D & BG)',
  description: 'Panel de gestión para impresión 3D y juegos de mesa',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialNegocio = await getActiveNegocioServer()

  return (
    <html lang="es" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} min-h-full h-full w-full bg-[#F8F6F2] text-[#241C15] antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <BusinessProvider initialNegocio={initialNegocio}>
            <AppShell>
              {children}
            </AppShell>
          </BusinessProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}

