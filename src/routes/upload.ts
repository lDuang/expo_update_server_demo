import { Hono } from 'hono';
import { LocalStorage } from '../storage/local.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { Readable } from 'stream';

const upload = multer({ storage: multer.memoryStorage() });

// Multer 中间件包装
function multerMiddleware() {
  return async (c: any, next: any) => {
    return new Promise((resolve, reject) => {
      upload.single('bundle')(c.req.raw as any, {} as any, (err: any) => {
        if (err) {
          console.error('Multer error:', err);
          reject(err);
        } else {
          resolve(next());
        }
      });
    });
  };
}

export function uploadRoutes(storage: LocalStorage) {
  const routes = new Hono();

  routes.post('/', multerMiddleware(), async (c) => {
    console.log('📥 Received upload request');
    
    try {
      const req: any = c.req.raw;
      const file = req.file;
      const body = req.body as Record<string, any>;

      const channel = body?.channel || 'main';
      const runtimeVersion = body?.runtimeVersion;
      const message = body?.message || '';
      const criticalIndex = body?.criticalIndex || '0';

      console.log(`   Channel: ${channel}`);
      console.log(`   Runtime: ${runtimeVersion}`);
      console.log(`   Message: ${message}`);
      console.log(`   File: ${file?.originalname || 'bundle.hbc'} (${file?.size || 0} bytes)`);

      if (!file || !runtimeVersion) {
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

      const bundleBuffer = Buffer.from(file.buffer);
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
