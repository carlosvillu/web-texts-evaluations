import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { validateUrl } from '@/utils/validators';
import type { AppConfig } from '@/types/app';

interface ConfigurationSectionProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export function ConfigurationSection({ config, onConfigChange }: ConfigurationSectionProps) {
  const [localConfig, setLocalConfig] = useLocalStorage<AppConfig>('evaluator-config', config);
  const [tempUrl, setTempUrl] = useState(config.endpoint);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    setTempUrl(config.endpoint);
  }, [config.endpoint]);

  useEffect(() => {
    const isValid = validateUrl(tempUrl);
    setIsValidUrl(isValid);
  }, [tempUrl]);

  const handleSaveConfig = () => {
    if (!isValidUrl && tempUrl.trim()) return;

    const newConfig: AppConfig = {
      endpoint: tempUrl.trim(),
      separator: localConfig.separator,
    };

    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleSeparatorChange = (separator: string) => {
    const newConfig: AppConfig = {
      endpoint: localConfig.endpoint,
      separator,
    };

    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const testConnection = async () => {
    if (!isValidUrl) return;

    setIsTestingConnection(true);
    try {
      const response = await fetch(tempUrl + '/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        setIsValidUrl(true);
      }
    } catch (error) {
      console.warn('Connection test failed:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getConnectionStatus = () => {
    if (!tempUrl.trim()) return null;
    if (!isValidUrl) return 'error';
    return 'success';
  };

  const connectionStatus = getConnectionStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          ⚙️ Configuración
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="endpoint" className="text-sm font-medium">
            URL del Endpoint
          </label>
          <div className="flex gap-2">
            <Input
              id="endpoint"
              type="url"
              placeholder="https://api.ejemplo.com"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              className={`flex-1 ${
                connectionStatus === 'error' 
                  ? 'border-red-500 focus-visible:ring-red-500' 
                  : connectionStatus === 'success' 
                  ? 'border-green-500 focus-visible:ring-green-500' 
                  : ''
              }`}
            />
            <Button 
              onClick={testConnection}
              disabled={!isValidUrl || isTestingConnection}
              variant="outline"
              size="sm"
            >
              {isTestingConnection ? 'Probando...' : 'Probar'}
            </Button>
          </div>
          
          {connectionStatus && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={connectionStatus === 'success' ? 'default' : 'destructive'}>
                {connectionStatus === 'success' ? '✅ URL válida' : '❌ URL inválida'}
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Separador CSV
          </label>
          <div className="flex gap-2">
            {[';', ',', '|'].map((sep) => (
              <Button
                key={sep}
                variant={localConfig.separator === sep ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSeparatorChange(sep)}
                className="w-12"
              >
                {sep}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSaveConfig}
            disabled={!isValidUrl && tempUrl.trim() !== ''}
          >
            Guardar Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}