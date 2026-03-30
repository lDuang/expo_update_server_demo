import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { bodyParser } from 'hono/body-parser';
import { manifestRoutes } from './routes/manifest.js';
import { assetRoutes } from './routes/assets.js';
import { uploadRoutes } from './routes/upload.js';
import { LocalStorage } from './storage/local.js';

const app = new Hono();
const storage = new LocalStorage('./updates');

// 初始化存储
await storage.init();

// 中间件
app.use('*', cors());
app.use('*', logger());
app.use('/upload', bodyParser());

// 路由
app.route('/manifest', manifestRoutes(storage));
app.route('/assets', assetRoutes(storage));
app.route('/upload', uploadRoutes(storage));

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 列出所有 channel
app.get('/channels', async (c) => {
  const channels = await storage.listChannels();
  return c.json({ channels });
});

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         🚀 Expo Custom Update Server                      ║');
console.log('║         Running on http://localhost:3001                  ║');
console.log('╠═══════════════════════════════════════════════════════════╣');
console.log('║  Endpoints:                                               ║');
console.log('║    GET  /health          - 健康检查                       ║');
console.log('║    GET  /channels        - 列出所有频道                   ║');
console.log('║    GET  /manifest/:channel - 获取 manifest                ║');
console.log('║    POST /upload          - 上传更新                       ║');
console.log('║    GET  /assets/...      - 获取资源文件                   ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

serve({
  fetch: app.fetch,
  port: 3001,
});
