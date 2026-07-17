const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, options);
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

// GraphQL query to MuDream directly from browser
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
    const text = await resp.text().catch(() => '');
    throw new Error(`GraphQL failed: ${resp.status} - ${text.substring(0, 200)}`);
  }

  return resp.json();
}

interface GraphQLQuery {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}
