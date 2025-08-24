'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Check, MessageCircle } from 'lucide-react'
import { PixIcon } from '@/components/ui/pix-icon'
import { PixCanvas, payload } from '@/lib/pix'
import { copyToClipboard } from '@/lib/clipboard'
import { pixTransactionService } from '@/lib/api'

interface PixPaymentBaseProps {
  pixKey: string
  amount: number
  productName: string
  storeName: string
  merchantCity?: string
  productId: string
  partnerId: string
  whatsappNumber?: string
  whatsappName?: string
  buttonClassName?: string
  buttonText?: string
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  containerClassName?: string
  onButtonClick?: (e: React.MouseEvent) => void
}

export function PixPaymentBase({ 
  pixKey, 
  amount, 
  productName, 
  storeName, 
  merchantCity = 'SAO PAULO',
  productId,
  partnerId,
  whatsappNumber,
  whatsappName,
  buttonClassName = "relative gap-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white border-none shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold",
  buttonText = "Pagar com PIX",
  buttonSize = "lg",
  containerClassName = "",
  onButtonClick
}: PixPaymentBaseProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pixPayloadData, setPixPayloadData] = useState('')
  const [transactionCode] = useState(() => {
    const env = process.env.NODE_ENV === 'production' ? 'P' : 'D'
    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${env}${timestamp.slice(-8)}${random}`
  })
  
  // Generate PIX payload using the proper Brazilian PIX standard
  const generatePixPayload = async () => {
    // If payload already exists, don't regenerate
    if (pixPayloadData) {
      return pixPayloadData
    }
    
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
      } catch (transactionError: any) {
        console.warn('Failed to create PIX transaction record:', transactionError)
        
        // If it's a duplicate transaction code error, notify user to refresh
        if (transactionError?.response?.status === 409) {
          console.log('Duplicate transaction code detected. Please refresh the page to generate a new QR code.')
        }
        // Continue with payload generation even if transaction creation fails
      }
      
      return payloadStr
    } catch (error) {
      console.error('Error generating PIX payload:', error)
      // Fallback to simple format
      const fallback = `PIX\nChave: ${pixKey}\nValor: R$ ${amount.toFixed(2)}\nProduto: ${productName}\nLoja: ${storeName}`
      setPixPayloadData(fallback)
      return fallback
    }
  }
  
  const handleCopyPix = async () => {
    // Use existing payload data, don't regenerate
    const success = await copyToClipboard(pixPayloadData)
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      // Show user feedback that copy failed
      alert('Falha ao copiar. Por favor, selecione o texto na caixa "PIX Copia e Cola" e copie manualmente.')
    }
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }
  
  const handleOpenModal = async (e: React.MouseEvent) => {
    if (containerClassName) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (onButtonClick) {
      onButtonClick(e)
    }
    
    await generatePixPayload()
    setIsOpen(true)
  }
  
  if (!pixKey) {
    return null
  }
  
  return (
    <>
      <Button
        onClick={handleOpenModal}
        className={buttonClassName}
        size={buttonSize}
      >
        <PixIcon className={buttonText === '' ? "h-6 w-6" : "h-4 w-4"} />
        {buttonText && buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código PIX para realizar o pagamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            {/* Product info */}
            <div className="w-full text-center space-y-1">
              <p className="text-sm text-muted-foreground">{productName}</p>
              <p className="text-2xl font-bold">{formatPrice(amount)}</p>
            </div>
            
            {/* QR Code using new PIX library */}
            <div className="bg-white p-4 rounded-lg border">
              <PixCanvas
                pixkey={pixKey}
                merchant={storeName}
                city={merchantCity}
                amount={amount}
                code={transactionCode}
                size={256}
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
            
            {/* PIX Key display */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1 text-sm">
                  <p className="font-medium">Chave PIX:</p>
                  <p className="text-muted-foreground break-all">{pixKey}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyPix}
                  className="ml-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Após realizar o pagamento, envie o comprovante à loja para confirmação.
              </p>
              
              {/* WhatsApp button for payment confirmation */}
              {whatsappNumber && (
                <Button 
                  onClick={() => {
                    const greeting = whatsappName ? `Olá ${whatsappName}!` : 'Olá!'
                    const message = `${greeting} Realizei o pagamento PIX para o produto "${productName}" (ID: ${productId}) no valor de ${formatPrice(amount)}. Segue o comprovante para confirmação da compra.`
                    // Format phone number for WhatsApp (remove all non-digit chars and add country code if needed)
                    const cleanNumber = whatsappNumber.replace(/\D/g, '')
                    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`
                    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar Comprovante para {whatsappName || 'WhatsApp'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}