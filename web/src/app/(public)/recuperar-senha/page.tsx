'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authService } from '@/lib/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function RecuperarSenhaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    try {
      await authService.forgotPassword(data.email);
      setEmailSent(true);
      toast.success('Email de recuperação enviado!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Email enviado!
            </h1>
            <p className="mt-2 text-gray-600">
              Enviamos um link de recuperação para
            </p>
            <p className="font-medium text-gray-900">
              {form.getValues('email')}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                </p>
                
                <p className="text-sm text-gray-500">
                  Não recebeu o email? Verifique sua pasta de spam ou
                </p>
                
                <Button
                  variant="ghost"
                  onClick={() => setEmailSent(false)}
                  className="text-primary hover:text-primary/80 font-medium text-sm p-0 h-auto"
                >
                  tente novamente
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/login" className="text-primary hover:text-primary/80 text-sm inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Recuperar senha
          </h1>
          <p className="mt-2 text-gray-600">
            Digite seu email para receber um link de recuperação
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>
              Digite seu email para receber um link de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Lembrou da senha?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-primary hover:text-primary/80 text-sm inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}