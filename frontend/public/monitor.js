// MuMarket Monitor Script
// Loaded via bookmarklet on mudream.online
// Config is set via window._muMarketConfig before this script loads

(function() {
  // Prevent double execution
  if (window._muMarketMonitor) {
    clearInterval(window._muMarketMonitor.interval);
    window._muMarketMonitor = null;
    document.title = document.title.replace(/\[MuMarket\][^\]*/g, '').trim() || document.title;
    alert('Monitor MuMarket PARADO');
    return;
  }

  // Read config from global variable (set by bookmarklet)
  var config = window._muMarketConfig;
  if (!config || !config.token || !config.api) {
    alert('MuMarket Monitor: Configuracao nao encontrada. Recrie o favorito.');
    return;
  }

  var TOKEN = config.token;
  var API = config.api;

  var query = {
    operationName: 'GET_ALL_LOTS',
    query: 'query GET_ALL_LOTS { lots(limit:50,offset:0,sort:{field:LOT_FIELD_UPDATED_AT,type:SORT_TYPE_DESC}) { Lots { id source type gearScore Prices { value Currency { code title } } Currencies { code title } } Pagination { total } } }',
    variables: {}
  };

  function poll() {
    fetch('https://mudream.online/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/graphql-response+json'
      },
      body: JSON.stringify(query),
      credentials: 'include'
    })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(d) {
      if (d.data && d.data.lots && d.data.lots.Lots) {
        var lots = d.data.lots.Lots;
        var items = lots.map(function(l) {
          return {
            id: l.id,
            name: l.source || '?',
            type: l.type || '',
            gearScore: l.gearScore || 0,
            Prices: l.Prices || [],
            options: (l.Currencies || []).map(function(c) { return (c.code || '').toUpperCase(); })
          };
        });

        document.title = '[MuMarket] ' + items.length + ' itens';

        // Send to backend
        return fetch(API + '/api/monitoring/bookmarklet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: TOKEN, items: items })
        });
      }
    })
    .then(function(r) {
      if (r) return r.json();
    })
    .then(function(d) {
      if (d && d.error) {
        document.title = '[MuMarket] Erro: ' + d.error;
      } else if (d && d.matches > 0) {
        document.title = '[MuMarket] ' + d.matches + ' MATCHES!';
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('MuMarket Alert!', { body: d.matches + ' itens encontrados!' });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission().then(function(p) {
            if (p === 'granted') new Notification('MuMarket Alert!', { body: d.matches + ' itens encontrados!' });
          });
        }
      }
    })
    .catch(function(e) {
      console.error('[MuMarket] Erro:', e.message);
      document.title = '[MuMarket] Erro: ' + e.message;
    });
  }

  // First poll immediately, then every 3 seconds
  poll();
  var interval = setInterval(poll, 3000);

  window._muMarketMonitor = { interval: interval };

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  alert('MuMarket Monitor INICIADO!\nMantenha esta aba aberta.\nItens serao verificados a cada 3 segundos.');
})();
