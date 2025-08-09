'use client'

import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'

interface WhatsAppButtonProps {
  phoneNumber: string
  message?: string
}

export function WhatsAppButton({ phoneNumber, message }: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show button after scroll
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100)
    }

    // Show immediately on mobile
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setIsVisible(true)
    } else {
      window.addEventListener('scroll', handleScroll)
      handleScroll()
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const whatsappMessage = message || 'Olá! Vi um produto na sua loja e gostaria de mais informações.'
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-300 hover:bg-green-600 hover:scale-110 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="h-6 w-6" fill="currentColor" />
    </button>
  )
}