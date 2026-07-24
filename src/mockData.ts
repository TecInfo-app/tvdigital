/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MediaItem, Player, Playlist, LogEntry } from './types';

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'media-1',
    name: 'Summer_Tech_Sale_15s.mp4',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxku0lNUF6YgnB6fJM8sLgPr06Q-S2HMv5vDqXv3k18R3S1ybEAhtEvLXfURpM7-iWv8hBDbzMPWR3YT_bDpCT3eCkvj42NMORYTFuUNe2jz5Jy7VTpdu8CGGnsXXO3f_01U_5pf7aVquPnSIsPEUSRC5C2AhZV-qeVfv1W-z-NFTVW4YtPeYlf65nZHigZn5Hw3Xw2c6_82yl9e4zWLoT_t7NMsrVfp3pLedTti7LU9meh2dRyNsa8KXVB7Anc0K6lk_fA0Sr3eI',
    duration: 15,
    schedule: 'Seg, Ter, Qua, Qui, Sex',
    type: 'video',
    active: true,
  },
  {
    id: 'media-2',
    name: 'Weather_Widget_Live',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOHNW5l5Xpi4KKqGZ1RuFBkRhk6zUB6BMMNlVKjJVGl8a_BlETxhOOanOE9QmgwLG0DC4jz9DNHuBP9_D3tk_S3tBZLj68Ca1UPlimgmhheVbWJSOHgzfen37kWd3uatFyHxf7Gk2djDQB958q3o84xeu07cJUbr7uoYkUlxgbrx-rkz0dC_kV4UHtMCYVWXc5gEYsGwINVOLASDjq15O6knUk0ptFYiYJI8CjlTyhv_VMfp_1iWG5TD3c7bVMIKBXlZiZNHnI6rQ',
    duration: 30, // Simulated update cycle
    schedule: 'Sempre Ativo',
    type: 'widget',
    active: true,
  },
  {
    id: 'media-3',
    name: 'Cafe_Promo_Brand.png',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpIG0UVKT8TMjCpVKC0hZUnZ1XpVTGm35te4VDfz8gPuCaegetcQ83RYuUKFXLiNMO-x-L7PmQsjv6Gv_qGdEmdT41RTVBmPBc8X8Cl00ExUee7YtoIZs7EMPEiJHvUpKaT4e7Na6OJ4oH-sqns6LQkBoE8miyc-8DX9lFdN_VkZ_BgxYvECCgEhv_qBNDOK-f5TiCGiQzfUyUhxSCgEsHPT_l_QrXp0V-3SzTW85zrNQMpNaqTdZIZqD-HxRSSIA4Fe0q8nTyxlk',
    duration: 10,
    schedule: 'Fim de Semana',
    type: 'image',
    active: true,
  },
];

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'player-1',
    name: 'NYC-TIME-SQUARE-01',
    status: 'online',
    currentMediaId: 'media-1',
    resolution: '3840x2160',
    ip: '192.168.1.10',
    lastSync: 'Há 2m',
    cpu: 33,
    bandwidth: 12.4,
  },
  {
    id: 'player-2',
    name: 'LA-CONVENTION-02',
    status: 'online',
    currentMediaId: 'media-2',
    resolution: '1920x1080',
    ip: '192.168.1.11',
    lastSync: 'Há 5m',
    cpu: 18,
    bandwidth: 8.5,
  },
  {
    id: 'player-3',
    name: 'TOKYO-SHIBUYA-03',
    status: 'warning',
    currentMediaId: 'media-3',
    resolution: '3840x2160',
    ip: '192.168.1.12',
    lastSync: 'Há 10m',
    cpu: 89,
    bandwidth: 15.2,
  },
  {
    id: 'player-4',
    name: 'LONDON-PICCADILLY-04',
    status: 'offline',
    currentMediaId: undefined,
    resolution: '1920x1080',
    ip: '192.168.1.13',
    lastSync: 'Há 2h',
    cpu: 0,
    bandwidth: 0,
  },
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Summer Campaign 2024',
    itemIds: ['media-1', 'media-2', 'media-3'],
    isActive: true,
  },
  {
    id: 'playlist-2',
    name: 'Corporate Announcements',
    itemIds: ['media-2'],
    isActive: false,
  },
  {
    id: 'playlist-3',
    name: 'Holiday Promotional Slide',
    itemIds: ['media-1', 'media-3'],
    isActive: false,
  },
];

export const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    action: 'Atualização de Conteúdo #42 implantada com sucesso',
    time: 'Há 2m',
    player: 'NYC-TIME-SQUARE-01',
  },
  {
    id: 'log-2',
    action: "Reinicialização do Reprodutor 'NYC-04' acionada manualmente",
    time: 'Há 15m',
    player: 'LONDON-PICCADILLY-04',
  },
  {
    id: 'log-3',
    action: 'Playlist ativa alterada para Summer Campaign 2024',
    time: 'Há 1h',
  },
  {
    id: 'log-4',
    action: 'Novo ativo de mídia registrado: Cafe_Promo_Brand.png',
    time: 'Há 3h',
  },
];
