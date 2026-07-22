import { useState } from 'react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Check, Copy, Terminal } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function SettingsPage() {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);

  const getMonitorCode = () => {
    const monitorURL = window.location.origin + '/monitor.js';
    return `// MuMarket Monitor - Cole no Console do DevTools (F12) no mudream.online
// 1. Abra mudream.online/pt/market e faca login
// 2. Pressione F12 → aba Console
// 3. Cole este codigo e pressione Enter
// 4. Para parar, cole novamente

window._muMarketConfig={token:'${token}',api:'${API_URL}'};
var s=document.createElement('script');
s.src='${monitorURL}';
document.body.appendChild(s);`;
  };

  const copyCode = async () => {
    const code = getMonitorCode();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
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
            <h1 className="text-xl font-bold">Configuracoes</h1>
            <p className="text-sm text-muted-foreground">Configure o monitoramento do MuDream</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              <span>Monitor MuDream</span>
            </CardTitle>
            <CardDescription>
              O monitor roda DENTRO do MuDream, contornando Cloudflare e CORS automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Como usar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique em <strong>Copiar Codigo</strong> abaixo</li>
                <li>Abra <a href="https://mudream.online/pt/market" target="_blank" className="text-primary underline">mudream.online/pt/market</a> e faca login</li>
                <li>Pressione <strong>F12</strong> para abrir o DevTools</li>
                <li>Va na aba <strong>Console</strong></li>
                <li><strong>Cole o codigo</strong> e pressione <strong>Enter</strong></li>
                <li>O titulo da aba mostrara "[MuMarket] X itens" quando estiver funcionando</li>
                <li>Mantenha esta aba aberta enquanto quiser monitorar</li>
              </ol>
            </div>

            <Button onClick={copyCode} className="gap-2">
              {copied ? (
                <><Check className="w-4 h-4" /> Copiado!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar Codigo</>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Para parar, cole o mesmo codigo novamente no Console.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passo a passo completo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p><strong>1.</strong> Va em <strong>Filtros</strong> e crie filtros para os itens que deseja monitorar</p>
            <p><strong>2.</strong> Copie o codigo acima</p>
            <p><strong>3.</strong> Abra o MuDream Market, faca login</p>
            <p><strong>4.</strong> Pressione F12, va na aba Console, cole o codigo e Enter</p>
            <p><strong>5.</strong> Mantenha a aba do MuDream aberta - os alertas aparecerao automaticamente</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
