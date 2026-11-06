export type DeviceType = 'windows' | 'android' | 'tablet' | 'web';

export type ClipType = 'text' | 'url' | 'code' | 'multiline';

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  networkName?: string;
  ip?: string;
  lastSeen?: number;
  isOnline?: boolean;
}

export interface ClipboardItem {
  id: string;
  text: string;
  type: ClipType;
  encryptedPayload: string;
  iv: string;
  salt: string;
  hash: string;
  device: DeviceInfo;
  timestamp: number;
  isPinned?: boolean;
  charCount: number;
  lineCount: number;
}

export interface AppSettings {
  maxHistory: number; // default: 5 (expandable to 10, 20, 30, 50, 100)
  autoSync: boolean;
  networkFilterEnabled: boolean; // only sync on designated networks
  allowedNetworks: string[];
  currentNetwork: string;
  encryptionEnabled: boolean;
  passphrase: string;
  autoStartOnBoot: boolean;
  backgroundService: boolean;
  soundNotification: boolean;
  autoCopyToSystem: boolean;
  deviceType: DeviceType;
  deviceName: string;
}

export interface SyncPacket {
  id: string;
  encryptedPayload: string;
  iv: string;
  salt: string;
  hash: string;
  device: DeviceInfo;
  timestamp: number;
}
