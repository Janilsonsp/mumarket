const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, options);
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

// GraphQL query via Vercel rewrite proxy (same-origin, no CORS)
// Vercel rewrites /mudream-api/* → mudream.online/api/*
export async function queryMuDream(graphQLQuery: GraphQLQuery): Promise<any> {
  // Use Vercel rewrite as proxy (no CORS, same origin)
  try {
    const resp = await fetch('/mudream-api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/graphql-response+json',
      },
      body: JSON.stringify(graphQLQuery),
    });

    const text = await resp.text();

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid response: ${text.substring(0, 200)}`);
    }
  } catch (err) {
    console.error('[API] MuDream query failed:', err);
    throw err;
  }
}

interface GraphQLQuery {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}
