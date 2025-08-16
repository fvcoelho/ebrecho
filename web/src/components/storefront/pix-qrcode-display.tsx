'use client'

import { useState } from 'react'
import { Copy, Check, QrCode } from 'lucide-react'
import { PixCanvas, payload } from '@/lib/pix'
import { copyToClipboard } from '@/lib/clipboard'
import { pixTransactionService } from '@/lib/api/pix-transactions'

interface PixQRCodeDisplayProps {
  pixKey: string
  amount: number
  productName: string
  storeName: string
  merchantCity?: string
  productId: string
  partnerId: string
}

export function PixQRCodeDisplay({ 
  pixKey, 
  amount, 
  productName, 
  storeName, 
  merchantCity = 'SAO PAULO',
  productId,
  partnerId
}: PixQRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [pixPayloadData, setPixPayloadData] = useState('')
  const [transactionCode] = useState(() => {
    const env = process.env.NODE_ENV === 'production' ? 'P' : 'D'
    return `${env}-${Date.now().toString().slice(-6)}`
  })
  
  // Generate PIX payload using the proper Brazilian PIX standard
  const generatePixPayload = async () => {
    try {
      const payloadStr = payload({
        pixkey: pixKey,
        merchant: storeName,
        city: merchantCity,
        amount: amount,
        code: transactionCode,
        ignoreErrors: false
      })
      setPixPayloadData(payloadStr)
      
      // Create transaction record in database
      try {
        await pixTransactionService.createPixTransaction({
          transactionCode,
          productId,
          pixKey,
          amount,
          merchantName: storeName,
          merchantCity,
          pixPayload: payloadStr,
          expiresIn: 30 // 30 minutes expiration
        })
        console.log('PIX transaction created:', transactionCode)
      } catch (transactionError) {
        console.warn('Failed to create PIX transaction record:', transactionError)
        // Continue with payload generation even if transaction creation fails
      }
      
      return payloadStr
    } catch (error) {
      console.error('Error generating PIX payload:', error)
      const fallback = `PIX\nChave: ${pixKey}\nValor: R$ ${amount.toFixed(2)}\nProduto: ${productName}\nLoja: ${storeName}`
      setPixPayloadData(fallback)
      return fallback
    }
  }
  
  const handleCopyPix = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Use existing payload data, don't regenerate
    const success = await copyToClipboard(pixPayloadData)
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      // Show user feedback that copy failed
      alert('Falha ao copiar. Por favor, selecione o texto na caixa abaixo e copie manualmente.')
    }
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }
  
  const handleToggleQR = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowQR(!showQR)
    if (!showQR) {
      // Generate payload when showing QR
      await generatePixPayload()
    }
  }
  
  
  if (!pixKey) {
    return null
  }
  
  return (
    <div 
      className="mt-2 bg-gray-50 p-2 rounded-lg border"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div className="flex flex-col items-center space-y-2">
        {!showQR ? (
          /* PIX Button */
          <button
            onClick={handleToggleQR}
            className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
          >
            <QrCode className="h-3 w-3" />
            PIX {formatPrice(amount)}
          </button>
        ) : (
          /* QR Code Display */
          <div className="flex flex-col items-center space-y-2">
            <div className="bg-white p-1 rounded border">
              <PixCanvas
                pixkey={pixKey}
                merchant={storeName}
                city={merchantCity}
                amount={amount}
                code={transactionCode}
                size={120}
                ignoreErrors={true}
              />
            </div>
            
            {/* PIX Payload Textarea - Hidden but functional for clipboard */}
            <textarea
              readOnly
              value={pixPayloadData}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
            
            {/* Price and PIX info */}
            <div className="text-center">
              <p className="text-xs font-medium text-green-700">PIX {formatPrice(amount)}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-gray-600 truncate max-w-[80px]">
                  {pixKey.length > 15 ? `${pixKey.substring(0, 15)}...` : pixKey}
                </span>
                <button
                  onClick={handleCopyPix}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Copiar dados PIX"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-500" />
                  )}
                </button>
              </div>
              
              {/* Toggle back button */}
              <button
                onClick={handleToggleQR}
                className="text-xs text-gray-500 hover:text-gray-700 mt-1"
              >
                Ocultar QR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}