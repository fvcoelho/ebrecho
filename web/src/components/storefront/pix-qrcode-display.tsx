'use client'

import { PixPaymentBase } from './pix-payment-base'

interface PixQRCodeDisplayProps {
  pixKey: string
  amount: number
  productName: string
  storeName: string
  merchantCity?: string
  productId: string
  partnerId: string
  whatsappNumber?: string
  whatsappName?: string
  buttonText: string
}

export function PixQRCodeDisplay(props: PixQRCodeDisplayProps) {
  const isIconOnly = !props.buttonText || props.buttonText === ''
  
  return (
    <PixPaymentBase
      {...props}
      buttonClassName={
        isIconOnly 
          ? "relative flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-full p-3"
          : "relative w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-full px-10 py-6 text-lg"
      }
      buttonSize={isIconOnly ? "icon" : "lg"}
      containerClassName={isIconOnly ? "" : "mt-2 bg-gray-50 p-2 rounded-lg border"}
    />
  )
}