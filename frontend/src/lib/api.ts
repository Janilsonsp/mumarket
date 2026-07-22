const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, options);
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

// Direct browser fetch to MuDream - uses real TLS fingerprint + cf_clearance cookie
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

  const text = await resp.text();

  if (!resp.ok) {
    throw new Error(`MuDream HTTP ${resp.status}: ${text.substring(0, 200)}`);
  }

  return JSON.parse(text);
}

interface GraphQLQuery {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}
