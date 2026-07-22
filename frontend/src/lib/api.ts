const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, options);
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

// GraphQL query via backend proxy (avoids CORS and Cloudflare issues)
export async function queryMuDream(graphQLQuery: GraphQLQuery): Promise<any> {
  const token = localStorage.getItem('token');

  const resp = await fetch(`${API_URL}/api/config/mudream-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(graphQLQuery),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`GraphQL proxy failed: ${resp.status} - ${text.substring(0, 200)}`);
  }

  return resp.json();
}

interface GraphQLQuery {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}
