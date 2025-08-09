'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Mail, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  Checkbox,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

interface SearchCriteria {
  location: {
    lat: number;
    lng: number;
    radius: number;
  };
  filters?: any;
  pagination?: any;
}

interface ExportDialogProps {
  searchCriteria: SearchCriteria;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ searchCriteria, open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email'>('download');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name',
    'address',
    'rating',
    'reviewCount',
    'phoneNumber',
    'website',
    'distance'
  ]);
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  console.log('📤 ExportDialog initialized:', {
    format,
    deliveryMethod,
    selectedFieldsCount: selectedFields.length
  });

  const availableFields = [
    { id: 'name', label: 'Nome do estabelecimento', required: true },
    { id: 'address', label: 'Endereço completo', required: true },
    { id: 'coordinates', label: 'Coordenadas (lat, lng)' },
    { id: 'rating', label: 'Avaliação' },
    { id: 'reviewCount', label: 'Número de avaliações' },
    { id: 'priceLevel', label: 'Nível de preço' },
    { id: 'phoneNumber', label: 'Telefone' },
    { id: 'website', label: 'Website' },
    { id: 'distance', label: 'Distância do centro de busca' },
    { id: 'neighborhood', label: 'Bairro' },
    { id: 'city', label: 'Cidade' },
    { id: 'state', label: 'Estado' },
    { id: 'isOpenNow', label: 'Status (Aberto/Fechado)' },
    { id: 'categories', label: 'Categorias' },
    { id: 'photos', label: 'URLs das fotos' },
  ];

  const handleFieldToggle = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (field?.required) return; // Can't deselect required fields

    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(availableFields.map(f => f.id));
  };

  const selectOnlyRequired = () => {
    setSelectedFields(availableFields.filter(f => f.required).map(f => f.id));
  };

  const handleExport = async () => {
    setLoading(true);
    setExportStatus('processing');
    console.log('📤 Starting export:', { format, deliveryMethod, fields: selectedFields });

    try {
      const response = await fetch('/api/promoter/market-intelligence/brechos/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          format,
          searchCriteria,
          fields: selectedFields,
          deliveryMethod
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Export completed:', data.data);
        setExportStatus('completed');
        setDownloadUrl(data.data.downloadUrl);
        
        if (deliveryMethod === 'download') {
          // Automatically start download
          const link = document.createElement('a');
          link.href = data.data.downloadUrl;
          link.download = `brechos-export.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        throw new Error(data.error || 'Export failed');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      setExportStatus('error');
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setExportStatus('idle');
    setDownloadUrl(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const getEstimatedFileSize = () => {
    // Rough estimation based on selected fields and format
    const baseSize = selectedFields.length * 20; // 20 bytes per field average
    const recordCount = 50; // Assuming average search result
    const totalSize = baseSize * recordCount;
    
    if (format === 'excel') {
      return `~${Math.round(totalSize * 1.5 / 1024)}KB`;
    } else {
      return `~${Math.round(totalSize / 1024)}KB`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Resultados da Busca
          </DialogTitle>
          <DialogDescription>
            Configure os dados que deseja exportar e escolha o formato de arquivo.
          </DialogDescription>
        </DialogHeader>

        {exportStatus === 'idle' && (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Formato do Arquivo</Label>
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className={`cursor-pointer transition-all ${format === 'csv' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setFormat('csv')}
                >
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-medium">CSV</h3>
                    <p className="text-sm text-muted-foreground">
                      Compatível com Excel e Google Sheets
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all ${format === 'excel' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setFormat('excel')}
                >
                  <CardContent className="p-4 text-center">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-medium">Excel</h3>
                    <p className="text-sm text-muted-foreground">
                      Arquivo .xlsx com formatação
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Método de Entrega</Label>
              <Select value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as 'download' | 'email')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="download">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download imediato
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Enviar por email
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Campos para Exportar</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectOnlyRequired}>
                    Apenas obrigatórios
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectAllFields}>
                    Selecionar todos
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableFields.map((field) => (
                      <div key={field.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={field.id}
                          checked={selectedFields.includes(field.id)}
                          onCheckedChange={() => handleFieldToggle(field.id)}
                          disabled={field.required}
                        />
                        <Label 
                          htmlFor={field.id} 
                          className={`text-sm ${field.required ? 'font-medium' : ''}`}
                        >
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{selectedFields.length} campos selecionados</span>
                      <span>Tamanho estimado: {getEstimatedFileSize()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Resumo da Busca</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>📍 Raio: {searchCriteria.location.radius >= 1000 ? `${searchCriteria.location.radius / 1000}km` : `${searchCriteria.location.radius}m`}</p>
                  <p>🔍 Coordenadas: {searchCriteria.location.lat.toFixed(4)}, {searchCriteria.location.lng.toFixed(4)}</p>
                  {searchCriteria.filters && Object.keys(searchCriteria.filters).length > 0 && (
                    <p>🎯 {Object.keys(searchCriteria.filters).length} filtros aplicados</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={selectedFields.length === 0 || loading}
              >
                <Download className="h-4 w-4 mr-2" />
                {loading ? 'Exportando...' : 'Exportar Dados'}
              </Button>
            </div>
          </div>
        )}

        {exportStatus === 'processing' && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Processando Export</h3>
            <p className="text-muted-foreground">
              Gerando arquivo {format.toUpperCase()} com {selectedFields.length} campos...
            </p>
          </div>
        )}

        {exportStatus === 'completed' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Export Concluído!</h3>
            <p className="text-muted-foreground mb-6">
              {deliveryMethod === 'download' 
                ? 'O download deve ter iniciado automaticamente.'
                : 'O arquivo foi enviado para seu email.'}
            </p>
            
            {downloadUrl && (
              <div className="space-y-4">
                <Button asChild>
                  <a href={downloadUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Arquivo
                  </a>
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  O link de download expira em 24 horas.
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}

        {exportStatus === 'error' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Erro no Export</h3>
            <p className="text-muted-foreground mb-6">
              Não foi possível gerar o arquivo. Tente novamente.
            </p>
            
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={() => setExportStatus('idle')}>
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}