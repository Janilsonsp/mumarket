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

  var TOKEN = '__TOKEN__';
  var API = '__API__';

  var allItems = [];
  var totalFound = 0;

  function queryPage(offset) {
    return fetch('https://mudream.online/api/graphql', {
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
      credentials: 'include'
    }).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function poll() {
    allItems = [];
    totalFound = 0;

    // Fetch first page
    queryPage(0).then(function(d) {
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

      // If there are more items, fetch next pages (up to 1000 total)
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
      console.error('[MuMarket] Erro:', e.message);
      document.title = '[MuMarket] Erro: ' + e.message;
    });
  }

  poll();
  var interval = setInterval(poll, 10000);
  window._muMarketMonitor = { interval: interval };

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  alert('Monitor INICIADO! Busca a cada 10s (ate 1000 itens).\nMantenha esta aba aberta.');
})();
