'use client';

import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Store, TrendingUp, Users, Sparkles, BarChart3, Clock, UserPlus, Gift, Rocket } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { VersionDisplay } from '@/components/ui/version-display';

export default function Home() {
  const { isAuthenticated } = useAuth();
  
  return (
    <MainLayout>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
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
              Seja um parceiro vendendo produtos sustentáveis ou um promotor expandindo nossa rede. 
              Junte-se à maior plataforma de brechós do país.
            </p>
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
                  Acessar Dashboard
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
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Maior visibilidade</h3>
                <p className="text-muted-foreground">
                  Alcance milhares de clientes que buscam produtos sustentáveis e únicos
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Clientes qualificados</h3>
                <p className="text-muted-foreground">
                  Conecte-se com compradores interessados em moda sustentável
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Gestão simplificada</h3>
                <p className="text-muted-foreground">
                  Sistema intuitivo para gerenciar produtos, vendas e clientes
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Suporte dedicado</h3>
                <p className="text-muted-foreground">
                  Equipe pronta para ajudar no crescimento do seu brechó
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
                      <h4 className="font-semibold">Dificuldade em alcançar novos clientes</h4>
                      <p className="text-sm text-muted-foreground">
                        Nossa plataforma conecta você a milhares de compradores
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Gestão manual de estoque</h4>
                      <p className="text-sm text-muted-foreground">
                        Sistema automatizado para controlar produtos e vendas
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Falta de presença digital</h4>
                      <p className="text-sm text-muted-foreground">
                        Loja online profissional sem precisar de conhecimento técnico
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Custos altos com marketing</h4>
                      <p className="text-sm text-muted-foreground">
                        Visibilidade garantida no marketplace sem gastos extras
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
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Plano gratuito para começar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Loja online profissional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Sistema de gestão completo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Suporte técnico especializado</span>
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
