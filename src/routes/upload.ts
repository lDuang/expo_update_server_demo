import { Hono } from 'hono';
import { LocalStorage } from '../storage/local.js';
import { v4 as uuidv4 } from 'uuid';

export function uploadRoutes(storage: LocalStorage) {
  const routes = new Hono();

  routes.post('/', async (c) => {
    console.log('📥 Received upload request');
    console.log('   Content-Type:', c.req.header('content-type'));
    
    try {
      const body = c.req.parsedBody as Record<string, any>;
      const bundle = body.bundle as File;
      
      const channel = body.channel as string || 'main';
      const runtimeVersion = body.runtimeVersion as string;
      const message = body.message as string;
      const criticalIndex = body.criticalIndex as string;

      console.log(`   Channel: ${channel}`);
      console.log(`   Runtime: ${runtimeVersion}`);
      console.log(`   Message: ${message || 'N/A'}`);

      if (!bundle || !runtimeVersion) {
        console.log('   ❌ Missing required fields');
        return c.json({ error: 'Missing required fields: bundle and runtimeVersion are required' }, 400);
      }

      const updateId = uuidv4();
      console.log(`   Generated Update ID: ${updateId}`);

      const metadata = {
        id: updateId,
        channel,
        runtimeVersion,
        message: message || undefined,
        criticalIndex: criticalIndex ? parseInt(criticalIndex, 10) : undefined,
        createdAt: new Date().toISOString(),
        bundlePath: `bundles/${channel}/${updateId}/bundle.js`,
        assetPaths: [],
      };

      // 读取文件 buffer
      const bundleBuffer = Buffer.from(await bundle.arrayBuffer());

      console.log(`   Bundle size: ${(bundleBuffer.length / 1024).toFixed(2)} KB`);

      await storage.saveUpdate(metadata, bundleBuffer, new Map());

      console.log(`   ✅ Upload saved successfully`);

      return c.json({
        success: true,
        updateId,
        manifestUrl: `https://expo-test.duapp.dev/manifest/${channel}`,
      });
    } catch (error) {
      console.error('   ❌ Upload error:', error);
      return c.json({ error: 'Upload failed' }, 500);
    }
  });

  return routes;
}
