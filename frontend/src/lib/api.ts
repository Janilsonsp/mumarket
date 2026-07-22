const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, options);
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

// Query MuDream directly from browser
// Cloudflare allows because browser has cf_clearance + real TLS
// CORS may block reading the response
export async function queryMuDream(graphQLQuery: GraphQLQuery): Promise<any> {
  const resp = await fetch('https://mudream.online/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/graphql-response+json',
    },
    body: JSON.stringify(graphQLQuery),
    credentials: 'include',
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }

  // Check if CORS blocked the response
  if (resp.type === 'opaque') {
    throw new Error('CORS bloqueou a resposta. Abra mudream.online em outra aba e faca login primeiro.');
  }

  const text = await resp.text();
  return JSON.parse(text);
}

interface GraphQLQuery {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}
