// MuMarket Monitor Script
// Loaded via bookmarklet on mudream.online

(function() {
  if (window._muMarketMonitor) {
    clearInterval(window._muMarketMonitor.interval);
    window._muMarketMonitor = null;
    document.title = document.title.replace(/\[MuMarket\][^\]*/g, '').trim() || document.title;
    alert('Monitor MuMarket PARADO');
    return;
  }

  // Check if we're on mudream.online
  if (!window.location.hostname.includes('mudream.online')) {
    alert('ERRO: Abra mudream.online/pt/market primeiro!');
    return;
  }

  var TOKEN = '__TOKEN__';
  var API = '__API__';
  var errorCount = 0;

  var allItems = [];
  var totalFound = 0;

  function queryPage(offset) {
    return fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/graphql-response+json'
      },
      body: JSON.stringify({
        operationName: 'GET_ALL_LOTS',
        query: 'query GET_ALL_LOTS($offset: NonNegativeInt, $limit: NonNegativeInt, $sort: LotsSortInput) { lots(limit: $limit, offset: $offset, sort: $sort) { Lots { id source type gearScore Prices { value Currency { code title } } Currencies { code title } } Pagination { total } } }',
        variables: { filter: {}, limit: 200, offset: offset, sort: { field: 'LOT_FIELD_UPDATED_AT', type: 'SORT_TYPE_DESC' } }
      }),
      credentials: 'same-origin'
    }).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var contentType = r.headers.get('content-type') || '';
      if (!contentType.includes('json')) throw new Error('Resposta nao e JSON. Voce esta logado no MuDream?');
      return r.json();
    });
  }

  function poll() {
    allItems = [];
    totalFound = 0;

    queryPage(0).then(function(d) {
      errorCount = 0;
      if (!d.data || !d.data.lots || !d.data.lots.Lots) throw new Error('Dados invalidos');

      var lots = d.data.lots.Lots;
      totalFound = d.data.lots.Pagination ? d.data.lots.Pagination.total : lots.length;

      lots.forEach(function(l) {
        allItems.push({
          id: l.id,
          name: l.source || '?',
          type: l.type || '',
          gearScore: l.gearScore || 0,
          Prices: l.Prices || [],
          options: (l.Currencies || []).map(function(c) { return (c.code || '').toUpperCase(); })
        });
      });

      var pages = Math.min(Math.ceil(totalFound / 200), 5);
      var promises = [];
      for (var p = 1; p < pages; p++) {
        promises.push(queryPage(p * 200));
      }
      return Promise.all(promises);
    }).then(function(results) {
      results.forEach(function(d) {
        if (d && d.data && d.data.lots && d.data.lots.Lots) {
          d.data.lots.Lots.forEach(function(l) {
            allItems.push({
              id: l.id,
              name: l.source || '?',
              type: l.type || '',
              gearScore: l.gearScore || 0,
              Prices: l.Prices || [],
              options: (l.Currencies || []).map(function(c) { return (c.code || '').toUpperCase(); })
            });
          });
        }
      });

      document.title = '[MuMarket] ' + allItems.length + ' de ' + totalFound + ' itens';

      return fetch(API + '/api/monitoring/bookmarklet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: TOKEN, items: allItems })
      });
    }).then(function(r) {
      if (r) return r.json();
    }).then(function(d) {
      if (d && d.error) {
        document.title = '[MuMarket] Erro: ' + d.error;
      } else if (d && d.matches > 0) {
        document.title = '[MuMarket] ' + d.matches + ' MATCHES de ' + allItems.length + ' itens!';
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('MuMarket Alert!', { body: d.matches + ' itens encontrados!' });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    }).catch(function(e) {
      errorCount++;
      console.error('[MuMarket] Erro:', e.message);
      if (errorCount > 3) {
        document.title = '[MuMarket] ERRO: ' + e.message;
      }
    });
  }

  poll();
  var interval = setInterval(poll, 10000);
  window._muMarketMonitor = { interval: interval };

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  alert('Monitor INICIADO! Busca a cada 10s.\nMantenha esta aba aberta.');
})();
