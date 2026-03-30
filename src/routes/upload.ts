import { Hono } from 'hono';
import { LocalStorage } from '../storage/local.js';
import { v4 as uuidv4 } from 'uuid';

export function uploadRoutes(storage: LocalStorage) {
  const routes = new Hono();

  routes.post('/', async (c) => {
    console.log('📥 Received upload request');
    
    try {
      const formData = await c.req.formData();

      const channel = formData.get('channel') as string || 'main';
      const runtimeVersion = formData.get('runtimeVersion') as string;
      const message = formData.get('message') as string;
      const criticalIndex = formData.get('criticalIndex') as string;
      const bundle = formData.get('bundle') as File;

      console.log(`   Channel: ${channel}`);
      console.log(`   Runtime: ${runtimeVersion}`);
      console.log(`   Message: ${message || 'N/A'}`);
      console.log(`   File: ${bundle?.name || 'bundle.hbc'}`);

      if (!bundle || !runtimeVersion) {
        console.log('   ❌ Missing required fields');
        return c.json({ error: 'Missing required fields' }, 400);
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
