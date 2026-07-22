import { useState } from 'react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Check, Bookmark, Copy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function SettingsPage() {
  const { token } = useAuth();
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);

  const generateBookmarklet = () => {
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
              O monitor roda DENTRO do MuDream (mesma aba), contornando Cloudflare e CORS automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Como usar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique em <strong>Copiar Bookmarklet</strong> abaixo</li>
                <li>Clique com botao direito na <strong>barra de favoritos</strong> do navegador</li>
                <li>Selecione <strong>Adicionar pagina</strong> (ou "Adicionar aos favoritos")</li>
                <li>Nome: <strong>MuMarket Monitor</strong></li>
                <li>URL: <strong>cole o codigo copiado</strong></li>
                <li>Salve e abra <a href="https://mudream.online/pt/market" target="_blank" className="text-primary underline">mudream.online/pt/market</a></li>
                <li>Faca login e <strong>clique no bookmark</strong> que criou</li>
                <li>O titulo da aba mostrara "[MuMarket] X itens" quando estiver funcionando</li>
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
              IMPORTANTE: Nao cole na barra de endereco! Crie um favorito e clique nele.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passo a passo completo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p><strong>1.</strong> Va em <strong>Filtros</strong> e crie filtros para os itens que deseja monitorar</p>
            <p><strong>2.</strong> Copie o bookmarklet acima</p>
            <p><strong>3.</strong> Crie um favorito: botao direito na barra de favoritos &gt; Adicionar pagina &gt; URL = codigo copiado</p>
            <p><strong>4.</strong> Abra o MuDream Market, faca login</p>
            <p><strong>5.</strong> Clique no bookmark favorito que criou</p>
            <p><strong>6.</strong> Mantenha a aba do MuDream aberta - os alertas aparecerao automaticamente</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
