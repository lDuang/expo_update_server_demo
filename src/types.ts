// EAS Update Manifest 格式
export interface ExpoUpdatesManifest {
  id: string;
  createdAt: string;
  runtimeVersion: string;
  channel: string;
  bundleUrl: string;
  assets: Asset[];
  extra?: {
    expoClient: {
      extra?: {
        message?: string;
        criticalIndex?: number;
      };
    };
  };
}

export interface Asset {
  path: string;
  url: string;
  type: 'image' | 'font' | 'asset';
  hash?: string;
}

export interface UpdateMetadata {
  id: string;
  channel: string;
  runtimeVersion: string;
  message?: string;
  criticalIndex?: number;
  createdAt: string;
  bundlePath: string;
  assetPaths: string[];
}
