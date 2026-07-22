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
    return `(function(){if(window._mm){clearInterval(window._mm);window._mm=null;document.title=document.title.replace(/\\[MuMarket\\][^]*/g,'').trim();alert('PARADO');return}var T='${token}';var A='${API_URL}';var q={operationName:'GET_ALL_LOTS',query:'query GET_ALL_LOTS{lots(limit:50,offset:0,sort:{field:LOT_FIELD_UPDATED_AT,type:SORT_TYPE_DESC}){Lots{id source type gearScore Prices{value Currency{code title}} Currencies{code title}} Pagination{total}}}',variables:{}};function p(){fetch('https://mudream.online/api/graphql',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/graphql-response+json'},body:JSON.stringify(q),credentials:'include'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(d){if(d.data&&d.data.lots&&d.data.lots.Lots){var items=d.data.lots.Lots.map(function(l){return{id:l.id,name:l.source||'?',type:l.type||'',gearScore:l.gearScore||0,Prices:l.Prices||[],options:(l.Currencies||[]).map(function(c){return(c.code||'').toUpperCase()})}});document.title='[MuMarket] '+items.length+' itens';return fetch(A+'/api/monitoring/bookmarklet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:T,items:items})})}}).then(function(r){if(r)return r.json()}).then(function(d){if(d&&d.matches>0){document.title='[MuMarket] '+d.matches+' MATCHES!';if('Notification' in window&&Notification.permission==='granted')new Notification('MuMarket!',{body:d.matches+' itens!'})}}).catch(function(e){console.error('[MuMarket]',e.message)})}p();window._mm=setInterval(p,3000);alert('Monitor INICIADO! Mantenha esta aba aberta.')})()`;
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
              <p className="font-medium text-foreground">Como usar (4 passos):</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique em <strong>Copiar Codigo</strong></li>
                <li>Abra <a href="https://mudream.online/pt/market" target="_blank" className="text-primary underline">mudream.online/pt/market</a> e faca login</li>
                <li>Aperte <strong>F12</strong>, clique na aba <strong>Console</strong></li>
                <li><strong>Cole</strong> o codigo e aperte <strong>Enter</strong></li>
              </ol>
            </div>

            <Button onClick={copyCode} className="gap-2">
              {copied ? (
                <><Check className="w-4 h-4" /> Copiado! Agora cole no Console do MuDream</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar Codigo</>
              )}
            </Button>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-600">
              <strong>Dica:</strong> Se o Console pedir para colar por seguranca, digite <code>allow pasting</code> e pressione Enter primeiro.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passo a passo com detalhes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p><strong>1.</strong> Va em <strong>Filtros</strong> e crie filtros para os itens que deseja monitorar</p>
            <p><strong>2.</strong> Copie o codigo acima</p>
            <p><strong>3.</strong> Abra <strong>mudream.online/pt/market</strong> e faca login</p>
            <p><strong>4.</strong> Aperte <strong>F12</strong> no teclado</p>
            <p><strong>5.</strong> Clique na aba <strong>Console</strong> no painel que abriu</p>
            <p><strong>6.</strong> Se aparecer uma mensagem de seguranca, digite <code>allow pasting</code> e Enter</p>
            <p><strong>7.</strong> <strong>Cole</strong> o codigo copiado e aperte <strong>Enter</strong></p>
            <p><strong>8.</strong> Aparecera um alerta "Monitor INICIADO" - clique OK</p>
            <p><strong>9.</strong> O titulo da aba mudara para "[MuMarket] X itens"</p>
            <p><strong>10.</strong> Mantenha esta aba aberta - os alertas aparecerao quando itens baterem nos filtros</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
