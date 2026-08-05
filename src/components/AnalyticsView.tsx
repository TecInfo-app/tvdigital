/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Search, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';
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
import { LogEntry } from '../types';

interface AnalyticsViewProps {
  logs?: LogEntry[];
}

export default function AnalyticsView({ logs = [] }: AnalyticsViewProps) {
  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  // Filtering logs
  const filteredLogs = logs.filter(log => {
    // 1. Text Search
    const term = searchTerm.toLowerCase().trim();
    const matchesText = !term || 
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.mediaName && log.mediaName.toLowerCase().includes(term)) ||
      (log.player && log.player.toLowerCase().includes(term));

    // 2. Date Search
    let matchesDate = true;
    if (filterDate) {
      // filterDate is YYYY-MM-DD
      // log.time might be "DD/MM/YYYY HH:MM:SS" or log.timestamp is ms
      if (log.timestamp) {
        const d = new Date(log.timestamp);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const formattedLogDate = `${yyyy}-${mm}-${dd}`;
        matchesDate = formattedLogDate === filterDate;
      } else if (log.time) {
        // Try parsing DD/MM/YYYY or similar in log.time
        const parts = log.time.split(' ')[0].split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY
          const formattedLogDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          matchesDate = formattedLogDate === filterDate;
        }
      }
    }

    return matchesText && matchesDate;
  });

  // Pagination logic
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // Handle page changes
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-sans text-xl font-bold text-slate-800">Telemetria e Logs de Sinalização</h2>
          <p className="text-xs text-slate-500 mt-0.5">Curvas de integridade em tempo real, sensores de hardware e estatísticas de despacho em nuvem</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span>Monitorando em Tempo Real</span>
        </div>
      </div>

      {/* Analytics Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Latência Média</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">42 ms</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center shrink-0 border border-pink-100">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Uptime da Rede</p>
            <p className="text-lg font-bold text-pink-600 mt-0.5">98.92%</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Média de CPU</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">24.5%</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Espaço Usado</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">142.4 GB</p>
          </div>
        </div>
      </div>

      {/* Recharts Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bandwidth Usage Area Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4.5 h-4.5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800">Histórico de Uso de Banda (Mbps)</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bandwidthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNyc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTokyo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  labelStyle={{ color: '#334155', fontWeight: 'bold', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="NYC" name="NYC-01" stroke="#6366f1" fillOpacity={1} fill="url(#colorNyc)" strokeWidth={2} />
                <Area type="monotone" dataKey="Tokyo" name="TOKYO-03" stroke="#ec4899" fillOpacity={1} fill="url(#colorTokyo)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uptime Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-pink-500" />
            <h3 className="text-sm font-bold text-slate-800">Uptime Semanal da Rede %</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uptimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[95, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  labelStyle={{ color: '#334155', fontWeight: 'bold', fontSize: '11px' }}
                />
                <Bar dataKey="Uptime" name="Uptime %" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time Logs Section with Search, Date Picker & Pagination */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Histórico de Logs em Tempo Real</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pesquise, filtre e audite todas as atividades de sinalização</p>
          </div>

          {/* Controls: Search and Date Filter */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar mídia ou ação..."
                className="pl-9 pr-3 py-1.5 w-full md:w-56 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              />
            </div>

            {(searchTerm || filterDate) && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Table of logs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Ação / Mídia</th>
                <th className="py-3 px-4">Player / Tela</th>
                <th className="py-3 px-4 text-right">Data & Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {log.mediaName ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span>Exibiu: <strong className="text-slate-900">{log.mediaName}</strong></span>
                        </div>
                      ) : (
                        log.action
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.player || 'Player 1 (Geral)'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {log.time}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 px-4 text-center text-slate-400">
                    Nenhum log encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Mostrando <strong className="text-slate-700">{startIndex + 1}</strong> a <strong className="text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> de <strong className="text-slate-700">{totalItems}</strong> logs
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
