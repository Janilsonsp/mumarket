import { Router, Response } from 'express';
import { config } from '../config';
import { marketMonitor } from '../services/market-monitor';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { z } from 'zod';

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
