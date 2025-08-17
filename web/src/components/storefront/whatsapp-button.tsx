'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import './whatsapp-button.css'

interface WhatsAppButtonProps {
  phoneNumber: string
  message?: string
}

export function WhatsAppButton({ phoneNumber, message }: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show button immediately after component mounts
    // Small delay for smooth entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleClick = () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    const whatsappMessage = message || 'Olá! Vi um produto na sua loja e gostaria de mais informações.'
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="fixed bottom-0 right-0 z-[9999] pointer-events-none p-6 md:p-8">
      <button
        onClick={handleClick}
        className={`whatsapp-button pointer-events-auto flex h-20 w-20 md:h-24 md:w-24 items-center justify-center transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-75'
        }`}
        aria-label="Contato via WhatsApp"
      >
        <Image
          src="/icons8-whatsapp.gif"
          alt="WhatsApp"
          width={120}
          height={120}
          className="w-full h-full"
          unoptimized
        />
      </button>
    </div>
  )
}