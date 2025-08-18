import Link from "next/link";
import Image from "next/image";
import { Badge } from '@/components/ui/badge';
import { Store, Users } from 'lucide-react';
import { VersionDisplay } from '@/components/ui/version-display';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <Image 
              src="/logo/ebreho_deitado.svg" 
              alt="eBrecho Logo" 
              width={200}
              height={100}
              className="w-44 h-20 object-contain"
            />
            <p className="text-sm text-muted-foreground">
              A primeira plataforma brechó do Brasil. Marketplace para brechós que transforma o setor.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/cadastro" className="hover:text-primary transition-colors">Cadastrar Brechó</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Entrar</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Minha Loja</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Recursos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>100+ brechós ativos</li>
              <li>Plano gratuito</li>
              <li>Suporte completo</li>
              <li>Gestão simplificada</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>contato@ebrecho.com.br</li>
              <li>Suporte: 24/7</li>
              <li>Brasil - Todos os estados</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; 2024 eBrecho - Marketplace para Brechós. Todos os direitos reservados.
              </p>
              <VersionDisplay 
                showCommitHash={true} 
                showEnvironment={true} 
                className="hidden md:block" 
              />
            </div>
            <div className="flex gap-4">
              <Badge variant="outline" className="text-xs">
                <Store className="w-3 h-3 mr-1" />
                Plataforma ativa
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Comunidade crescente
              </Badge>
            </div>
          </div>
          <div className="md:hidden pt-4 text-center">
            <VersionDisplay 
              showCommitHash={true} 
              showEnvironment={true} 
            />
          </div>
        </div>
      </div>
    </footer>
  );
}