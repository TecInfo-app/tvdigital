/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart3, Activity, Cpu, HardDrive, Wifi } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function AnalyticsView() {
  // Mock dataset for Bandwidth loads (last 7 hours)
  const bandwidthData = [
    { hour: '10:00', NYC: 12.4, LA: 8.5, Tokyo: 15.2 },
    { hour: '11:00', NYC: 14.2, LA: 9.1, Tokyo: 14.8 },
    { hour: '12:00', NYC: 15.8, LA: 10.3, Tokyo: 18.2 },
    { hour: '13:00', NYC: 13.1, LA: 7.9, Tokyo: 13.1 },
    { hour: '14:00', NYC: 11.9, LA: 8.2, Tokyo: 16.5 },
    { hour: '15:00', NYC: 12.8, LA: 8.7, Tokyo: 15.9 },
    { hour: '16:00', NYC: 14.5, LA: 9.4, Tokyo: 17.1 },
  ];

  // Mock dataset for Uptime percentages (last 5 days)
  const uptimeData = [
    { day: 'Seg', Uptime: 97.8 },
    { day: 'Ter', Uptime: 98.4 },
    { day: 'Qua', Uptime: 98.1 },
    { day: 'Qui', Uptime: 99.2 },
    { day: 'Sex', Uptime: 98.9 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="font-geist text-xl font-bold text-gray-900">Telemetria e Logs de Sinalização</h2>
        <p className="text-xs text-gray-500 mt-0.5">Curvas de integridade em tempo real, sensores de hardware e estatísticas de despacho em nuvem</p>
      </div>

      {/* Analytics Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 glass-card border border-gray-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-200 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold font-geist">Latência Média</p>
            <p className="text-lg font-bold font-geist text-gray-900 mt-0.5">42 ms</p>
          </div>
        </div>

        <div className="p-5 glass-card border border-gray-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-pink-500/10 text-pink-300 rounded-xl flex items-center justify-center shrink-0 border border-pink-500/15">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold font-geist">Uptime da Rede</p>
            <p className="text-lg font-bold font-geist text-pink-300 mt-0.5">98.92%</p>
          </div>
        </div>

        <div className="p-5 glass-card border border-gray-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-300 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/15">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold font-geist">Média de CPU</p>
            <p className="text-lg font-bold font-geist text-gray-900 mt-0.5">24.5%</p>
          </div>
        </div>

        <div className="p-5 glass-card border border-gray-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-200 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold font-geist">Espaço Usado</p>
            <p className="text-lg font-bold font-geist text-gray-900 mt-0.5">142.4 GB</p>
          </div>
        </div>
      </div>

      {/* Recharts Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bandwidth Usage Area Chart */}
        <div className="glass-card p-5 rounded-2xl border border-gray-200 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4.5 h-4.5 text-indigo-300" />
            <h3 className="font-geist text-sm font-bold text-gray-900">Histórico de Uso de Banda (Mbps)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bandwidthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNyc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTokyo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="hour" stroke="rgba(255, 255, 255, 0.4)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255, 255, 255, 0.4)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 19, 51, 0.95)', borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '14px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="NYC" name="NYC-01" stroke="#818cf8" fillOpacity={1} fill="url(#colorNyc)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="Tokyo" name="TOKYO-03" stroke="#f472b6" fillOpacity={1} fill="url(#colorTokyo)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime Bar Chart */}
        <div className="glass-card p-5 rounded-2xl border border-gray-200 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-pink-300" />
            <h3 className="font-geist text-sm font-bold text-gray-900">Uptime Semanal da Rede %</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uptimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.4)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255, 255, 255, 0.4)" fontSize={11} domain={[90, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(23, 19, 51, 0.95)', borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '14px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '11px' }}
                />
                <Bar dataKey="Uptime" name="Uptime %" fill="#f472b6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
