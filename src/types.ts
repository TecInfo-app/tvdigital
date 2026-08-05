/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MediaItem {
  id: string;
  name: string;
  url?: string;
  content?: string;
  duration?: number; // in seconds
  schedule?: string;
  type: string; // 'video_url' | 'img_url' | 'widget' | 'upload_video' | 'upload_img' | 'video' | 'image'
  active?: boolean;
  order?: number;
  start?: string;
  end?: string;
  days?: number[];
  userId?: string;
  playlistName?: string;
  paused?: boolean;
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
  mediaName?: string;
  timestamp?: number;
}
