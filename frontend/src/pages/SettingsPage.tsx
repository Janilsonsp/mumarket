import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Check, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function SettingsPage() {
  const { token } = useAuth();
  const [cookie, setCookie] = useState('');
  const [cookieStatus, setCookieStatus] = useState<'none' | 'saving' | 'saved' | 'error'>('none');
  const [serverStatus, setServerStatus] = useState<{ hasCookie: boolean } | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetch(`${API_URL}/api/config/monitoring/status`, { headers })
      .then(r => r.json())
      .then(data => setServerStatus(data))
      .catch(() => {});
  }, []);

  const handleSaveCookie = async () => {
    if (!cookie.trim()) return;
    setCookieStatus('saving');
    try {
      const res = await fetch(`${API_URL}/api/config/mudream-cookie`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cookie: cookie.trim() }),
      });
      if (res.ok) {
        setCookieStatus('saved');
        setServerStatus(prev => prev ? { ...prev, hasCookie: true } : prev);
      } else {
        setCookieStatus('error');
      }
    } catch {
      setCookieStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Configure o monitoramento do MuDream</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Cookie do MuDream</span>
              {serverStatus?.hasCookie ? (
                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Configurado</span>
              ) : (
                <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Necessário
                </span>
              )}
            </CardTitle>
            <CardDescription>
              O cookie de autenticação é necessário para acessar a API do MuDream Market.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cookie">Cookie de Sessão</Label>
              <Input
                id="cookie"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="Cole aqui o cookie do MuDream..."
                type="password"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Como obter o cookie:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Acesse <a href="https://mudream.online/pt/market" target="_blank" className="text-primary underline">mudream.online/pt/market</a></li>
                <li>Faça login na sua conta</li>
                <li>Abra o DevTools (F12) → aba <strong>Network</strong></li>
                <li>Recarregue a página e clique em qualquer requisição</li>
                <li>No <strong>Headers</strong>, copie o valor do campo <strong>Cookie</strong></li>
                <li>Cole o valor completo acima</li>
              </ol>
            </div>

            <Button onClick={handleSaveCookie} disabled={!cookie.trim() || cookieStatus === 'saving'} className="gap-2">
              {cookieStatus === 'saving' ? (
                'Salvando...'
              ) : cookieStatus === 'saved' ? (
                <><Check className="w-4 h-4" /> Salvo!</>
              ) : (
                <><Save className="w-4 h-4" /> Salvar Cookie</>
              )}
            </Button>

            {cookieStatus === 'error' && (
              <p className="text-sm text-destructive">Erro ao salvar cookie. Tente novamente.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como usar</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p><strong>1.</strong> Configure o cookie do MuDream acima</p>
            <p><strong>2.</strong> Vá em <strong>Filtros</strong> e crie filtros para os itens que deseja monitorar</p>
            <p><strong>3.</strong> Vá em <strong>Dashboard</strong> e clique em <strong>Iniciar Monitoramento</strong></p>
            <p><strong>4.</strong> Quando um item novo no market corresponder aos seus filtros, você receberá um alerta</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
