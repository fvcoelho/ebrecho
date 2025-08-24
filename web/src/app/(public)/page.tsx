'use client';

import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, Store, TrendingUp, Users, Sparkles, BarChart3, 
  Clock, UserPlus, Gift, Rocket, Smartphone, CreditCard, MessageCircle, 
  Zap, ShoppingBag, Heart, ArrowRight, Star, Play, Download
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { VersionDisplay } from '@/components/ui/version-display';

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  return (
    <MainLayout>
      {/* Hero Section - Enjoei Inspired */}
      <section className="relative min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Content */}
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  #1 Plataforma de Brechós no Brasil
                </Badge>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight">
                  seu brechó<br />
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    online agora
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-white/90 max-w-xl leading-relaxed">
                  PIX instantâneo, WhatsApp integrado e loja mobile-first. 
                  <strong>Transforme visitantes em clientes</strong> todos os dias.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 backdrop-blur-sm border border-green-500/30">
                  <CreditCard className="w-4 h-4" />
                  PIX Instantâneo
                </div>
                <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 backdrop-blur-sm border border-green-500/30">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </div>
                <div className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 backdrop-blur-sm border border-blue-500/30">
                  <Smartphone className="w-4 h-4" />
                  Mobile-First
                </div>
                <div className="bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 backdrop-blur-sm border border-yellow-500/30">
                  <Zap className="w-4 h-4" />
                  100% Grátis
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-white text-purple-900 hover:bg-white/90 text-lg font-bold px-8 py-6 rounded-full shadow-2xl">
                  <Link href="/cadastro">
                    <Store className="mr-2 h-5 w-5" />
                    Criar Minha Loja Grátis
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full backdrop-blur-sm">
                  <Link href="#demo">
                    <Play className="mr-2 h-5 w-5" />
                    Ver Como Funciona
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 text-white/80 text-sm pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full border-2 border-white"></div>
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span>+500 brechós ativos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1">4.9/5 avaliação</span>
                </div>
              </div>
            </div>
            
            {/* Right Visual */}
            <div className="relative">
              <div className="relative">
                <img 
                  src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_600,h_800,c_fill,q_auto,f_auto/ebrecho_mobile_composite_v2.jpg" 
                  alt="eBrecho Mobile Platform - Street Shop with Sales Growth" 
                  className="rounded-3xl shadow-2xl w-full max-w-md mx-auto"
                />
                
                {/* Floating Cards */}
                <div className="absolute -top-4 -left-4 bg-white p-4 rounded-2xl shadow-xl animate-bounce">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">PIX Recebido</div>
                      <div className="font-bold text-green-600">R$ 89,90</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl shadow-xl animate-pulse">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <div className="text-xs text-gray-500">WhatsApp</div>
                      <div className="font-bold">3 mensagens</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conversational Section - "quero todo mundo vendendo mais" */}
      <section className="py-20 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-8">
            quero todo mundo <span className="text-purple-600">vendendo mais</span> 💜
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Por isso criamos uma plataforma completa para seu brechó crescer online, 
            com tudo que você precisa em um só lugar
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">PIX na Veia</h3>
                <p className="text-sm text-gray-600">
                  Cliente compra, PIX cai na conta. Simples assim.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-200">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">Zap Integrado</h3>
                <p className="text-sm text-gray-600">
                  Botão de compra que já abre o WhatsApp prontinho.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">Celular First</h3>
                <p className="text-sm text-gray-600">
                  Sua loja linda no celular, onde 90% das vendas acontecem.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg">Relatórios Smart</h3>
                <p className="text-sm text-gray-600">
                  Descubra qual produto vende mais e quando.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Showcase - Large Visual Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              então corre, que essas <span className="text-purple-600">funcionalidades</span> são demais
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada detalhe foi pensado para você vender mais e melhor
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* PIX Feature */}
            <Card className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_400,h_300,c_fill,q_auto,f_auto/ebrecho_pix_feature_card.jpg"
                  alt="PIX Payment"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-600/80 to-transparent">
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-green-500 text-white mb-2">
                      <Zap className="w-3 h-3 mr-1" />
                      Instantâneo
                    </Badge>
                    <h3 className="text-xl font-bold text-white">PIX que Funciona</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Cliente clica, paga via PIX e o dinheiro cai na sua conta em segundos. 
                  Sem burocracia, sem complicação.
                </p>
                <div className="flex items-center text-green-600 font-semibold">
                  <span>Pagamento instantâneo</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Feature */}
            <Card className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_400,h_300,c_fill,q_auto,f_auto/ebrecho_whatsapp_feature_card.jpg"
                  alt="WhatsApp Integration"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-600/80 to-transparent">
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-green-500 text-white mb-2">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Integrado
                    </Badge>
                    <h3 className="text-xl font-bold text-white">WhatsApp Business</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Botão de compra que abre direto no WhatsApp com a mensagem pronta. 
                  Atendimento personalizado que cliente ama.
                </p>
                <div className="flex items-center text-green-600 font-semibold">
                  <span>Atendimento direto</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            {/* Mobile Feature */}
            <Card className="group overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_400,h_300,c_fill,q_auto,f_auto/ebrecho_mobile_feature_card.jpg"
                  alt="Mobile Experience"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/80 to-transparent">
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="bg-blue-500 text-white mb-2">
                      <Smartphone className="w-3 h-3 mr-1" />
                      Mobile-First
                    </Badge>
                    <h3 className="text-xl font-bold text-white">Loja no Celular</h3>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">
                  Sua loja perfeita no celular. Carrega rápido, é fácil de usar 
                  e converte visitante em cliente.
                </p>
                <div className="flex items-center text-blue-600 font-semibold">
                  <span>Experiência móvel</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <Badge className="bg-purple-600 text-white mb-4">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Painel de Controle
                  </Badge>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    gerencie tudo em <span className="text-purple-600">um lugar só</span>
                  </h2>
                  <p className="text-xl text-gray-600">
                    Dashboard completo para você acompanhar vendas, estoque, 
                    clientes e muito mais. Sem complicação.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Vendas em Tempo Real</h4>
                      <p className="text-sm text-gray-600">Acompanhe cada venda que acontece</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Controle de Estoque</h4>
                      <p className="text-sm text-gray-600">Saiba o que está acabando</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Relatórios Inteligentes</h4>
                      <p className="text-sm text-gray-600">Descubra o que seus clientes mais querem</p>
                    </div>
                  </div>
                </div>

                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 rounded-full">
                  <Link href="/cadastro">
                    <Rocket className="mr-2 h-5 w-5" />
                    Quero Meu Dashboard
                  </Link>
                </Button>
              </div>

              <div className="relative">
                <img 
                  src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_600,h_400,c_fill,q_auto,f_auto,e_brightness:5/ebrecho_dashboard_showcase.jpg"
                  alt="Dashboard eBrecho"
                  className="rounded-2xl shadow-2xl w-full"
                />
                
                {/* Floating Stats */}
                <div className="absolute top-4 right-4 bg-white p-3 rounded-xl shadow-lg">
                  <div className="text-2xl font-bold text-green-600">+34%</div>
                  <div className="text-xs text-gray-500">vendas este mês</div>
                </div>
                
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-xl shadow-lg">
                  <div className="text-2xl font-bold text-purple-600">R$ 2.847</div>
                  <div className="text-xs text-gray-500">faturamento hoje</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Purple Gradient */}
      <section className="py-24 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-black">
              bora começar? 🚀
            </h2>
            
            <p className="text-xl md:text-2xl opacity-90">
              Seu brechó online em menos de 10 minutos. 
              <strong>Sem mensalidade, sem pegadinha.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-white/90 text-xl font-bold px-12 py-6 rounded-full shadow-2xl">
                <Link href="/cadastro">
                  <Store className="mr-3 h-6 w-6" />
                  Criar Minha Loja Agora
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-xl px-12 py-6 rounded-full backdrop-blur-sm">
                <Link href="#demo">
                  <Download className="mr-3 h-6 w-6" />
                  Baixar Guia Gratuito
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm pt-8 opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>100% Gratuito para começar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Suporte via WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Loja online em 10 min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </MainLayout>
  );
}