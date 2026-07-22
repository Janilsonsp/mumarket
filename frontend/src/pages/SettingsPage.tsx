import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Check, Copy, Play } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export function SettingsPage() {
  const { token } = useAuth();
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const getMonitorCode = () => {
    return `javascript:void(function(){if(window._mm){clearInterval(window._mm);window._mm=null;document.title=document.title.replace(/\\[MuMarket\\][^]*/g,'').trim();alert('PARADO');return}var T='${token}';var A='${API_URL}';var all=[],total=0;function qp(o){return fetch('https://mudream.online/api/graphql',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/graphql-response+json'},body:JSON.stringify({operationName:'GET_ALL_LOTS',query:'query GET_ALL_LOTS($offset:NonNegativeInt,$limit:NonNegativeInt,$sort:LotsSortInput){lots(limit:$limit,offset:$offset,sort:$sort){Lots{id source type gearScore Prices{value Currency{code title}} Currencies{code title}} Pagination{total}}}',variables:{filter:{},limit:200,offset:o,sort:{field:'LOT_FIELD_UPDATED_AT',type:'SORT_TYPE_DESC'}}}),credentials:'include'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}function p(){all=[];total=0;qp(0).then(function(d){if(!d.data||!d.data.lots||!d.data.lots.Lots)throw new Error('Dados invalidos');var lots=d.data.lots.Lots;total=d.data.lots.Pagination?d.data.lots.Pagination.total:lots.length;lots.forEach(function(l){all.push({id:l.id,name:l.source||'?',type:l.type||'',gearScore:l.gearScore||0,Prices:l.Prices||[],options:(l.Currencies||[]).map(function(c){return(c.code||'').toUpperCase()})})});var pages=Math.min(Math.ceil(total/200),5);var prom=[];for(var i=1;i<pages;i++)prom.push(qp(i*200));return Promise.all(prom)}).then(function(res){res.forEach(function(d){if(d&&d.data&&d.data.lots&&d.data.lots.Lots){d.data.lots.Lots.forEach(function(l){all.push({id:l.id,name:l.source||'?',type:l.type||'',gearScore:l.gearScore||0,Prices:l.Prices||[],options:(l.Currencies||[]).map(function(c){return(c.code||'').toUpperCase()})})})}});document.title='[MuMarket] '+all.length+' de '+total+' itens';return fetch(A+'/api/monitoring/bookmarklet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:T,items:all})})}).then(function(r){if(r)return r.json()}).then(function(d){if(d&&d.error){document.title='[MuMarket] Erro: '+d.error}else if(d&&d.matches>0){document.title='[MuMarket] '+d.matches+' MATCHES de '+all.length+' itens!';if('Notification' in window&&Notification.permission==='granted')new Notification('MuMarket!',{body:d.matches+' itens!'});else if('Notification' in window&&Notification.permission!=='denied')Notification.requestPermission()}}).catch(function(e){console.error('[MuMarket]',e.message);document.title='[MuMarket] Erro: '+e.message})}p();window._mm=setInterval(p,10000);alert('Monitor INICIADO! Busca a cada 10s (ate 1000 itens).\\nMantenha esta aba aberta.')})()`;
  };

  // Set href directly on DOM element to avoid React URL encoding
  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.href = getMonitorCode();
    }
  }, [token]);

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
              <Play className="w-5 h-5 text-primary" />
              <span>Ativar Monitor</span>
            </CardTitle>
            <CardDescription>
              O monitor precisa rodar DENTRO do MuDream por causa do Cloudflare. 
              Clique com botao direito no link abaixo e selecione "Salvar link como favorito".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-3">
              <p className="font-medium text-foreground">Como ativar (3 passos):</p>
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>Clique com botao direito</strong> no link abaixo e selecione <strong>"Salvar link como"</strong> ou <strong>"Adicionar aos favoritos"</strong></li>
                <li>Abra <a href="https://mudream.online/pt/market" target="_blank" className="text-primary underline">mudream.online/pt/market</a> e faca login</li>
                <li><strong>Clique</strong> no favorito que salvou</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                O titulo da aba mudara para "[MuMarket] X itens" quando estiver funcionando.
              </p>
            </div>

            <div className="border-2 border-dashed border-primary/50 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Clique com botao direito e salve como favorito:</p>
              <a
                ref={linkRef}
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <Play className="w-4 h-4" />
                MuMarket Monitor
              </a>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Ou copie o codigo e cole no Console (F12):</p>
              <Button onClick={copyCode} variant="outline" size="sm" className="gap-2">
                {copied ? (
                  <><Check className="w-4 h-4" /> Copiado!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copiar Codigo</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
