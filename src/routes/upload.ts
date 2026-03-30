import { Hono } from 'hono';
import { LocalStorage } from '../storage/local.js';
import { v4 as uuidv4 } from 'uuid';

export function uploadRoutes(storage: LocalStorage) {
  const routes = new Hono();

  routes.post('/', async (c) => {
    console.log('📥 Received upload request');
    
    try {
      const formData = await c.req.parseBody();

      const channel = formData.channel as string || 'main';
      const runtimeVersion = formData.runtimeVersion as string;
      const message = formData.message as string;
      const criticalIndex = formData.criticalIndex as string;
      const bundle = formData.bundle as File;

      console.log(`   Channel: ${channel}`);
      console.log(`   Runtime: ${runtimeVersion}`);
      console.log(`   Message: ${message || 'N/A'}`);

      if (!bundle || !runtimeVersion) {
        console.log('   ❌ Missing required fields');
        return c.json({ error: 'Missing required fields: bundle and runtimeVersion are required' }, 400);
      }

      const updateId = uuidv4();
      const assetPaths: string[] = [];

      // 处理 assets
      const assets = formData.assets;
      if (assets) {
        const assetFiles = Array.isArray(assets) ? assets : [assets];
        for (const assetFile of assetFiles) {
          if (assetFile instanceof File) {
            assetPaths.push(assetFile.name);
          }
        }
      }

      const metadata = {
        id: updateId,
        channel,
        runtimeVersion,
        message: message || undefined,
        criticalIndex: criticalIndex ? parseInt(criticalIndex, 10) : undefined,
        createdAt: new Date().toISOString(),
        bundlePath: `bundles/${channel}/${updateId}/bundle.js`,
        assetPaths,
      };

      console.log(`   Generated Update ID: ${updateId}`);

      // 读取文件 buffer
      const bundleBuffer = Buffer.from(await bundle.arrayBuffer());
      const assetBuffers = new Map<string, Buffer>();

      if (assets) {
        const assetFiles = Array.isArray(assets) ? assets : [assets];
        for (const assetFile of assetFiles) {
          if (assetFile instanceof File) {
            assetBuffers.set(assetFile.name, Buffer.from(await assetFile.arrayBuffer()));
          }
        }
      }

      console.log(`   Bundle size: ${(bundleBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`   Assets: ${assetPaths.length} files`);

      await storage.saveUpdate(metadata, bundleBuffer, assetBuffers);

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
