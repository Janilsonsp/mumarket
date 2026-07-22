import { useState } from 'react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Check, Bookmark, Copy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function SettingsPage() {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);

  const getBookmarkletURL = () => {
    const monitorURL = window.location.origin + '/monitor.js';
    // The bookmarklet sets config then loads the script
    const loader = `javascript:void(function(){window._muMarketConfig={token:'${token}',api:'${API_URL}'};var s=document.createElement('script');s.src='${monitorURL}';document.body.appendChild(s)})()`;
    return loader;
  };

  const getMonitorScriptURL = () => {
    return window.location.origin + '/monitor.js';
  };

  const copyBookmarklet = async () => {
    const code = getBookmarkletURL();
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

  const copyMonitorScript = async () => {
    const url = getMonitorScriptURL();
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
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
              <Bookmark className="w-5 h-5 text-primary" />
              <span>Monitor via Bookmarklet</span>
            </CardTitle>
            <CardDescription>
              O monitor roda DENTRO do MuDream, contornando Cloudflare e CORS automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Como usar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique em <strong>Copiar Favorito</strong> abaixo</li>
                <li>Clique com <strong>botao direito</strong> na barra de favoritos do navegador</li>
                <li>Selecione <strong>Adicionar pagina</strong></li>
                <li>Nome: <strong>MuMarket Monitor</strong></li>
                <li>URL: <strong>cole o codigo copiado</strong> e salve</li>
                <li>Abra <a href="https://mudream.online/pt/market" target="_blank" className="text-primary underline">mudream.online/pt/market</a> e faca login</li>
                <li><strong>Clique no favorito</strong> MuMarket Monitor</li>
                <li>O titulo da aba mostrara "[MuMarket] X itens"</li>
              </ol>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-600">
              <strong>IMPORTANTE:</strong> Nao cole na barra de endereco! Crie um favorito primeiro, depois clique nele.
            </div>

            <Button onClick={copyBookmarklet} className="gap-2">
              {copied ? (
                <><Check className="w-4 h-4" /> Copiado!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar Favorito</>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Para parar, clique novamente no favorito.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passo a passo completo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p><strong>1.</strong> Va em <strong>Filtros</strong> e crie filtros para os itens que deseja monitorar</p>
            <p><strong>2.</strong> Copie o favorito acima</p>
            <p><strong>3.</strong> Crie um favorito: botao direito na barra de favoritos &gt; Adicionar pagina &gt; URL = codigo copiado</p>
            <p><strong>4.</strong> Abra o MuDream Market, faca login</p>
            <p><strong>5.</strong> Clique no favorito MuMarket Monitor</p>
            <p><strong>6.</strong> Mantenha a aba do MuDream aberta - os alertas aparecerao automaticamente</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
