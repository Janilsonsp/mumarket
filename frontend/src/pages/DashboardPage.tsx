import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, useSocket, useFilters } from '@/contexts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatDate, formatRelativeTime } from '@/lib/utils';
import { queryMuDream } from '@/lib/api';
import { Activity, Filter, Bell, Package, LogOut, Play, Square, RefreshCw, AlertTriangle } from 'lucide-react';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { isConnected, monitoringStatus, monitoringError, latestMatches, latestItems, socket } = useSocket();
  const { filters } = useFilters();
  const [monitorMessage, setMonitorMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeFilters = filters.filter(f => f.isActive);
  const unreadMatches = latestMatches.filter(m => !m.isRead);
  const filteredItems = latestItems.filter((item: any) => {
    return unreadMatches.some(m => m.itemId === item.name || m.itemName === item.name);
  });
  const totalFound = latestItems.length;
  const totalMatched = filteredItems.length;

  useEffect(() => {
    if (monitoringError) {
      setMonitorMessage(`Erro: ${monitoringError}`);
    }
  }, [monitoringError]);

  const poll = useCallback(async () => {
    if (!socket) return;
    try {
      const query = {
        operationName: 'GET_ALL_LOTS',
        query: `query GET_ALL_LOTS($offset: NonNegativeInt, $limit: NonNegativeInt, $sort: LotsSortInput, $filter: LotsFilterInput) {
          lots(limit: $limit, offset: $offset, sort: $sort, filter: $filter) {
            Lots {
              id source type gearScore
              Prices { value Currency { code title } }
              Currencies { code title }
            }
            Pagination { total }
          }
        }`,
        variables: {
          filter: {},
          limit: 50,
          offset: 0,
          sort: { field: 'LOT_FIELD_UPDATED_AT', type: 'SORT_TYPE_DESC' },
        },
      };

      const response = await queryMuDream(query);
      console.log('[Monitor] Response:', JSON.stringify(response).substring(0, 500));

      // Handle proxy error response
      if (response.error) {
        setMonitorMessage(`Erro proxy: ${response.error}`);
        return;
      }

      // Handle MuDream GraphQL errors
      if (response.errors && response.errors.length > 0) {
        setMonitorMessage(`Erro GraphQL: ${response.errors[0].message}`);
        return;
      }

      if (response.data?.lots?.Lots) {
        const items = response.data.lots.Lots.map((lot: any) => ({
          id: lot.id,
          name: lot.source || 'Unknown',
          type: lot.type || '',
          gearScore: lot.gearScore || 0,
          Prices: lot.Prices || [],
          options: (lot.Currencies || []).map((c: any) => c.code?.toUpperCase() || ''),
        }));

        console.log(`[Monitor] ${items.length} itens obtidos`);
        socket.emit('monitoring:data', items);
        setMonitorMessage(`Monitorando... ${items.length} itens na tela`);
      } else {
        console.log('[Monitor] Sem dados:', response);
        setMonitorMessage('Sem dados do MuDream');
      }
    } catch (err) {
      console.error('[Monitor] Error:', err);
      setMonitorMessage(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }, [socket]);

  const startMonitoring = async () => {
    if (!socket) {
      setMonitorMessage('Socket nao conectado. Recarregue a pagina.');
      return;
    }
    if (!isConnected) {
      setMonitorMessage('Conexao com servidor perdida. Recarregue a pagina.');
      return;
    }
    if (activeFilters.length === 0) {
      setMonitorMessage('Crie pelo menos um filtro ativo antes de iniciar');
      return;
    }
    setMonitorMessage('Iniciando monitoramento...');
    socket.emit('monitoring:start', 3000);

    // Start polling immediately
    if (pollingRef.current) clearInterval(pollingRef.current);
    setIsPolling(true);
    await poll();
    pollingRef.current = setInterval(poll, 3000);
  };

  const stopMonitoring = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
    socket?.emit('monitoring:stop');
    setMonitorMessage('Monitoramento parado');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MuDream Market Tracker</h1>
              <p className="text-sm text-muted-foreground">Monitoramento em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {monitorMessage && (
          <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
            monitorMessage.includes('Erro') || monitorMessage.includes('erro') || monitorMessage.includes('Crie')
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
              : monitorMessage.includes('ativo') || monitorMessage.includes('Iniciando')
                ? 'bg-green-500/10 border-green-500/30 text-green-500'
                : 'bg-muted border-border text-muted-foreground'
          }`}>
            {monitorMessage.includes('Erro') || monitorMessage.includes('erro') || monitorMessage.includes('Crie') ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Activity className="w-4 h-4 shrink-0" />
            )}
            <span>{monitorMessage}</span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 px-2" onClick={() => setMonitorMessage(null)}>
              x
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filtros Ativos</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeFilters.length}</div>
              <p className="text-xs text-muted-foreground">
                {filters.length} total cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens Encontrados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalFound}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalMatched} matchearam filtro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{unreadMatches.length}</div>
              <p className="text-xs text-muted-foreground">
                {latestMatches.length} total encontrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? 'success' : 'destructive'}>
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Intervalo: {monitoringStatus?.pollingInterval || 3000}ms
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button onClick={startMonitoring} className="gap-2">
            <Play className="w-4 h-4" />
            Iniciar Monitoramento
          </Button>
          <Button onClick={stopMonitoring} variant="outline" className="gap-2">
            <Square className="w-4 h-4" />
            Parar Monitoramento
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
              <CardDescription>Últimos itens encontrados pelos seus filtros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {unreadMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum alerta ainda. Inicie o monitoramento para começar.
                  </p>
                ) : (
                  unreadMatches.map((match: any) => (
                    <div
                      key={match.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors slide-in"
                    >
                      {match.imageUrl && (
                        <img
                          src={match.imageUrl}
                          alt={match.itemName}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{match.itemName}</span>
                          <Badge variant="info" className="text-xs">{match.filterName}</Badge>
                        </div>
                        {match.options && match.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {match.options.filter((o: string) => o !== '–').map((opt: string, i: number) => {
                              const colors: Record<string, string> = {
                                'MH': 'bg-green-500/20 text-green-400',
                                'SD': 'bg-blue-500/20 text-blue-400',
                                'DD': 'bg-red-500/20 text-red-400',
                                'REF': 'bg-yellow-500/20 text-yellow-400',
                                'DSR': 'bg-purple-500/20 text-purple-400',
                                'ZEN': 'bg-yellow-300/20 text-yellow-300',
                                'LUCK': 'bg-orange-500/20 text-orange-400',
                                'SKILL': 'bg-cyan-500/20 text-cyan-400',
                                'EXE': 'bg-pink-500/20 text-pink-400',
                                'HRM': 'bg-teal-500/20 text-teal-400',
                              };
                              const colorClass = colors[opt.toUpperCase()] || 'bg-gray-500/20 text-gray-400';
                              return (
                                <span key={i} className={`px-1.5 py-0.5 rounded text-xs font-mono ${colorClass}`}>
                                  {opt}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {match.prices && match.prices.length > 0 && (
                          <div className="text-xs mt-1 text-muted-foreground">
                            {match.prices.map((p: any, i: number) => (
                              <span key={i}>
                                {i > 0 && ' + '}
                                {p.value} {p.currency}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(match.matchedAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Itens no Market</CardTitle>
              <CardDescription>Últimos itens encontrados no Market</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {filteredItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum item filtrado ainda.
                  </p>
                ) : (
                  filteredItems.slice(0, 50).map((item: any, index: number) => {
                    const name = item.name || item.itemName || item.source || 'Item';
                    const type = item.type || item.category || '';
                    const gear = item.gearScore || item.level || 0;
                    const options = item.options || [];
                    const prices = item.Prices || [];
                    return (
                      <div
                        key={item.id || index}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors"
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate text-sm">{name}</span>
                            <Badge variant="secondary" className="text-xs">{type}</Badge>
                            {gear > 0 && <span className="text-xs text-muted-foreground">GS {gear}</span>}
                          </div>
                          {options.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {options.filter((o: string) => o !== '–').map((opt: string, oi: number) => {
                                const colors: Record<string, string> = {
                                  'MH': 'bg-green-500/20 text-green-400',
                                  'SD': 'bg-blue-500/20 text-blue-400',
                                  'DD': 'bg-red-500/20 text-red-400',
                                  'REF': 'bg-yellow-500/20 text-yellow-400',
                                  'DSR': 'bg-purple-500/20 text-purple-400',
                                  'ZEN': 'bg-yellow-300/20 text-yellow-300',
                                  'LUCK': 'bg-orange-500/20 text-orange-400',
                                  'SKILL': 'bg-cyan-500/20 text-cyan-400',
                                  'EXE': 'bg-pink-500/20 text-pink-400',
                                  'HRM': 'bg-teal-500/20 text-teal-400',
                                };
                                const colorClass = colors[opt.toUpperCase()] || 'bg-gray-500/20 text-gray-400';
                                return (
                                  <span key={oi} className={`px-1.5 py-0.5 rounded text-xs font-mono ${colorClass}`}>
                                    {opt}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <div className="text-xs mt-1 text-muted-foreground">
                            {prices.map((p: any, pi: number) => (
                              <span key={pi}>
                                {pi > 0 && ' + '}
                                {p.value} {p.Currency?.title || p.Currency?.code || ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
