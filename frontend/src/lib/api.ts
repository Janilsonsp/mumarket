const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, options);
}

export function getSocketUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}
