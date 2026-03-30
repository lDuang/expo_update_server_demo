import { Hono } from 'hono';
import { LocalStorage } from '../storage/local.js';
import type { ExpoUpdatesManifest } from '../types.js';

export function manifestRoutes(storage: LocalStorage) {
  const routes = new Hono();

  // 获取指定 channel 的最新 manifest
  routes.get('/:channel', async (c) => {
    const channel = c.req.param('channel');
    const latestUpdateId = await storage.getLatestUpdateId(channel);

    if (!latestUpdateId) {
      return c.json({ error: 'No updates available for this channel' }, 404);
    }

    const metadata = await storage.getUpdateMetadata(channel, latestUpdateId);
    if (!metadata) {
      return c.json({ error: 'Update metadata not found' }, 404);
    }

    const baseUrl = c.req.header('host') || 'localhost:3001';
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${baseUrl}`;

    const manifest: ExpoUpdatesManifest = {
      id: metadata.id,
      createdAt: metadata.createdAt,
      runtimeVersion: metadata.runtimeVersion,
      channel: metadata.channel,
      bundleUrl: `${origin}/assets/${channel}/${metadata.id}/bundle.js`,
      assets: metadata.assetPaths.map(assetPath => ({
        path: assetPath,
        url: `${origin}/assets/${channel}/${metadata.id}/${assetPath}`,
        type: 'asset' as const,
      })),
      extra: {
        expoClient: {
          extra: {
            message: metadata.message,
            criticalIndex: metadata.criticalIndex,
          },
        },
      },
    };

    // 设置缓存控制
    c.header('Cache-Control', 'no-cache');
    c.header('Content-Type', 'application/json');
    
    return c.json(manifest);
  });

  // 获取特定 updateId 的 manifest
  routes.get('/:channel/:updateId', async (c) => {
    const channel = c.req.param('channel');
    const updateId = c.req.param('updateId');

    const metadata = await storage.getUpdateMetadata(channel, updateId);
    if (!metadata) {
      return c.json({ error: 'Update not found' }, 404);
    }

    const baseUrl = c.req.header('host') || 'localhost:3001';
    const protocol = c.req.header('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${baseUrl}`;

    const manifest: ExpoUpdatesManifest = {
      id: metadata.id,
      createdAt: metadata.createdAt,
      runtimeVersion: metadata.runtimeVersion,
      channel: metadata.channel,
      bundleUrl: `${origin}/assets/${channel}/${metadata.id}/bundle.js`,
      assets: metadata.assetPaths.map(assetPath => ({
        path: assetPath,
        url: `${origin}/assets/${channel}/${metadata.id}/${assetPath}`,
        type: 'asset' as const,
      })),
      extra: {
        expoClient: {
          extra: {
            message: metadata.message,
            criticalIndex: metadata.criticalIndex,
          },
        },
      },
    };

    c.header('Cache-Control', 'no-cache');
    c.header('Content-Type', 'application/json');
    
    return c.json(manifest);
  });

  return routes;
}
