import { config } from '../config';
import { GraphQLResponse, GraphQLQuery } from '../shared/types';
import { gotScraping } from 'got-scraping';

const CDP_PORT = 9222;

export class GraphQLClient {
  private endpoint: string;
  private rawCookie: string;
  private failedAttempts = 0;
  private useCDP = false;
  private browserAvailable = false;

  constructor() {
    this.endpoint = config.mudream.graphqlEndpoint;
    this.rawCookie = config.mudream.cookie;
  }

  setCookie(cookie: string) {
    this.rawCookie = cookie;
    this.failedAttempts = 0;
  }

  private async checkCDP(): Promise<boolean> {
    if (this.browserAvailable) return true;
    try {
      const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (resp.ok) {
        this.browserAvailable = true;
        this.useCDP = true;
        console.log('[GraphQL] Chrome CDP detectado - usando browser local');
        return true;
      }
    } catch {}
    console.log('[GraphQL] Chrome CDP nao disponivel - usando got-scraping');
    return false;
  }

  private async queryViaCDP<T = unknown>(graphQLQuery: GraphQLQuery): Promise<GraphQLResponse<T>> {
    const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
    const pages = await resp.json() as any[];
    const mudream = pages.find((p: any) => p.url?.includes('mudream.online'));

    if (!mudream) throw new Error('Abra o MuDream Market no Chrome primeiro');

    const WebSocket = (await import('ws')).default;
    const wsUrl = mudream.webSocketDebuggerUrl;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let msgId = 1;

      ws.on('open', () => {
        ws.send(JSON.stringify({
          id: msgId,
          method: 'Runtime.evaluate',
          params: {
            expression: `(async () => {
              const resp = await fetch("${this.endpoint}", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/graphql-response+json" },
                body: ${JSON.stringify(JSON.stringify(graphQLQuery))},
                credentials: "include",
              });
              if (!resp.ok) throw new Error("HTTP " + resp.status);
              return resp.json();
            })()`,
            awaitPromise: true,
            returnByValue: true,
          }
        }));
      });

      ws.on('message', (data: Buffer) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === msgId) {
          ws.close();
          if (msg.error) reject(new Error(msg.error.message));
          else if (msg.result?.exceptionDetails) reject(new Error('Evaluation failed: ' + (msg.result.exceptionDetails.exception?.description || '')));
          else resolve(msg.result?.result?.value);
        }
      });

      ws.on('error', reject);
      setTimeout(() => { ws.close(); reject(new Error('CDP timeout')); }, 15000);
    });
  }

  private async queryViaHTTP<T = unknown>(graphQLQuery: GraphQLQuery): Promise<GraphQLResponse<T>> {
    const startTime = Date.now();
    const body = JSON.stringify(graphQLQuery);

    try {
      const response = await gotScraping({
        method: 'POST',
        url: this.endpoint,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/graphql-response+json',
          'Origin': 'https://mudream.online',
          'Referer': 'https://mudream.online/pt/market',
          'Cookie': this.rawCookie,
        },
        body: body,
        timeout: { request: 15000 },
      });

      const duration = Date.now() - startTime;

      if (response.statusCode !== 200) {
        this.failedAttempts++;
        const snippet = response.body.substring(0, 200);
        console.error(`[GraphQL] HTTP ${response.statusCode} em ${duration}ms: ${snippet}`);
        throw new Error(`HTTP ${response.statusCode}`);
      }

      try {
        const result = JSON.parse(response.body) as GraphQLResponse<T>;
        this.failedAttempts = 0;
        console.log(`[GraphQL] ${graphQLQuery.operationName} OK em ${duration}ms`);
        return result;
      } catch {
        this.failedAttempts++;
        throw new Error(`Parse error: ${response.body.substring(0, 200)}`);
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;
      this.failedAttempts++;
      console.error(`[GraphQL] got-scraping falhou em ${duration}ms: ${err.message}`);
      throw err;
    }
  }

  async query<T = unknown>(graphQLQuery: GraphQLQuery): Promise<GraphQLResponse<T>> {
    await this.checkCDP();

    if (this.useCDP) {
      try {
        return await this.queryViaCDP<T>(graphQLQuery);
      } catch (err) {
        console.error('[GraphQL] CDP failed, tentando got-scraping...');
        this.browserAvailable = false;
        this.useCDP = false;
      }
    }

    return this.queryViaHTTP<T>(graphQLQuery);
  }

  async close() {
    this.browserAvailable = false;
    this.useCDP = false;
  }
}

export const graphqlClient = new GraphQLClient();
