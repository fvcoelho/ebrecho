'use client';

import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Store, TrendingUp, Users, Sparkles, BarChart3, Clock, UserPlus, Gift, Rocket, Smartphone, CreditCard, MessageCircle, Zap, ShoppingBag } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { VersionDisplay } from '@/components/ui/version-display';

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  return (
    <MainLayout>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Image */}
        <div className="mb-12 relative">
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_1200,h_400,c_fill,q_auto,f_auto,e_brightness:10,e_contrast:10/ebrecho_platform_hero.jpg" 
              alt="eBrecho Platform - PIX, WhatsApp e Loja Mobile" 
              className="w-full h-64 md:h-96 object-cover"
            />
            {/* Overlay with feature badges */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center justify-start p-8">
              <div className="space-y-4 max-w-xl">
                <h2 className="text-2xl md:text-4xl font-bold text-white">
                  Tecnologia que Transforma
                </h2>
                <p className="text-white/90 text-lg">
                  PIX, WhatsApp, Mobile e Analytics em uma só plataforma
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> PIX
                  </span>
                  <span className="bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </span>
                  <span className="bg-blue-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Mobile
                  </span>
                  <span className="bg-purple-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Analytics
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center space-y-8 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Marketplace • Comunidade • Oportunidades</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight leading-tight">
              A revolução dos brechós
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"> chegou ao Brasil</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Pagamento via PIX, integração WhatsApp e ferramentas completas para seu negócio. 
              Transforme seu brechó em uma loja online profissional.
            </p>
            
            {/* New Features Highlight */}
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-medium">
                <CreditCard className="w-4 h-4" />
                <span>PIX Instantâneo</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-medium">
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Integrado</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-2 text-sm font-medium">
                <ShoppingBag className="w-4 h-4" />
                <span>Loja Completa</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-2 text-sm font-medium">
                <Smartphone className="w-4 h-4" />
                <span>Mobile First</span>
              </div>
            </div>
          </div>

          {/* Stats Preview */}
          <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-8">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Brechós ativos</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Promotores</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Gratuito</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">5%</div>
              <div className="text-sm text-muted-foreground">Comissão promotor</div>
            </div>
          </div>
          
          {/* Version Display */}
          <div className="mt-6 flex justify-center">
            <VersionDisplay 
              showCommitHash={true} 
              showEnvironment={true} 
              className="bg-muted/30 px-3 py-2 rounded-full" 
            />
          </div>
          
          {isAuthenticated ? (
            <div className="space-y-6 pt-8">
              <p className="text-lg text-muted-foreground">
                Bem-vindo de volta! Acesse seu painel de controle.
              </p>
              <Button asChild size="lg" className="rounded-full px-10 py-6 text-lg">
                <Link href="/dashboard">
                  <Rocket className="mr-2 h-5 w-5" />
                  Acessar Loja
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6 pt-8">
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                  <Link href="/cadastro">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Store className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-xl">Sou um Brechó</h3>
                      <p className="text-sm text-muted-foreground">
                        Cadastre sua loja e comece a vender online
                      </p>
                      <Button className="w-full rounded-full">
                        Cadastrar Brechó
                      </Button>
                    </CardContent>
                  </Link>
                </Card>
                
                <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
                  <Link href="/cadastro">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <UserPlus className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-xl">Sou um Promotor</h3>
                      <p className="text-sm text-muted-foreground">
                        Convide parceiros e ganhe comissões
                      </p>
                      <Button variant="secondary" className="w-full rounded-full">
                        Ser Promotor
                      </Button>
                    </CardContent>
                  </Link>
                </Card>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Já tem uma conta?</p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/login">
                    Fazer Login
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Promoter Program Section */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge className="bg-purple-600 text-white">
                  <Gift className="w-3 h-3 mr-1" />
                  Novo Programa
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold">
                  Seja um Promotor eBrecho
                  <span className="text-purple-600"> e ganhe comissões</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Ajude a expandir a maior rede de brechós do Brasil e seja recompensado por isso. 
                  Ganhe até 5% de comissão sobre as vendas dos parceiros que você trouxer.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Convide Parceiros</h4>
                      <p className="text-sm text-muted-foreground">
                        Use seu link exclusivo para convidar novos brechós
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Ganhe Comissões</h4>
                      <p className="text-sm text-muted-foreground">
                        Receba de 2% a 5% sobre todas as vendas dos seus parceiros
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Crie Eventos</h4>
                      <p className="text-sm text-muted-foreground">
                        Organize eventos e promoções para seus parceiros
                      </p>
                    </div>
                  </div>
                </div>
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 rounded-full">
                  <Link href="/cadastro">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Quero ser Promotor
                  </Link>
                </Button>
              </div>
              <div className="relative">
                <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-6">Níveis de Comissão</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div>
                          <span className="font-semibold">Bronze</span>
                          <p className="text-sm text-muted-foreground">Até 5 parceiros</p>
                        </div>
                        <Badge variant="secondary">2% comissão</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div>
                          <span className="font-semibold">Prata</span>
                          <p className="text-sm text-muted-foreground">6-15 parceiros</p>
                        </div>
                        <Badge variant="secondary">3% comissão</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                        <div>
                          <span className="font-semibold">Ouro</span>
                          <p className="text-sm text-muted-foreground">16-30 parceiros</p>
                        </div>
                        <Badge variant="secondary">4% comissão</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border-2 border-purple-300">
                        <div>
                          <span className="font-semibold">Platina</span>
                          <p className="text-sm text-muted-foreground">31+ parceiros</p>
                        </div>
                        <Badge className="bg-purple-600">5% comissão</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-6 text-center">
                      + Bônus por convite e performance
                    </p>
                  </CardContent>
                </Card>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  TOP
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Platform Features Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
              <Zap className="w-3 h-3 mr-1" />
              Novas Funcionalidades
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Recursos que fazem a <span className="text-green-600">diferença</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ferramentas modernas para potencializar seu brechó no mundo digital
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card className="border-2 border-green-200 hover:border-green-400 transition-all hover:scale-105 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">PIX Instantâneo</h3>
                <p className="text-muted-foreground text-sm">
                  Receba pagamentos em segundos com total segurança e praticidade
                </p>
                <div className="text-xs text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
                  ✨ Novo
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-200 hover:border-green-400 transition-all hover:scale-105 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">WhatsApp Integrado</h3>
                <p className="text-muted-foreground text-sm">
                  Atendimento direto pelo WhatsApp com botão de compra
                </p>
                <div className="text-xs text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
                  ✨ Novo
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all hover:scale-105 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">Mobile First</h3>
                <p className="text-muted-foreground text-sm">
                  Experiência perfeita em smartphones e tablets
                </p>
                <div className="text-xs text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full">
                  🚀 Melhorado
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all hover:scale-105 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">Analytics Avançado</h3>
                <p className="text-muted-foreground text-sm">
                  Relatórios detalhados de vendas e performance
                </p>
                <div className="text-xs text-purple-600 font-medium bg-purple-100 px-3 py-1 rounded-full">
                  🚀 Melhorado
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Gallery Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Plataforma em Ação
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Veja como funciona na prática
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Cada funcionalidade foi pensada para facilitar a vida do empreendedor do brechó
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto">
            {/* Main Feature Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* PIX Payment */}
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <img 
                    src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_400,h_250,c_fill,q_auto,f_auto,e_brightness:-10/ebrecho_pix_payment.jpg" 
                    alt="PIX Payment Interface" 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <CreditCard className="w-4 h-4" />
                        <span>Pagamento Instantâneo</span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    PIX Integrado
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Seus clientes pagam via PIX e você recebe na hora. Segurança total e praticidade máxima.
                  </p>
                </CardContent>
              </Card>

              {/* WhatsApp Integration */}
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <img 
                    src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_400,h_250,c_fill,q_auto,f_auto,e_brightness:-10/ebrecho_whatsapp_chat.jpg" 
                    alt="WhatsApp Integration" 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <MessageCircle className="w-4 h-4" />
                        <span>Atendimento Direto</span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    WhatsApp Business
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Botão de compra que leva direto para o WhatsApp. Atendimento personalizado que seus clientes adoram.
                  </p>
                </CardContent>
              </Card>

              {/* Mobile Experience */}
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  <img 
                    src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_400,h_250,c_fill,q_auto,f_auto,e_brightness:-10/ebrecho_mobile_shop.jpg" 
                    alt="Mobile Shopping Experience" 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile Perfeito</span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    Experiência Mobile
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Mais de 80% das compras acontecem no celular. Sua loja funciona perfeitamente em qualquer tela.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Feature Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Analytics Dashboard */}
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2">
                    <img 
                      src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_400,h_200,c_fill,q_auto,f_auto,e_brightness:-10/ebrecho_analytics_dashboard.jpg" 
                      alt="Analytics Dashboard" 
                      className="w-full h-32 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-6 md:w-1/2 flex flex-col justify-center">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      Analytics Inteligente
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Descubra quais produtos vendem mais, os horários de pico e o perfil dos seus clientes.
                    </p>
                  </CardContent>
                </div>
              </Card>

              {/* Thrift Store Management */}
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2">
                    <img 
                      src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_400,h_200,c_fill,q_auto,f_auto,e_brightness:-10/ebrecho_thrift_store.jpg" 
                      alt="Thrift Store Management" 
                      className="w-full h-32 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-6 md:w-1/2 flex flex-col justify-center">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <Store className="w-4 h-4 text-white" />
                      </div>
                      Gestão Completa
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Controle estoque, cadastre produtos, gerencie pedidos. Tudo em um lugar só.
                    </p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Card className="bg-gradient-to-r from-primary/10 via-orange-500/10 to-pink-500/10 border-primary/20 inline-block">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Pronto para revolucionar seu brechó?</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl">
                    Junte-se aos centenas de brechós que já estão vendendo mais com nossa plataforma
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button asChild size="lg" className="rounded-full">
                      <Link href="/cadastro">
                        <Store className="mr-2 h-5 w-5" />
                        Começar Agora
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full">
                      <Link href="#demo">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Ver Demo
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="mb-4">
              Para Parceiros
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Por que os brechós escolhem o eBrecho?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ferramentas completas para transformar seu brechó em um negócio digital de sucesso
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Pagamentos PIX</h3>
                <p className="text-muted-foreground">
                  Receba pagamentos instantâneos via PIX com total segurança e praticidade
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">WhatsApp Integrado</h3>
                <p className="text-muted-foreground">
                  Atenda clientes via WhatsApp direto da sua loja online
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Mobile Otimizado</h3>
                <p className="text-muted-foreground">
                  Loja responsiva que funciona perfeitamente em todos os dispositivos
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Ferramentas Avançadas</h3>
                <p className="text-muted-foreground">
                  Analytics, relatórios, gestão de estoque e muito mais
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Problems We Solve Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="outline">Problemas que resolvemos</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Sabemos os desafios de gerenciar um brechó
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Pagamentos complicados e demorados</h4>
                      <p className="text-sm text-muted-foreground">
                        PIX instantâneo integrado para recebimento rápido e seguro
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Atendimento disperso em várias plataformas</h4>
                      <p className="text-sm text-muted-foreground">
                        WhatsApp integrado para centralizar toda comunicação com clientes
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Loja que não funciona bem no celular</h4>
                      <p className="text-sm text-muted-foreground">
                        Design mobile-first otimizado para smartphone e tablet
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Falta de dados para melhorar vendas</h4>
                      <p className="text-sm text-muted-foreground">
                        Analytics completo com relatórios de vendas e performance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 space-y-6">
                <h3 className="text-2xl font-bold">Comece agora!</h3>
                <p className="text-muted-foreground">
                  Ao cadastrar seu brechó, você terá:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span>Pagamentos PIX instantâneos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span>WhatsApp integrado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <span>Loja mobile-first</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span>Analytics e relatórios</span>
                  </li>
                </ul>
                <Button asChild size="lg" className="w-full rounded-full">
                  <Link href="/cadastro">
                    Cadastrar Meu Brechó
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="mb-4">
              Como Funciona
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Escolha seu caminho no eBrecho
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Duas formas de fazer parte da revolução dos brechós
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto space-y-16">
            {/* Partner Path */}
            <div>
              <h3 className="text-2xl font-bold text-center mb-8">
                <Store className="inline-block w-6 h-6 mr-2 text-orange-600" />
                Para Brechós
              </h3>
              <div className="grid md:grid-cols-4 gap-8">
                <div className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                      1
                    </div>
                    <h3 className="font-bold text-lg">Crie sua conta</h3>
                    <p className="text-sm text-muted-foreground">
                      Cadastro rápido com email e senha
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-orange-500/20 to-orange-500/10 -z-10"></div>
                </div>
                
                <div className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                      2
                    </div>
                    <h3 className="font-bold text-lg">Configure sua loja</h3>
                    <p className="text-sm text-muted-foreground">
                      Dados do brechó e endereço
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-orange-500/20 to-orange-500/10 -z-10"></div>
                </div>
                
                <div className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                      3
                    </div>
                    <h3 className="font-bold text-lg">Adicione produtos</h3>
                    <p className="text-sm text-muted-foreground">
                      Cadastre seus produtos com fotos
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-orange-500/20 to-orange-500/10 -z-10"></div>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-lg">Comece a vender!</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie vendas e clientes
                  </p>
                </div>
              </div>
            </div>

            {/* Promoter Path */}
            <div>
              <h3 className="text-2xl font-bold text-center mb-8">
                <UserPlus className="inline-block w-6 h-6 mr-2 text-purple-600" />
                Para Promotores
              </h3>
              <div className="grid md:grid-cols-4 gap-8">
                <div className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                      1
                    </div>
                    <h3 className="font-bold text-lg">Cadastre-se</h3>
                    <p className="text-sm text-muted-foreground">
                      Crie sua conta de promotor
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-purple-600/20 to-purple-600/10 -z-10"></div>
                </div>
                
                <div className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                      2
                    </div>
                    <h3 className="font-bold text-lg">Receba seu link</h3>
                    <p className="text-sm text-muted-foreground">
                      Link exclusivo para convites
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-purple-600/20 to-purple-600/10 -z-10"></div>
                </div>
                
                <div className="relative">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                      3
                    </div>
                    <h3 className="font-bold text-lg">Convide parceiros</h3>
                    <p className="text-sm text-muted-foreground">
                      Compartilhe com brechós
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-purple-600/20 to-purple-600/10 -z-10"></div>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg">
                    <TrendingUp className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-lg">Ganhe comissões!</h3>
                  <p className="text-sm text-muted-foreground">
                    Até 5% sobre vendas
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-full px-6 py-3">
                <Clock className="w-4 h-4" />
                <span>Cadastro em menos de 5 minutos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-gradient-to-r from-red-500 to-green-500 text-white">
              <TrendingUp className="w-3 h-3 mr-1" />
              Transformação Digital
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Antes vs. <span className="text-primary">Depois</span> do eBrecho
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja a diferença que nossa plataforma faz no seu negócio
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Before */}
              <div className="space-y-6">
                <div className="text-center">
                  <Badge variant="destructive" className="mb-4">
                    <Clock className="w-3 h-3 mr-1" />
                    Antes
                  </Badge>
                  <h3 className="text-2xl font-bold text-gray-600 mb-4">Brechó Tradicional</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Vendas apenas presenciais</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Pagamentos em dinheiro/cartão</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Atendimento apenas no balcão</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Controle manual de estoque</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Sem dados de vendas</span>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">Alcance Limitado</div>
                  <div className="text-sm text-gray-500">Apenas clientes locais</div>
                </div>
              </div>
              
              {/* After */}
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="bg-gradient-to-r from-green-600 to-blue-600 text-white mb-4">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Depois
                  </Badge>
                  <h3 className="text-2xl font-bold text-primary mb-4">Com eBrecho</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">Loja online 24h funcionando</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">PIX instantâneo + cartão</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">WhatsApp integrado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">Gestão automática completa</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">Analytics e relatórios</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4 text-center border-2 border-green-200">
                  <div className="text-2xl font-bold text-primary">Alcance Nacional</div>
                  <div className="text-sm text-primary/80">Clientes em todo o Brasil</div>
                </div>
              </div>
            </div>
            
            {/* Results Preview */}
            <div className="grid md:grid-cols-3 gap-6 mt-16">
              <Card className="text-center p-6 bg-gradient-to-b from-green-50 to-white border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">3x</div>
                <div className="text-sm text-gray-600">Mais vendas mensais</div>
              </Card>
              <Card className="text-center p-6 bg-gradient-to-b from-blue-50 to-white border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">24h</div>
                <div className="text-sm text-gray-600">Loja sempre aberta</div>
              </Card>
              <Card className="text-center p-6 bg-gradient-to-b from-purple-50 to-white border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
                <div className="text-sm text-gray-600">Custo para começar</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <Badge variant="outline" className="mb-4">
                Números do Mercado
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                O mercado de brechós está em alta
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Aproveite o crescimento do setor com nossa plataforma
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 mb-16">
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary">40%</div>
                <p className="text-sm text-muted-foreground">Crescimento anual do setor</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary">R$ 12bi</div>
                <p className="text-sm text-muted-foreground">Mercado de segunda mão no Brasil</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary">73%</div>
                <p className="text-sm text-muted-foreground">Consumidores preferem sustentabilidade</p>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary">5x</div>
                <p className="text-sm text-muted-foreground">Maior alcance com vendas online</p>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8 text-center space-y-4">
                <h3 className="text-2xl font-bold">Junte-se ao eBrecho</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  A primeira plataforma dedicada exclusivamente aos brechós do Brasil. 
                  Transforme seu brechó em um negócio digital de sucesso.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <Badge variant="secondary" className="px-4 py-2">
                    <Store className="w-4 h-4 mr-2" />
                    Plataforma completa
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2">
                    <Users className="w-4 h-4 mr-2" />
                    Comunidade crescente
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Crescimento sustentável
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary via-primary to-orange-600 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Faça parte da revolução sustentável!</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold">
              Junte-se ao maior ecossistema<br />
              <span className="text-yellow-300">de brechós do Brasil</span>
            </h2>
            
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              Seja um parceiro vendendo produtos únicos ou um promotor 
              ajudando a expandir nossa rede. O futuro da moda sustentável começa aqui.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-8">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 space-y-4">
                  <Store className="w-12 h-12 mx-auto" />
                  <h3 className="text-xl font-bold">Para Brechós</h3>
                  <p className="text-sm opacity-90">
                    Transforme seu brechó em um negócio online de sucesso
                  </p>
                  <Button asChild size="lg" variant="secondary" className="w-full rounded-full">
                    <Link href="/cadastro">
                      Cadastrar Brechó
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 space-y-4">
                  <UserPlus className="w-12 h-12 mx-auto" />
                  <h3 className="text-xl font-bold">Para Promotores</h3>
                  <p className="text-sm opacity-90">
                    Ganhe comissões convidando novos parceiros
                  </p>
                  <Button asChild size="lg" className="w-full rounded-full bg-purple-600 hover:bg-purple-700">
                    <Link href="/cadastro">
                      Ser Promotor
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm pt-8">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Plano gratuito disponível</span>
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Plataforma completa</span>
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Suporte especializado</span>
              </span>
            </div>
          </div>
        </div>
      </section>

    </MainLayout>
  );
}
