import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { UpdateMetadata } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LocalStorage {
  private baseDir: string;

  constructor(baseDir: string = './updates') {
    this.baseDir = path.resolve(__dirname, '..', baseDir);
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    console.log(`📁 Storage initialized at: ${this.baseDir}`);
  }

  private getChannelDir(channel: string): string {
    return path.join(this.baseDir, channel);
  }

  private getManifestsDir(channel: string): string {
    return path.join(this.getChannelDir(channel), 'manifests');
  }

  private getBundlesDir(channel: string): string {
    return path.join(this.getChannelDir(channel), 'bundles');
  }

  async saveUpdate(metadata: UpdateMetadata, bundleBuffer: Buffer, assetBuffers: Map<string, Buffer>): Promise<void> {
    const manifestsDir = this.getManifestsDir(metadata.channel);
    const bundlesDir = this.getBundlesDir(metadata.channel);

    await fs.mkdir(manifestsDir, { recursive: true });
    await fs.mkdir(bundlesDir, { recursive: true });

    // 保存 bundle
    const bundlePath = path.join(bundlesDir, metadata.id, 'bundle.js');
    await fs.mkdir(path.dirname(bundlePath), { recursive: true });
    await fs.writeFile(bundlePath, bundleBuffer);

    // 保存 assets
    for (const [assetPath, buffer] of assetBuffers) {
      const fullPath = path.join(bundlesDir, metadata.id, assetPath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, buffer);
    }

    // 保存 metadata
    await fs.writeFile(
      path.join(manifestsDir, `${metadata.id}.json`),
      JSON.stringify(metadata, null, 2)
    );

    // 更新 channel 的 latest.json
    await fs.writeFile(
      path.join(manifestsDir, 'latest.json'),
      JSON.stringify({ latestUpdateId: metadata.id }, null, 2)
    );

    console.log(`✅ Update saved: ${metadata.id} (channel: ${metadata.channel})`);
  }

  async getLatestUpdateId(channel: string): Promise<string | null> {
    try {
      const latestPath = path.join(this.getManifestsDir(channel), 'latest.json');
      const content = await fs.readFile(latestPath, 'utf-8');
      return JSON.parse(content).latestUpdateId;
    } catch {
      return null;
    }
  }

  async getUpdateMetadata(channel: string, updateId: string): Promise<UpdateMetadata | null> {
    try {
      const metadataPath = path.join(this.getManifestsDir(channel), `${updateId}.json`);
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getBundlePath(channel: string, updateId: string): Promise<string> {
    return path.join(this.getBundlesDir(channel), updateId, 'bundle.js');
  }

  async getAssetPath(channel: string, updateId: string, assetPath: string): Promise<string> {
    return path.join(this.getBundlesDir(channel), updateId, assetPath);
  }

  async listChannels(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.baseDir);
      const stats = await Promise.all(entries.map(e => fs.stat(path.join(this.baseDir, e))));
      return entries.filter((_, i) => stats[i].isDirectory());
    } catch {
      return [];
    }
  }
}
