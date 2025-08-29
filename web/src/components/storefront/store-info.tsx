import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicStore } from '@/lib/api/public'
import { Clock, Mail, Phone, Instagram, Facebook, Globe, MapPin, Package, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface StoreInfoProps {
  store: PublicStore
}

const dayNames: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export function StoreInfo({ store }: StoreInfoProps) {
  const formatPhoneNumber = (phone: string) => {
    // Format: (11) 99988-7766
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Sobre a Loja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Store Description */}
        {store.publicDescription && (
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {store.publicDescription}
            </p>
            <Separator className="mt-4" />
          </div>
        )}
        
        {/* WhatsApp CTA Button */}
        {store.whatsappNumber && (
          <Button 
            className="w-full" 
            variant="default"
            asChild
          >
            <a
              href={`https://wa.me/55${store.whatsappNumber}?text=${encodeURIComponent(
                store.whatsappName 
                  ? `Olá ${store.whatsappName}! Vi sua loja no eBrecho e gostaria de mais informações.`
                  : `Olá! Vi sua loja no eBrecho e gostaria de mais informações.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar no WhatsApp
            </a>
          </Button>
        )}
        
        {/* Contact info */}
        <div className="space-y-2">
          {store.whatsappNumber && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                {formatPhoneNumber(store.whatsappNumber)}
              </span>
            </div>
          )}
          
          {store.publicEmail && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <a
                href={`mailto:${store.publicEmail}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {store.publicEmail}
              </a>
            </div>
          )}
          
          {store.address && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-muted-foreground">
                <p>{store.address.street}, {store.address.number}</p>
                {store.address.complement && <p>{store.address.complement}</p>}
                <p>{store.address.neighborhood}</p>
                <p className="font-medium">{store.address.city} - {store.address.state}</p>
              </div>
            </div>
          )}
        </div>

        {/* Business hours */}
        {store.businessHours && (
          <div className="space-y-3">
            <Separator />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Horário de Funcionamento</span>
            </div>
            <div className="space-y-1.5 text-sm ml-6">
              {Object.entries(store.businessHours).map(([day, hours]) => {
                const typedHours = hours as { open?: string; close?: string } | null;
                const isOpen = typedHours && typedHours.open && typedHours.close;
                return (
                  <div key={day} className="flex justify-between">
                    <span className="text-muted-foreground">{dayNames[day]}:</span>
                    <span className={isOpen ? 'font-medium' : 'text-muted-foreground'}>
                      {isOpen
                        ? `${typedHours.open} - ${typedHours.close}` 
                        : 'Fechado'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Social links */}
        {store.socialLinks && (store.socialLinks.instagram || store.socialLinks.facebook || store.socialLinks.website) && (
          <div className="space-y-3">
            <Separator />
            <div>
              <span className="font-medium text-sm mb-3 block">Redes Sociais</span>
              <div className="flex gap-2">
                {store.socialLinks.instagram && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    asChild
                  >
                    <a
                      href={`https://instagram.com/${store.socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {store.socialLinks.facebook && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    asChild
                  >
                    <a
                      href={`https://facebook.com/${store.socialLinks.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {store.socialLinks.website && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    asChild
                  >
                    <a
                      href={store.socialLinks.website.startsWith('http') 
                        ? store.socialLinks.website 
                        : `https://${store.socialLinks.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Website"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}