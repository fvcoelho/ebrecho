'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Mail, Lock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['CUSTOMER', 'PROMOTER', 'PARTNER_ADMIN'])
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword']
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();

  // Debug: Log when component mounts
  console.log('[DEBUG] CadastroPage component mounted');

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'CUSTOMER'
    }
  });

  // Debug: Monitor form values
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log('[DEBUG] Form value changed:', { 
        fieldName: name, 
        changeType: type, 
        currentValues: value,
        currentRole: value.role 
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: RegisterFormData) => {
    console.log('[DEBUG] Registration form submitted with data:', data);
    console.log('[DEBUG] Selected role:', data.role);
    setIsLoading(true);
    
    try {
      console.log('[DEBUG] Calling registerUser with:', {
        name: data.name,
        email: data.email,
        role: data.role
      });
      
      const result = await registerUser(data.name, data.email, data.password, data.role);
      console.log('[DEBUG] Registration successful, result:', result);
      
      toast.success('Cadastro realizado com sucesso! Verifique seu email.');
      router.push(`/verificar-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different error cases
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string; code?: string };
        if (axiosError.response?.status === 409) {
          toast.error('Email já cadastrado');
        } else if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message);
        } else if (axiosError.message) {
          toast.error(axiosError.message);
        } else {
          toast.error('Erro ao criar conta. Tente novamente.');
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const networkError = error as { code?: string; message?: string };
        if (networkError.code === 'NETWORK_ERROR' || networkError.code === 'ERR_NETWORK') {
          toast.error('Erro de conexão. Verifique se o servidor não está respondendo.');
        } else {
          toast.error('Erro ao criar conta. Tente novamente.');
        }
      } else {
        toast.error('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Crie sua conta
          </h1>
          <p className="mt-2 text-gray-600">
            Escolha como você quer participar do eBrecho
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Seu nome completo"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de conta</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          console.log('[DEBUG] Role selection changed to:', value);
                          field.onChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder="Selecione o tipo de conta" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">
                            <div className="flex flex-col">
                              <span className="font-medium">Cliente</span>
                              <span className="text-xs text-muted-foreground">Quero comprar produtos</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="PARTNER_ADMIN">
                            <div className="flex flex-col">
                              <span className="font-medium">Parceiro</span>
                              <span className="text-xs text-muted-foreground">Quero vender meus produtos</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="PROMOTER">
                            <div className="flex flex-col">
                              <span className="font-medium">Promotor</span>
                              <span className="text-xs text-muted-foreground">Quero convidar parceiros e criar eventos</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
                            className="pl-10 pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirme sua senha"
                            className="pl-10 pr-12"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
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
                  onClick={() => {
                    console.log('[DEBUG] Submit button clicked');
                    console.log('[DEBUG] Form errors:', form.formState.errors);
                    console.log('[DEBUG] Form values before submit:', form.getValues());
                  }}
                >
                  {isLoading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                  Faça login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Ao criar uma conta, você concorda com nossos{' '}
            <Link href="/termos" className="text-primary hover:text-primary/80">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="text-primary hover:text-primary/80">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}