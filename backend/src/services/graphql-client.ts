import { config } from '../config';
import { GraphQLResponse, GraphQLQuery } from '../../../shared/src/types';
import WebSocket from 'ws';

const CDP_PORT = 9222;

export class GraphQLClient {
  private endpoint: string;
  private rawCookie: string;
  private ws: WebSocket | null = null;
  private msgId = 0;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private failedAttempts = 0;
  private pageWsUrl: string | null = null;

  constructor() {
    this.endpoint = config.mudream.graphqlEndpoint;
    this.rawCookie = config.mudream.cookie;
  }

  setCookie(cookie: string) {
    this.rawCookie = cookie;
    this.failedAttempts = 0;
  }

  private async getPageWsUrl(): Promise<string> {
    if (this.pageWsUrl) return this.pageWsUrl;

    const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
    const pages = await resp.json() as any[];
    const mudream = pages.find((p: any) => p.url?.includes('mudream.online'));

    if (!mudream) throw new Error('Abra o MuDream Market no Chrome primeiro');

    this.pageWsUrl = mudream.webSocketDebuggerUrl;
    return this.pageWsUrl;
  }

  private async ensureWs(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return this.ws;

    const wsUrl = await this.getPageWsUrl();

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        this.ws = ws;
        console.log('[GraphQL] CDP conectado');
        resolve(ws);
      });

      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id && this.pending.has(msg.id)) {
            const p = this.pending.get(msg.id)!;
            this.pending.delete(msg.id);
            if (msg.error) {
              p.reject(new Error(msg.error.message));
            } else {
              p.resolve(msg.result);
            }
          }
        } catch {}
      });

      ws.on('close', () => {
        this.ws = null;
        this.pageWsUrl = null;
      });

      ws.on('error', (err) => {
        reject(err);
      });
    });
  }

  private sendCdp(method: string, params: any = {}): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const ws = await this.ensureWs();
      const id = ++this.msgId;

      this.pending.set(id, { resolve, reject });

      ws.send(JSON.stringify({ id, method, params }));

      // Timeout
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('CDP timeout'));
        }
      }, 15000);
    });
  }

  async query<T = unknown>(graphQLQuery: GraphQLQuery): Promise<GraphQLResponse<T>> {
    const startTime = Date.now();

    try {
      const expression = `
        (async () => {
          const resp = await fetch("${this.endpoint}", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/graphql-response+json' },
            body: ${JSON.stringify(JSON.stringify(graphQLQuery))},
            credentials: 'include',
          });
          if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            throw new Error('HTTP ' + resp.status + ': ' + text.substring(0, 200));
          }
          return resp.json();
        })()
      `;

      const result = await this.sendCdp('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });

      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text || 'Evaluation failed');
      }

      const duration = Date.now() - startTime;
      this.failedAttempts = 0;
      console.log(`[GraphQL] ${graphQLQuery.operationName} OK em ${duration}ms`);
      return result.result.value as GraphQLResponse<T>;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.failedAttempts++;

      // Reset connection on repeated failures
      if (this.failedAttempts >= 3) {
        this.ws?.close();
        this.ws = null;
        this.pageWsUrl = null;
      }

      console.error(`[GraphQL] ${graphQLQuery.operationName} ERRO em ${duration}ms (#${this.failedAttempts}): ${(error as Error).message?.substring(0, 150)}`);
      throw error;
    }
  }

  async close() {
    this.ws?.close();
    this.ws = null;
    this.pageWsUrl = null;
  }

  async getItemsFromDOM(): Promise<any[]> {
    try {
      const expression = `
        (function() {
          const rows = document.querySelectorAll('[class*="MarketItem_tr"]');
          return JSON.stringify(Array.from(rows).map(row => {
            const nameEl = row.querySelector('[class*="MarketItem_name"]');
            const optionsEls = row.querySelectorAll('[class*="MarketItem_option"]');
            const imgEl = row.querySelector('[class*="MarketItem_img"] img, [class*="Item_item"] img');
            return {
              name: nameEl?.textContent?.trim() || '',
              options: Array.from(optionsEls).map(el => el.textContent?.trim()).filter(Boolean),
              imageUrl: imgEl?.src || '',
            };
          }));
        })()
      `;

      const result = await this.sendCdp('Runtime.evaluate', {
        expression,
        returnByValue: true,
      });

      if (result.result?.value) {
        return JSON.parse(result.result.value);
      }
      return [];
    } catch {
      return [];
    }
  }

  async searchItems(term: string): Promise<any[]> {
    try {
      // Focus search input and type
      await this.sendCdp('Runtime.evaluate', {
        expression: `document.querySelector('input[placeholder*="Pesquisar"]')?.focus()`,
        returnByValue: true,
      });

      await new Promise(r => setTimeout(r, 300));

      // Clear and type using React setter
      await this.sendCdp('Runtime.evaluate', {
        expression: `
          (function() {
            const input = document.querySelector('input[placeholder*="Pesquisar"]');
            if (!input) return;
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(input, '${term.replace(/'/g, "\\'")}');
            input.dispatchEvent(new Event('input', { bubbles: true }));
          })()
        `,
        returnByValue: true,
      });

      // Wait for results
      await new Promise(r => setTimeout(r, 2000));

      // Extract results
      return await this.getItemsFromDOM();
    } catch {
      return [];
    }
  }
}

export const graphqlClient = new GraphQLClient();
