import { config } from '../config';
import { GraphQLResponse, GraphQLQuery } from '../shared/types';
import https from 'https';

export class GraphQLClient {
  private endpoint: string;
  private rawCookie: string;
  private failedAttempts = 0;

  constructor() {
    this.endpoint = config.mudream.graphqlEndpoint;
    this.rawCookie = config.mudream.cookie;
  }

  setCookie(cookie: string) {
    this.rawCookie = cookie;
    this.failedAttempts = 0;
  }

  async query<T = unknown>(graphQLQuery: GraphQLQuery): Promise<GraphQLResponse<T>> {
    const startTime = Date.now();
    const body = JSON.stringify(graphQLQuery);

    return new Promise<GraphQLResponse<T>>((resolve, reject) => {
      const url = new URL(this.endpoint);

      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/graphql-response+json',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin': 'https://mudream.online',
          'Referer': 'https://mudream.online/pt/market',
          'Cookie': this.rawCookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const duration = Date.now() - startTime;
          const rawBody = Buffer.concat(chunks).toString('utf-8');

          if (res.statusCode !== 200) {
            this.failedAttempts++;
            console.error(`[GraphQL] ${graphQLQuery.operationName} FAILED em ${duration}ms: HTTP ${res.statusCode}`);
            reject(new Error(`GraphQL request failed: ${res.statusCode} - ${rawBody.substring(0, 200)}`));
            return;
          }

          try {
            const result = JSON.parse(rawBody) as GraphQLResponse<T>;
            this.failedAttempts = 0;
            console.log(`[GraphQL] ${graphQLQuery.operationName} OK em ${duration}ms`);
            resolve(result);
          } catch (e) {
            this.failedAttempts++;
            reject(new Error(`Failed to parse response: ${rawBody.substring(0, 300)}`));
          }
        });
      });

      req.on('error', (err) => {
        const duration = Date.now() - startTime;
        this.failedAttempts++;
        console.error(`[GraphQL] ${graphQLQuery.operationName} ERRO em ${duration}ms:`, err.message);
        reject(err);
      });

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(body);
      req.end();
    });
  }

  async close() {
    // Nothing to close for HTTP client
  }
}

export const graphqlClient = new GraphQLClient();
