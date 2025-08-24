'use client';

import { useState } from 'react';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ValidationSuggestion } from '@/lib/api';

interface GeminiSuggestionsDialogProps {
  open: boolean;
  onClose: () => void;
  suggestions: ValidationSuggestion[];
  onAcceptSuggestions: (acceptedSuggestions: ValidationSuggestion[]) => void;
}

export function GeminiSuggestionsDialog({
  open,
  onClose,
  suggestions,
  onAcceptSuggestions
}: GeminiSuggestionsDialogProps) {
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<number>>(new Set());

  const handleToggleSuggestion = (index: number) => {
    const newAccepted = new Set(acceptedSuggestions);
    if (newAccepted.has(index)) {
      newAccepted.delete(index);
    } else {
      newAccepted.add(index);
    }
    setAcceptedSuggestions(newAccepted);
  };

  const handleAcceptAll = () => {
    setAcceptedSuggestions(new Set(suggestions.map((_, index) => index)));
  };

  const handleRejectAll = () => {
    setAcceptedSuggestions(new Set());
  };

  const handleApply = () => {
    const suggestionsToApply = suggestions.filter((_, index) => 
      acceptedSuggestions.has(index)
    );
    onAcceptSuggestions(suggestionsToApply);
    //onClose();
  };

  const handleClose = () => {
    setAcceptedSuggestions(new Set());
    onClose();
  };

  const getTypeLabel = (type: ValidationSuggestion['type']) => {
    switch (type) {
      case 'name':
        return 'Nome';
      case 'description':
        return 'Descrição';
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: ValidationSuggestion['type']) => {
    switch (type) {
      case 'name':
        return 'bg-blue-100 text-blue-800';
      case 'description':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Sugestões de Melhoria com IA
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Nossa IA analisou seu produto e encontrou algumas sugestões para melhorar a qualidade da listagem.
            Você pode aceitar ou rejeitar cada sugestão individualmente.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptAll}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Check className="h-4 w-4 mr-1" />
                Aceitar Todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Rejeitar Todas
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {acceptedSuggestions.size} de {suggestions.length} selecionadas
            </div>
          </div>

          <Separator />

          {/* Suggestions list */}
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <Card 
                key={index} 
                className={`transition-all duration-200 ${
                  acceptedSuggestions.has(index) 
                    ? 'ring-2 ring-green-200 bg-green-50' 
                    : 'hover:shadow-md'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeBadgeColor(suggestion.type)}>
                          {getTypeLabel(suggestion.type)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {suggestion.reason}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground font-medium">De:</span>
                          <span className="px-2 py-1 bg-red-50 text-red-800 rounded border">
                            {suggestion.original}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground font-medium">Para:</span>
                          <span className="px-2 py-1 bg-green-50 text-green-800 rounded border">
                            {suggestion.suggested}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSuggestion(index)}
                      className={acceptedSuggestions.has(index) 
                        ? 'text-green-600 border-green-200 bg-green-50' 
                        : ''
                      }
                    >
                      {acceptedSuggestions.has(index) ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Aceita
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Rejeitar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {/* <Button onClick={handleApply} disabled={acceptedSuggestions.size === 0}>
            Aplicar Sugestões Selecionadas ({acceptedSuggestions.size})
          </Button> */}
          <Button onClick={handleApply}>
            Salvar Produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}