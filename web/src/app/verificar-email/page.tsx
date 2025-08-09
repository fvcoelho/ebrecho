'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { authService } from '@/lib/api';

function VerificarEmailContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    const verifyEmailAsync = async () => {
      setIsLoading(true);
      
      try {
        await authService.verifyEmail(token!);
        setIsVerified(true);
        toast.success('Email verificado com sucesso!');
        
        // Redirecionar para dashboard após 3 segundos
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
        
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Token inválido ou expirado');
        toast.error('Erro ao verificar email');
      } finally {
        setIsLoading(false);
      }
    };

    // Se há um token, tenta verificar o email
    if (token) {
      verifyEmailAsync();
    } else {
      // Se não há token, apenas mostra a página de instruções
      setIsLoading(false);
    }
  }, [token, router]);

  const resendVerification = async () => {
    if (!email) {
      toast.error('Email não encontrado');
      return;
    }

    setResendLoading(true);
    
    try {
      await authService.resendVerification(email);
      toast.success('Email de verificação reenviado!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao reenviar email de verificação');
    } finally {
      setResendLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Verificando email...
            </h1>
            <p className="mt-2 text-gray-600">
              Aguarde enquanto confirmamos seu email
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Email verificado!
            </h1>
            <p className="mt-2 text-gray-600">
              Sua conta foi ativada com sucesso
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Parabéns! Seu email foi verificado e sua conta está pronta para uso.
                </p>
                
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para o dashboard em alguns segundos...
                </p>
                
                <Button asChild>
                  <Link href="/dashboard">
                    Ir para Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Erro na verificação
            </h1>
            <p className="mt-2 text-gray-600">
              {error}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  O link de verificação pode ter expirado ou já foi utilizado.
                </p>
                
                {email && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Podemos enviar um novo link de verificação para:
                    </p>
                    <p className="font-medium text-gray-900">
                      {email}
                    </p>
                    
                    <Button
                      onClick={resendVerification}
                      disabled={resendLoading}
                    >
                      {resendLoading ? 'Enviando...' : 'Reenviar verificação'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <Link href="/cadastro" className="block text-primary hover:text-primary/80 text-sm">
              Criar nova conta
            </Link>
            <Link href="/login" className="block text-primary hover:text-primary/80 text-sm">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Caso padrão (sem token)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Verificação de email
          </h1>
          <p className="mt-2 text-gray-600">
            Verifique seu email para ativar sua conta
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {email && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Email de verificação enviado para:</strong>
                  </p>
                  <p className="font-medium text-blue-900 mt-1">
                    {email}
                  </p>
                </div>
              )}
              
              <p className="text-gray-600">
                Enviamos um link de verificação para seu email. 
                Clique no link para ativar sua conta e acessar o eBrecho.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Não recebeu o email?</strong>
                </p>
                <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                  <li>• Verifique sua pasta de spam ou lixo eletrônico</li>
                  <li>• Aguarde até 5 minutos para receber</li>
                  <li>• Certifique-se de que o email está correto</li>
                </ul>
              </div>

              {email && (
                <Button
                  onClick={resendVerification}
                  disabled={resendLoading}
                  variant="outline"
                  className="mt-4"
                >
                  {resendLoading ? 'Enviando...' : 'Reenviar email de verificação'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <Link href="/cadastro" className="block text-primary hover:text-primary/80 text-sm">
            Criar nova conta
          </Link>
          <Link href="/login" className="block text-primary hover:text-primary/80 text-sm">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <VerificarEmailContent />
    </Suspense>
  );
}