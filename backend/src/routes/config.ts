import { Router, Response } from 'express';
import { config } from '../config';
import { marketMonitor } from '../services/market-monitor';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { z } from 'zod';
import https from 'https';

const router = Router();
router.use(authMiddleware);

const cookieSchema = z.object({
  cookie: z.string().min(1),
});

router.get('/', (req: AuthRequest, res: Response) => {
  res.json({
    mudreamCookie: config.mudream.cookie ? '***configured***' : '',
    corsOrigin: config.cors.origin,
    mudreamEndpoint: config.mudream.graphqlEndpoint,
  });
});

router.post('/mudream-cookie', async (req: AuthRequest, res: Response) => {
  try {
    const { cookie } = cookieSchema.parse(req.body);
    config.setMudreamCookie(cookie);
    marketMonitor.setCookie(cookie);
    res.json({ success: true, message: 'Cookie configurado com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to set cookie' });
  }
});

// CORS Proxy for MuDream GraphQL
router.post('/mudream-proxy', async (req: AuthRequest, res: Response) => {
  try {
    const body = JSON.stringify(req.body);
    const url = new URL(config.mudream.graphqlEndpoint);

    const result = await new Promise<any>((resolve, reject) => {
      const proxyReq = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/graphql-response+json',
          'Origin': 'https://mudream.online',
          'Referer': 'https://mudream.online/pt/market',
          'Cookie': config.mudream.cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (proxyRes) => {
        const chunks: Buffer[] = [];
        proxyRes.on('data', (chunk) => chunks.push(chunk));
        proxyRes.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf-8');
          try {
            resolve({ status: proxyRes.statusCode, body: JSON.parse(rawBody) });
          } catch {
            resolve({ status: proxyRes.statusCode, body: { error: rawBody.substring(0, 200) } });
          }
        });
      });
      proxyReq.on('error', reject);
      proxyReq.write(body);
      proxyReq.end();
    });

    res.status(result.status || 500).json(result.body);
  } catch (error) {
    res.status(500).json({ error: 'Proxy failed' });
  }
});

router.post('/monitoring/start', (req: AuthRequest, res: Response) => {
  const { interval } = req.body as { interval?: number };
  marketMonitor.start(interval || 3000);
  res.json({ success: true, message: 'Monitoramento iniciado' });
});

router.post('/monitoring/stop', (req: AuthRequest, res: Response) => {
  marketMonitor.stop();
  res.json({ success: true, message: 'Monitoramento parado' });
});

router.get('/monitoring/status', (req: AuthRequest, res: Response) => {
  res.json({
    isRunning: marketMonitor.listenerCount('market:update') > 0,
    hasCookie: !!config.mudream.cookie,
  });
});

export default router;
