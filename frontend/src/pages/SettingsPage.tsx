import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Save, Check, AlertTriangle, Bookmark, Copy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function SettingsPage() {
  const { user, token } = useAuth();
  const [cookie, setCookie] = useState('');
  const [cookieStatus, setCookieStatus] = useState<'none' | 'saving' | 'saved' | 'error'>('none');
  const [serverStatus, setServerStatus] = useState<{ hasCookie: boolean } | null>(null);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);

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

  const generateBookmarklet = () => {
    const wsUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const code = `javascript:void(function(){if(window._mm){clearInterval(window._mm);window._mm=null;document.title=document.title.replace(/\\[MuMarket\\].*/,'');alert('Monitor MuMarket PARADO');return}var TOKEN='${token}';var API='${API_URL}';var q={operationName:'GET_ALL_LOTS',query:'query GET_ALL_LOTS { lots(limit:50,offset:0,sort:{field:LOT_FIELD_UPDATED_AT,type:SORT_TYPE_DESC}) { Lots { id source type gearScore Prices { value Currency { code title } } Currencies { code title } } Pagination { total } } }',variables:{}};var poll=function(){fetch('https://mudream.online/api/graphql',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/graphql-response+json'},body:JSON.stringify(q),credentials:'include'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(d){if(d.data&&d.data.lots&&d.data.lots.Lots){var items=d.data.lots.Lots.map(function(l){return{id:l.id,name:l.source||'?',type:l.type||'',gearScore:l.gearScore||0,Prices:l.Prices||[],options:(l.Currencies||[]).map(function(c){return(c.code||'').toUpperCase()})}});document.title='[MuMarket] '+items.length+' itens';return fetch(API+'/api/monitoring/bookmarklet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:TOKEN,items:items})})}}).then(function(r){if(r)return r.json()}).then(function(d){if(d&&d.matches>0){document.title='[MuMarket] '+d.matches+' MATCHES!';if('Notification' in window&&Notification.permission==='granted')new Notification('MuMarket!',{body:d.matches+' itens encontrados!'});else if('Notification' in window)Notification.requestPermission().then(function(){new Notification('MuMarket!',{body:d.matches+' itens encontrados!'})})}}).catch(function(e){console.error('[MuMarket]',e.message)})};poll();window._mm=setInterval(poll,3000);alert('MuMarket Monitor INICIADO!\\nMantenha esta aba aberta.')})()`;
    return code;
  };

  const copyBookmarklet = async () => {
    const code = generateBookmarklet();
    try {
      await navigator.clipboard.writeText(code);
      setBookmarkletCopied(true);
      setTimeout(() => setBookmarkletCopied(false), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setBookmarkletCopied(true);
      setTimeout(() => setBookmarkletCopied(false), 3000);
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
              <Bookmark className="w-5 h-5 text-primary" />
              <span>Monitor via Bookmarklet</span>
            </CardTitle>
            <CardDescription>
              O monitor roda DENTRO do MuDream (mesma aba), contornando Cloudflare e CORS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Como usar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique em <strong>Copiar Bookmarklet</strong> abaixo</li>
                <li>Abra <a href="https://mudream.online/pt/market" target="_blank" className="text-primary underline">mudream.online/pt/market</a> e faca login</li>
                <li>Na barra de endereco, cole o codigo e pressione Enter</li>
                <li>O titulo da aba mostrara "[MuMarket] X itens" quando estiver funcionando</li>
                <li>Mantenha esta aba aberta enquanto quiser monitorar</li>
              </ol>
            </div>

            <Button onClick={copyBookmarklet} className="gap-2">
              {bookmarkletCopied ? (
                <><Check className="w-4 h-4" /> Copiado!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar Bookmarklet</>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Para parar, clique novamente no bookmarklet na barra de endereco.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Cookie do MuDream</span>
              {serverStatus?.hasCookie ? (
                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Configurado</span>
              ) : (
                <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Necessario
                </span>
              )}
            </CardTitle>
            <CardDescription>
              O cookie de autenticacao e necessario para acessar a API do MuDream Market.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cookie">Cookie de Sessao</Label>
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
                <li>Faca login na sua conta</li>
                <li>Abra o DevTools (F12) &gt; aba <strong>Application</strong> &gt; <strong>Cookies</strong></li>
                <li>Copie TODOS os cookies do dominio mudream.online</li>
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
            <p><strong>1.</strong> Configure o bookmarklet acima (mais simples e confiavel)</p>
            <p><strong>2.</strong> Va em <strong>Filtros</strong> e crie filtros para os itens que deseja monitorar</p>
            <p><strong>3.</strong> Abra o MuDream e ative o bookmarklet</p>
            <p><strong>4.</strong> Quando um item novo no market corresponder aos seus filtros, voce recebera um alerta</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
