'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Copy, Mail, CheckCircle, Clock, Search, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { BusinessSearch } from '@/components/places/business-search';
import type { PlaceResult } from '@/components/places/places-autocomplete';

export default function ConvitesPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  
  const inviteLink = `https://ebrecho.com/convite/${user?.id}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBusinessInvite = (business: PlaceResult) => {
    console.log('Enviando convite para:', business);
    // TODO: Integrate with actual invite API
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Convidar Parceiros</h1>
          <p className="text-gray-600 mt-2">
            Convide novos brechós para se juntarem à plataforma e ganhe comissões sobre suas vendas
          </p>
        </div>

        <Tabs defaultValue="buscar" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buscar" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Buscar Estabelecimentos
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Link de Convite
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Convite por Email
            </TabsTrigger>
          </TabsList>

          {/* Business Search Tab */}
          <TabsContent value="buscar" className="space-y-6">
            <div className="text-center py-4">
              <h2 className="text-xl font-semibold mb-2">Descubra Estabelecimentos na Sua Região</h2>
              <p className="text-muted-foreground">
                Use nossa busca por localização para encontrar e convidar estabelecimentos próximos a você
              </p>
            </div>
            <BusinessSearch onBusinessInvite={handleBusinessInvite} />
          </TabsContent>

          {/* Invite Link Tab */}
          <TabsContent value="link" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-purple-600" />
                  Seu Link de Convite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant={copied ? "default" : "outline"}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Compartilhe este link com brechós interessados em vender na plataforma
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Invite Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-purple-600" />
                  Enviar Convite por Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email do Brechó</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@brecho.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Mensagem Personalizada (opcional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Adicione uma mensagem pessoal ao convite..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Convite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Invites */}
        <Card>
          <CardHeader>
            <CardTitle>Convites Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Você ainda não enviou nenhum convite</p>
                <p className="text-sm mt-2">
                  Comece convidando brechós para expandir sua rede
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invitation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Convites</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Convites Aceitos</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Convites Pendentes</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}