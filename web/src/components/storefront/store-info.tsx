import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicStore } from '@/lib/api/public'
import { Clock, Mail, Phone, Instagram, Facebook, Globe, MapPin } from 'lucide-react'

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
    <Card>
      <CardHeader>
        <CardTitle>Informações da Loja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Store Description */}
        {store.publicDescription && (
          <div className="pb-4 border-b">
            <p className="text-sm text-gray-600 leading-relaxed">
              {store.publicDescription}
            </p>
          </div>
        )}
        
        {/* Contact info */}
        <div className="space-y-3">
          {store.whatsappNumber && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`https://wa.me/55${store.whatsappNumber}?text=${encodeURIComponent(
                  store.whatsappName 
                    ? `Olá ${store.whatsappName}! Vi sua loja no eBrecho e gostaria de mais informações.`
                    : `Olá! Vi sua loja no eBrecho e gostaria de mais informações.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {formatPhoneNumber(store.whatsappNumber)}
              </a>
            </div>
          )}
          
          {store.publicEmail && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a
                href={`mailto:${store.publicEmail}`}
                className="hover:underline"
              >
                {store.publicEmail}
              </a>
            </div>
          )}
          
          {store.address && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-muted-foreground">
                <p>{store.address.street}, {store.address.number}</p>
                {store.address.complement && <p>{store.address.complement}</p>}
                <p>{store.address.neighborhood}</p>
                <p>{store.address.city} - {store.address.state}</p>
              </div>
            </div>
          )}
        </div>

        {/* Business hours */}
        {store.businessHours && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Horário de Funcionamento</span>
            </div>
            <div className="space-y-1 text-sm">
              {Object.entries(store.businessHours).map(([day, hours]) => {
                const typedHours = hours as { open?: string; close?: string } | null;
                return (
                  <div key={day} className="flex justify-between">
                    <span className="text-muted-foreground">{dayNames[day]}:</span>
                    <span>
                      {typedHours && typedHours.open && typedHours.close 
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
        {store.socialLinks && (
          <div>
            <span className="font-medium text-sm mb-3 block">Redes Sociais</span>
            <div className="flex gap-3">
              {store.socialLinks.instagram && (
                <a
                  href={`https://instagram.com/${store.socialLinks.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {store.socialLinks.facebook && (
                <a
                  href={`https://facebook.com/${store.socialLinks.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {store.socialLinks.website && (
                <a
                  href={store.socialLinks.website.startsWith('http') 
                    ? store.socialLinks.website 
                    : `https://${store.socialLinks.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full p-2 bg-muted hover:bg-muted/80 transition-colors"
                  aria-label="Website"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Products count */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{store.productCount}</span> produtos disponíveis
          </p>
        </div>
      </CardContent>
    </Card>
  )
}