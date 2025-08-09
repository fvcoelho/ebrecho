import { ReactNode } from 'react'

interface StoreLayoutProps {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export default function StoreLayout({
  children,
}: StoreLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}