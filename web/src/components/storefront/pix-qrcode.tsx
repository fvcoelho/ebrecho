'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QrCode, Copy, Check } from 'lucide-react'
import { PixCanvas, payload } from '@/lib/pix'
import { copyToClipboard } from '@/lib/clipboard'
import { pixTransactionService } from '@/lib/api/pix-transactions'

interface PixQRCodeProps {
  pixKey: string
  amount: number
  productName: string
  storeName: string
  merchantCity?: string
  productId: string
  partnerId: string
}

export function PixQRCode({ 
  pixKey, 
  amount, 
  productName, 
  storeName, 
  merchantCity = 'SAO PAULO',
  productId,
  partnerId
}: PixQRCodeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pixPayloadData, setPixPayloadData] = useState('')
  const [transactionCode] = useState(() => {
    const env = process.env.NODE_ENV === 'production' ? 'P' : 'D'
    return `${env}${Date.now().toString().slice(-10)}`
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
      // Fallback to simple format
      const fallback = `PIX\nChave: ${pixKey}\nValor: R$ ${amount.toFixed(2)}\nDescrição: ${productName}\nLoja: ${storeName}`
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
  
  if (!pixKey) {
    return null
  }
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await generatePixPayload()
          setIsOpen(true)
        }}
        className="gap-2"
      >
        <QrCode className="h-4 w-4" />
        Pagar com PIX
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
                Após o pagamento, entre em contato com a loja para confirmar
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}