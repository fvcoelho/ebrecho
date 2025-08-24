'use client';

import Link from "next/link";
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  BarChart3, TrendingUp, Users, Target, Database, Analytics, 
  LineChart, PieChart, Activity, DollarSign, ArrowUpRight, 
  Store, Smartphone, Clock, CheckCircle2, ArrowRight,
  Zap, Shield, Award, Calendar, RefreshCw
} from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';

export default function DataDrivenHome() {
  const { isAuthenticated } = useAuth();
  
  return (
    <MainLayout>
      {/* Hero Section - Data-Driven Focus */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-700 overflow-hidden">
        {/* Data Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M0%200h20v20H0V0zm20%2020h20v20H20V20z%22/%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Content */}
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 backdrop-blur-sm">
                  <Analytics className="w-3 h-3 mr-1" />
                  Dados que Transformam Decisões em Resultados
                </Badge>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                    decisões
                  </span><br />
                  baseadas em<br />
                  <span className="text-white">dados reais</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-white/90 max-w-xl leading-relaxed">
                  Plataforma de <strong>inteligência de negócios</strong> que transforma 
                  cada métrica em oportunidade de crescimento mensurável.
                </p>
              </div>

              {/* Key Metrics Pills */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/20 text-blue-200 p-4 rounded-xl backdrop-blur-sm border border-blue-500/30">
                  <div className="text-2xl font-bold">+347%</div>
                  <div className="text-sm opacity-80">ROI Médio</div>
                </div>
                <div className="bg-green-500/20 text-green-200 p-4 rounded-xl backdrop-blur-sm border border-green-500/30">
                  <div className="text-2xl font-bold">94.3%</div>
                  <div className="text-sm opacity-80">Precisão Analytics</div>
                </div>
                <div className="bg-cyan-500/20 text-cyan-200 p-4 rounded-xl backdrop-blur-sm border border-cyan-500/30">
                  <div className="text-2xl font-bold">2.7s</div>
                  <div className="text-sm opacity-80">Tempo de Insight</div>
                </div>
                <div className="bg-indigo-500/20 text-indigo-200 p-4 rounded-xl backdrop-blur-sm border border-indigo-500/30">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm opacity-80">Monitoramento</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-white/90 text-lg font-bold px-8 py-6 rounded-lg">
                  <Link href="/cadastro">
                    <Database className="mr-2 h-5 w-5" />
                    Iniciar Análise Gratuita
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-lg backdrop-blur-sm">
                  <Link href="#analytics">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Ver Dashboard Demo
                  </Link>
                </Button>
              </div>

              {/* Business Intelligence Badges */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/10 text-white px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-sm">
                  <Shield className="w-3 h-3" />
                  Business Intelligence
                </div>
                <div className="bg-white/10 text-white px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-sm">
                  <Target className="w-3 h-3" />
                  KPI Tracking
                </div>
                <div className="bg-white/10 text-white px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-sm">
                  <Award className="w-3 h-3" />
                  Predictive Analytics
                </div>
              </div>
            </div>
            
            {/* Right Visual - Data Dashboard */}
            <div className="relative">
              <div className="relative">
                <img 
                  src="https://res.cloudinary.com/dlayq4t4o/image/upload/w_600,h_800,c_fill,q_auto,f_auto/ebrecho_data_driven.jpg" 
                  alt="eBrecho Data Analytics Dashboard - Business Intelligence Platform" 
                  className="rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-blue-200/20"
                />
                
                {/* Floating Analytics Cards */}
                <div className="absolute -top-4 -left-4 bg-white p-4 rounded-xl shadow-xl animate-pulse border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Conversão Real-Time</div>
                      <div className="font-bold text-blue-600 text-lg">23.4%</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-xl shadow-xl animate-bounce border-l-4 border-l-green-500">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="text-xs text-gray-500 font-medium">ROI Mensal</div>
                      <div className="font-bold text-green-600 text-lg">+284%</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-1/2 -left-6 bg-white p-3 rounded-xl shadow-xl animate-pulse border-l-4 border-l-purple-500">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-xs text-gray-500">Live Users</div>
                      <div className="font-bold text-purple-600">1,247</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Overview Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-600 text-white mb-4">
              <BarChart3 className="w-3 h-3 mr-1" />
              Business Intelligence Platform
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6">
              <span className="text-blue-600">métricas precisas</span> para crescimento acelerado
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Transforme dados em decisões estratégicas com nossa plataforma de inteligência 
              de negócios projetada especificamente para o mercado de moda second-hand
            </p>
          </div>

          {/* KPI Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">+23%</Badge>
                </div>
                <h3 className="font-bold text-lg mb-2">Taxa de Conversão</h3>
                <div className="text-3xl font-black text-blue-600 mb-1">18.7%</div>
                <p className="text-sm text-gray-600">vs. 12.3% média do setor</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">+347%</Badge>
                </div>
                <h3 className="font-bold text-lg mb-2">ROI Médio</h3>
                <div className="text-3xl font-black text-green-600 mb-1">R$ 4.23</div>
                <p className="text-sm text-gray-600">para cada R$ 1 investido</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">+156%</Badge>
                </div>
                <h3 className="font-bold text-lg mb-2">LTV Cliente</h3>
                <div className="text-3xl font-black text-purple-600 mb-1">R$ 892</div>
                <p className="text-sm text-gray-600">valor médio por cliente</p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">-45%</Badge>
                </div>
                <h3 className="font-bold text-lg mb-2">Time to Market</h3>
                <div className="text-3xl font-black text-orange-600 mb-1">2.3 dias</div>
                <p className="text-sm text-gray-600">do upload à primeira venda</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Analytics Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                <span className="text-blue-600">analytics avançado</span> que impulsiona resultados
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Cada métrica coletada, analisada e transformada em insight acionável 
                para maximizar seu retorno sobre investimento
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Predictive Analytics */}
              <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative h-48 bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                  <LineChart className="w-12 h-12 mb-4 opacity-80" />
                  <h3 className="text-xl font-bold mb-2">Análise Preditiva</h3>
                  <p className="text-blue-100">Algoritmos ML preveem demanda e otimizam estoque</p>
                  
                  {/* Mini Chart Visualization */}
                  <div className="absolute bottom-4 right-4 flex items-end space-x-1">
                    {[40, 65, 35, 80, 55, 90, 70].map((height, i) => (
                      <div 
                        key={i}
                        className="w-2 bg-white/40 rounded-t"
                        style={{ height: `${height/2}px` }}
                      />
                    ))}
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Precisão de Previsão</span>
                      <span className="font-bold text-blue-600">94.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Redução de Estoque Parado</span>
                      <span className="font-bold text-green-600">-67%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Aumento em Vendas</span>
                      <span className="font-bold text-green-600">+156%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Segmentation */}
              <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative h-48 bg-gradient-to-br from-purple-600 to-purple-700 p-6 text-white">
                  <PieChart className="w-12 h-12 mb-4 opacity-80" />
                  <h3 className="text-xl font-bold mb-2">Segmentação Avançada</h3>
                  <p className="text-purple-100">Perfis detalhados baseados em comportamento de compra</p>
                  
                  {/* Pie Chart Visualization */}
                  <div className="absolute bottom-4 right-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white/80 animate-spin"></div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Segmentos Identificados</span>
                      <span className="font-bold text-purple-600">12 tipos</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Personalização CTR</span>
                      <span className="font-bold text-green-600">+234%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Retenção de Clientes</span>
                      <span className="font-bold text-green-600">89.4%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Monitoring */}
              <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="relative h-48 bg-gradient-to-br from-green-600 to-green-700 p-6 text-white">
                  <Activity className="w-12 h-12 mb-4 opacity-80" />
                  <h3 className="text-xl font-bold mb-2">Monitoramento 24/7</h3>
                  <p className="text-green-100">Alertas inteligentes e dashboards em tempo real</p>
                  
                  {/* Activity Indicator */}
                  <div className="absolute bottom-4 right-4 flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tempo de Resposta</span>
                      <span className="font-bold text-green-600">0.8s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Uptime SLA</span>
                      <span className="font-bold text-green-600">99.97%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Alertas Processados/h</span>
                      <span className="font-bold text-blue-600">2,847</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Data-Driven Results Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <Badge className="bg-blue-600 text-white mb-4">
                    <Target className="w-3 h-3 mr-1" />
                    Resultados Comprovados
                  </Badge>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    <span className="text-blue-600">dados transformados</span><br />
                    em crescimento real
                  </h2>
                  <p className="text-xl text-gray-600">
                    Nossa plataforma de business intelligence já gerou mais de 
                    <strong> R$ 12.4 milhões em vendas adicionais</strong> para nossos parceiros.
                  </p>
                </div>

                {/* Key Results */}
                <div className="space-y-6">
                  <Card className="p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg">Aumento Médio em Vendas</h4>
                        <p className="text-sm text-gray-600">Primeiros 90 dias de uso</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-blue-600">+347%</div>
                        <Badge className="bg-green-100 text-green-800">vs. baseline</Badge>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6 border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg">ROI Comprovado</h4>
                        <p className="text-sm text-gray-600">Retorno sobre investimento</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-green-600">R$ 4.23</div>
                        <Badge className="bg-green-100 text-green-800">para cada R$ 1</Badge>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6 border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-lg">Tempo para Insights</h4>
                        <p className="text-sm text-gray-600">Análise e recomendação</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-purple-600">2.7s</div>
                        <Badge className="bg-purple-100 text-purple-800">real-time</Badge>
                      </div>
                    </div>
                  </Card>
                </div>

                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                  <Link href="/cadastro">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Começar Análise Gratuita
                  </Link>
                </Button>
              </div>

              {/* Dashboard Preview */}
              <div className="relative">
                <Card className="p-6 bg-white shadow-2xl rounded-2xl">
                  <CardHeader className="p-0 mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">Business Intelligence Dashboard</h3>
                      <Badge className="bg-green-100 text-green-800">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {/* Mock Dashboard Elements */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">23.4%</div>
                        <div className="text-xs text-gray-500">Conversão</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">R$ 5.2K</div>
                        <div className="text-xs text-gray-500">Hoje</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">1,247</div>
                        <div className="text-xs text-gray-500">Usuários</div>
                      </Card>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Vestidos Casuais</span>
                        <span className="font-semibold">87% vendidos</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Bolsas Premium</span>
                        <span className="font-semibold">64% vendidas</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '64%' }}></div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Sapatos Vintage</span>
                        <span className="font-semibold">92% vendidos</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Floating Metric Cards */}
                <div className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border-l-4 border-l-green-500">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-lg font-bold text-green-600">+42%</div>
                      <div className="text-xs text-gray-500">vs. semana passada</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-xl shadow-lg border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-lg font-bold text-blue-600">Q4 2024</div>
                      <div className="text-xs text-gray-500">melhor trimestre</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Data-Driven Theme */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Transformação Digital Comprovada
            </Badge>
            
            <h2 className="text-4xl md:text-6xl font-black">
              dados que <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">geram resultados</span>
            </h2>
            
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              Junte-se a mais de <strong>2.847 empresários</strong> que já transformaram 
              seus negócios com inteligência de dados. <strong>ROI garantido em 90 dias.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90 text-xl font-bold px-12 py-6 rounded-lg shadow-2xl">
                <Link href="/cadastro">
                  <Analytics className="mr-3 h-6 w-6" />
                  Iniciar Análise Gratuita
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-xl px-12 py-6 rounded-lg backdrop-blur-sm">
                <Link href="#demo">
                  <BarChart3 className="mr-3 h-6 w-6" />
                  Ver Dashboard Demo
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm pt-8 opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Análise gratuita por 30 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>ROI garantido em 90 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Setup em menos de 5 min</span>
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="pt-8 border-t border-white/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">2,847</div>
                  <div className="text-sm opacity-80">Empresários ativos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">R$ 12.4M</div>
                  <div className="text-sm opacity-80">Vendas geradas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">94.3%</div>
                  <div className="text-sm opacity-80">Taxa de sucesso</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm opacity-80">Suporte especializado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </MainLayout>
  );
}