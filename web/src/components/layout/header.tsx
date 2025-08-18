'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  
  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-20 md:h-24 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo/ebreho_deitado.svg" 
              alt="eBrecho Logo" 
              width={400}
              height={200}
              className="w-40 h-20 md:w-48 md:h-24 object-contain"
              priority
            />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Button asChild variant="default" size="sm" className="rounded-full">
                  <Link href="/dashboard">Minha Loja</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={logout}
                  className="rounded-full"
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/cadastro">Cadastrar Meu Brechó</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}