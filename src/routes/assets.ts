import { Hono } from 'hono';
import { LocalStorage } from '../storage/local.js';
import * as fs from 'fs/promises';

export function assetRoutes(storage: LocalStorage) {
  const routes = new Hono();

  routes.get('/:channel/:updateId/:assetPath+', async (c) => {
    const channel = c.req.param('channel');
    const updateId = c.req.param('updateId');
    const assetPath = c.req.param('assetPath');

    const filePath = await storage.getAssetPath(channel, updateId, assetPath);

    try {
      const fileBuffer = await fs.readFile(filePath);
      
      // 根据扩展名设置 Content-Type
      const ext = assetPath.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'ttf': 'font/ttf',
        'otf': 'font/otf',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
      };

      c.header('Content-Type', contentTypes[ext || ''] || 'application/octet-stream');
      c.header('Cache-Control', 'public, max-age=31536000, immutable');
      
      return c.body(fileBuffer);
    } catch (error) {
      return c.json({ error: 'Asset not found' }, 404);
    }
  });

  return routes;
}
