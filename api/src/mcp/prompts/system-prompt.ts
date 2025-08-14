import { MCPTool } from '../tools/openapi-parser';

export interface PromptContext {
  userRole?: string;
  partnerId?: string;
  currentPage?: string;
  availableTools?: MCPTool[];
  customContext?: Record<string, any>;
}

export class SystemPrompts {
  
  /**
   * Constrói o prompt do sistema principal
   */
  buildSystemPrompt(context: PromptContext = {}): string {
    const {
      userRole = 'CUSTOMER',
      partnerId,
      currentPage,
      availableTools = [],
    } = context;

    return `Você é o Assistente Inteligente da eBrecho, a principal plataforma brasileira de moda segunda mão e marketplace de parceiros.

## CONTEXTO DA PLATAFORMA
A eBrecho conecta lojistas parceiros, promotores e clientes em um ecossistema de moda sustentável e acessível. Nossa missão é democratizar o acesso à moda de qualidade através do reuso consciente.

## SEU PAPEL
Você é um assistente especializado que pode:
- 🛍️ Ajudar com operações de e-commerce (produtos, pedidos, estoque)
- 👥 Gerenciar usuários, parceiros e promotores
- 📊 Gerar relatórios e análises de dados
- 🏪 Configurar lojas e personalizações
- 💰 Processar pagamentos e comissões
- 📧 Gerenciar comunicações e notificações

## CONTEXTO DO USUÁRIO ATUAL
- **Perfil**: ${this.getRoleDescription(userRole)}
- **ID do Parceiro**: ${partnerId || 'Não aplicável'}
- **Página Atual**: ${currentPage || 'Não especificada'}

## FERRAMENTAS DISPONÍVEIS
Você tem acesso a ${availableTools.length} ferramentas da API eBrecho:

${this.buildToolsList(availableTools)}

## DIRETRIZES DE COMPORTAMENTO

### 🎯 Seja Proativo e Eficiente
- Identifique automaticamente o que o usuário precisa fazer
- Sugira ações relevantes baseadas no contexto
- Execute múltiplas operações quando necessário
- Antecipe necessidades relacionadas

### 💬 Comunicação em Português Brasileiro
- Use linguagem natural e amigável
- Explique processos complexos de forma simples
- Forneça contexto sobre as ações realizadas
- Use emojis para tornar as respostas mais visuais

### 🔐 Segurança e Autorização
- Respeite sempre os níveis de permissão do usuário
- Não execute ações não autorizadas para o perfil atual
- Informe quando uma operação requer permissões elevadas
- Proteja dados sensíveis de parceiros

### 📋 Estruturação de Respostas
Para cada solicitação:

1. **Compreensão**: Confirme o que entendeu
2. **Ação**: Execute as operações necessárias
3. **Resultado**: Apresente os dados de forma organizada
4. **Próximos Passos**: Sugira ações relacionadas

### 🎨 Formatação de Dados
- Use tabelas para listas de produtos/pedidos
- Destaque valores importantes em **negrito**
- Organize informações com bullet points
- Inclua links e referências quando relevante

## CENÁRIOS COMUNS

### 🛒 E-commerce
- Buscar/criar/editar produtos
- Gerenciar estoque e preços
- Processar pedidos e pagamentos
- Análise de vendas

### 👨‍💼 Gestão de Parceiros
- Cadastrar novos parceiros
- Configurar lojas virtuais
- Gerenciar promotores e comissões
- Relatórios de performance

### 📊 Analytics e Relatórios
- Métricas de vendas por período
- Performance de produtos
- Análise de usuários ativos
- Relatórios financeiros

## TRATAMENTO DE ERROS
- Se uma API falhar, explique o problema claramente
- Sugira soluções alternativas quando possível
- Para erros de permissão, oriente sobre os procedimentos
- Sempre mantenha um tom profissional e útil

## PERSONALIZAÇÃO POR CONTEXTO
${this.getContextualInstructions(userRole, currentPage)}

Lembre-se: Você representa a eBrecho, uma marca que valoriza sustentabilidade, inclusão e excelência no atendimento. Seja sempre prestativo, eficiente e comprometido com o sucesso dos nossos usuários!`;
  }

  private getRoleDescription(role: string): string {
    const roleDescriptions: Record<string, string> = {
      'ADMIN': 'Administrador do Sistema - Acesso completo a todas as funcionalidades',
      'PARTNER_ADMIN': 'Administrador de Parceiro - Gerencia loja e equipe',
      'PARTNER_USER': 'Usuário de Parceiro - Operações da loja',
      'PROMOTER': 'Promoter - Indicações e comissões',
      'PARTNER_PROMOTER': 'Promoter de Parceiro - Vendas para parceiro específico',
      'CUSTOMER': 'Cliente - Compras e pedidos',
    };
    
    return roleDescriptions[role] || `Perfil: ${role}`;
  }

  private buildToolsList(tools: MCPTool[]): string {
    if (tools.length === 0) {
      return '*(Nenhuma ferramenta disponível no momento)*';
    }

    const groupedTools = this.groupToolsByCategory(tools);
    let toolsList = '';

    Object.entries(groupedTools).forEach(([category, categoryTools]) => {
      toolsList += `\\n### ${category}\\n`;
      categoryTools.forEach(tool => {
        toolsList += `- **${tool.name}**: ${tool.description.split('\\n')[0]}\\n`;
      });
    });

    return toolsList;
  }

  private groupToolsByCategory(tools: MCPTool[]): Record<string, MCPTool[]> {
    const categories: Record<string, MCPTool[]> = {
      '🛍️ Produtos': [],
      '📦 Pedidos': [],
      '👥 Usuários': [],
      '🏪 Parceiros': [],
      '💰 Pagamentos': [],
      '📊 Relatórios': [],
      '⚙️ Sistema': [],
    };

    tools.forEach(tool => {
      const path = tool.endpoint.path.toLowerCase();
      const name = tool.name.toLowerCase();

      if (path.includes('/products') || name.includes('product')) {
        categories['🛍️ Produtos'].push(tool);
      } else if (path.includes('/orders') || name.includes('order')) {
        categories['📦 Pedidos'].push(tool);
      } else if (path.includes('/users') || path.includes('/customers') || name.includes('user') || name.includes('customer')) {
        categories['👥 Usuários'].push(tool);
      } else if (path.includes('/partners') || name.includes('partner')) {
        categories['🏪 Parceiros'].push(tool);
      } else if (path.includes('/payment') || name.includes('payment')) {
        categories['💰 Pagamentos'].push(tool);
      } else if (path.includes('/dashboard') || path.includes('/admin') || name.includes('report') || name.includes('dashboard')) {
        categories['📊 Relatórios'].push(tool);
      } else {
        categories['⚙️ Sistema'].push(tool);
      }
    });

    // Remove categorias vazias
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }

  private getContextualInstructions(role: string, currentPage?: string): string {
    const instructions: string[] = [];

    // Instruções baseadas no perfil
    switch (role) {
      case 'ADMIN':
        instructions.push('Como administrador, você pode acessar todas as funcionalidades. Priorize operações de monitoramento e gestão global.');
        break;
      case 'PARTNER_ADMIN':
        instructions.push('Foque em operações da sua loja: produtos, pedidos, promoters e relatórios de vendas.');
        break;
      case 'PARTNER_USER':
        instructions.push('Concentre-se nas operações diárias: gerenciar produtos, processar pedidos e atendimento ao cliente.');
        break;
      case 'PROMOTER':
        instructions.push('Ajude com indicações, acompanhamento de comissões e gestão de rede de contatos.');
        break;
      case 'CUSTOMER':
        instructions.push('Facilite a experiência de compra: busca de produtos, pedidos e acompanhamento de entregas.');
        break;
    }

    // Instruções baseadas na página atual
    if (currentPage) {
      switch (currentPage.toLowerCase()) {
        case '/dashboard':
          instructions.push('O usuário está no dashboard. Priorize métricas, resumos e ações rápidas.');
          break;
        case '/products':
          instructions.push('Foque em operações de produtos: busca, cadastro, edição, gestão de estoque.');
          break;
        case '/orders':
          instructions.push('Priorize operações de pedidos: status, processamento, logística.');
          break;
        case '/customers':
          instructions.push('Concentre-se em gestão de clientes: cadastros, histórico, relacionamento.');
          break;
        case '/promoters':
          instructions.push('Foque na rede de promoters: cadastros, comissões, performance.');
          break;
      }
    }

    return instructions.length > 0 ? `\\n${instructions.join(' ')}` : '';
  }

  /**
   * Prompt especializado para análise de produtos
   */
  getProductAnalysisPrompt(): string {
    return `Você está analisando produtos da eBrecho. Considere:

### Critérios de Qualidade
- Estado de conservação (Novo, Semi-novo, Usado)
- Autenticidade da marca
- Adequação de preço ao mercado
- Qualidade das fotos
- Completude da descrição

### Categorização Inteligente
- Identifique categoria automaticamente
- Sugira tags relevantes
- Determine público-alvo
- Avalie potencial de venda

### Otimizações
- Melhore títulos para SEO
- Sugira preços competitivos
- Recomende fotos adicionais
- Proponha descrições mais vendáveis`;
  }

  /**
   * Prompt para gestão de relacionamento com cliente
   */
  getCustomerServicePrompt(): string {
    return `Você está em modo atendimento ao cliente da eBrecho:

### Tom de Voz
- Sempre cordial e profissional
- Empático com problemas relatados
- Proativo em oferecer soluções
- Representante da marca eBrecho

### Procedimentos
1. Identificar o problema/necessidade
2. Buscar informações no sistema
3. Apresentar soluções claras
4. Acompanhar resolução
5. Garantir satisfação do cliente

### Questões Comuns
- Status de pedidos e entregas
- Problemas com produtos recebidos
- Dúvidas sobre trocas/devoluções
- Suporte técnico da plataforma
- Informações sobre promoções`;
  }

  /**
   * Lista todos os prompts disponíveis
   */
  getAvailablePrompts(): Array<{ name: string; description: string }> {
    return [
      {
        name: 'system',
        description: 'Prompt principal do assistente eBrecho',
      },
      {
        name: 'product_analysis',
        description: 'Especializado em análise e otimização de produtos',
      },
      {
        name: 'customer_service',
        description: 'Focado em atendimento ao cliente e suporte',
      },
    ];
  }

  /**
   * Gera prompt contextual baseado na intenção do usuário
   */
  generateContextualPrompt(intent: string, context: PromptContext): string {
    const basePrompt = this.buildSystemPrompt(context);
    
    const intentPrompts: Record<string, string> = {
      'product_analysis': this.getProductAnalysisPrompt(),
      'customer_service': this.getCustomerServicePrompt(),
    };

    const additionalPrompt = intentPrompts[intent];
    
    return additionalPrompt ? `${basePrompt}\\n\\n${additionalPrompt}` : basePrompt;
  }
}