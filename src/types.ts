/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  duration: number; // in seconds
  schedule: string; // e.g. "M, T, W, T, F", "Always On", "Weekend"
  type: 'video' | 'image' | 'widget';
  active: boolean;
  items?: Array<{ title: string; description: string; thumbnail?: string; pubDate?: string; showTitle?: boolean; showDescription?: boolean }>;
}

export interface Player {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  currentMediaId?: string;
  resolution: string;
  ip: string;
  lastSync: string;
  cpu: number; // percentage
  bandwidth: number; // Mbps
}

export interface Playlist {
  id: string;
  name: string;
  itemIds: string[];
  isActive: boolean;
}

export interface LogEntry {
  id: string;
  action: string;
  time: string;
  player?: string;
}
