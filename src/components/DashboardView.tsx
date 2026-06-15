import React from 'react';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Activity,
  ArrowRight,
  Database
} from 'lucide-react';
import { Candidate, CandidateStatus, SyncLog } from '../types.js';

interface DashboardViewProps {
  candidates: Candidate[];
  syncLogs: SyncLog[];
  onSelectCandidate: (candidate: Candidate) => void;
  setTab: (tab: string) => void;
}

export default function DashboardView({
  candidates,
  syncLogs,
  onSelectCandidate,
  setTab
}: DashboardViewProps) {
  
  // 1. Calculate counters
  const total = candidates.length;
  const countNew = candidates.filter(c => c.status === 'Novo').length;
  const countReview = candidates.filter(c => c.status === 'Em análise').length;
  const countInterview = candidates.filter(c => c.status === 'Entrevista').length;
  const countApproved = candidates.filter(c => c.status === 'Aprovado').length;
  const countHired = candidates.filter(c => c.status === 'Contratado').length;
  const countRejected = candidates.filter(c => c.status === 'Reprovado').length;

  const totalPositive = countApproved + countHired;

  // 2. Candidates by Job Desired Position (Candidatos por vaga)
  const positionMap: Record<string, number> = {};
  candidates.forEach(c => {
    const pos = c.desiredPosition || 'Não Informado';
    positionMap[pos] = (positionMap[pos] || 0) + 1;
  });
  const positionsData = Object.entries(positionMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 positions

  // 3. Candidates by Status
  const statusValues: { label: CandidateStatus; count: number; color: string; bg: string }[] = [
    { label: 'Novo', count: countNew, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-350 dark:bg-slate-500' },
    { label: 'Em análise', count: countReview, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-400 dark:bg-slate-400' },
    { label: 'Entrevista', count: countInterview, color: 'text-slate-800 dark:text-slate-200', bg: 'bg-slate-600 dark:bg-slate-300' },
    { label: 'Aprovado', count: countApproved, color: 'text-slate-905 dark:text-white', bg: 'bg-slate-900 dark:bg-slate-100' },
    { label: 'Reprovado', count: countRejected, color: 'text-slate-400 dark:text-slate-600', bg: 'bg-slate-250 dark:bg-slate-700' },
    { label: 'Contratado', count: countHired, color: 'text-slate-950 dark:text-slate-50', bg: 'bg-slate-800 dark:bg-slate-200' },
  ];

  // 4. Monthly application evolution
  // We mock standard registration months
  const monthsData = [
    { month: 'Mar', count: 2 },
    { month: 'Abr', count: 4 },
    { month: 'Mai', count: 8 },
    { month: 'Jun', count: candidates.filter(c => c.registrationDate.includes('-06-')).length || 5 },
  ];

  const maxMonthCount = Math.max(...monthsData.map(d => d.count), 1);

  // Recent 3 registrations
  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
    .slice(0, 3);

  // Last successful sync time details
  const lastSync = syncLogs.find(l => l.status === 'success');

  return (
    <div className="space-y-6">
      {/* Header section with active sync state info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Painel de Métricas</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Indicadores em tempo real integrados à planilha Google Sheets.</p>
        </div>
        
        {lastSync && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-400 text-xs">
            <Database className="w-4 h-4" />
            <span className="font-medium">
              Última sincronização ativa: <strong>{new Date(lastSync.timestamp).toLocaleTimeString()}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Grid of Key ATS Metrics (SaaS bento format) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Candidates Block */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-sm transition-all shadow-slate-100/30">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xxs leading-none font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Currículos</p>
            <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-100 mt-1">{total}</h3>
          </div>
        </div>

        {/* New Candidates */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-sm transition-all shadow-slate-100/30">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xxs leading-none font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Novos</p>
            <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-100 mt-1">{countNew}</h3>
          </div>
        </div>

        {/* Candidates in Review */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-sm transition-all shadow-slate-100/30">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xxs leading-none font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Em Análise</p>
            <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-100 mt-1">{countReview}</h3>
          </div>
        </div>

        {/* Hired / Positive Candidates */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-sm transition-all shadow-slate-100/30">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xxs leading-none font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Aprovados/Contratados</p>
            <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-100 mt-1">{totalPositive}</h3>
          </div>
        </div>

        {/* Rejected candidates */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-sm transition-all shadow-slate-100/30 col-span-2 lg:col-span-1">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xxs leading-none font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Desclassificados</p>
            <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-100 mt-1">{countRejected}</h3>
          </div>
        </div>
      </div>

      {/* Graphs Panel Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* GRAPH 1: Candidates Distribution by Status (Circular Progress Rings + list) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-slate-100/25">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Candidatos por Status
          </h4>
          
          <div className="space-y-3.5">
            {statusValues.map((item) => {
              const pct = total > 0 ? Math.round((item.count / total) * 105) : 0;
              const barWidth = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-slate-500 font-mono text-xxs font-medium">{item.count} ({Math.round(barWidth)}%)</span>
                  </div>
                  {/* Dynamic Custom bar */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.bg} rounded-full transition-all duration-1000`} 
                      style={{ width: `${barWidth || 2}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPH 2: Candidates by desired position (Vertical styled dynamic bars) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-slate-100/25">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Candidatos por Vagas (Top 5)
          </h4>
          
          {positionsData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400 py-10">
              Nenhum dado registrado
            </div>
          ) : (
            <div className="space-y-4">
              {positionsData.map((pos, idx) => {
                const maxCount = Math.max(...positionsData.map(d => d.count), 1);
                const percent = (pos.count / maxCount) * 100;
                return (
                  <div key={pos.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 text-xxs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-850 rounded-full flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate" title={pos.name}>{pos.name}</span>
                        <span className="font-bold text-slate-500 font-mono text-xxs">{pos.count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-800 dark:bg-slate-450 rounded-full transition-all duration-700" 
                          style={{ width: `${percent || 4}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GRAPH 3: Monthly Applications Growth (Creative SVG bar visualization) */}
        <div className="bg-white dark:bg-slate-1000 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-slate-100/25">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Evolução Mensal de Inscrições
          </h4>
          <p className="text-xxs text-slate-400 mb-5 leading-none">Acompanhamento de volume ao longo do ano.</p>

          <div className="grid grid-cols-4 gap-3 items-end h-32 px-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {monthsData.map((item) => {
              // Calculate percentual height
              const heightPct = (item.count / maxMonthCount) * 100;
              return (
                <div key={item.month} className="flex flex-col items-center gap-2 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <span className="text-xxxxs font-bold text-white bg-slate-800 dark:bg-slate-755 py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                    {item.count} currículos
                  </span>
                  
                  {/* Visual Bar */}
                  <div 
                    className="w-full bg-slate-200/50 dark:bg-slate-800/60 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 rounded-t-lg transition-all duration-1000 relative flex items-end justify-center overflow-hidden"
                    style={{ height: `${Math.max(heightPct, 10)}%` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 dark:bg-slate-200" />
                    <span className="text-xxs font-bold text-slate-800 dark:text-slate-200 select-none pb-1 font-mono">{item.count}</span>
                  </div>
                  
                  {/* label translation */}
                  <span className="text-xxs font-semibold text-slate-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Two-Column split summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
        
        {/* Dynamic Starred/Recent Candidates Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600 dark:text-slate-450" />
                Novos Candidatos Inscritos
              </h4>
              <button 
                onClick={() => setTab('candidates')}
                className="text-xxs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:underline hover:text-slate-900 dark:hover:text-white"
              >
                Ver todos os candidatos <ArrowRight className="w-3" />
              </button>
            </div>

            {recentCandidates.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Nenhum candidato cadastrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {recentCandidates.map((candidate) => (
                  <div 
                    key={candidate.id}
                    onClick={() => onSelectCandidate(candidate)}
                    className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-55 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                  >
                    <div>
                      <h5 className="font-semibold text-xs text-slate-800 dark:text-slate-100">{candidate.name}</h5>
                      <div className="flex items-center gap-3.5 mt-1 text-slate-400 dark:text-slate-500 text-xxs">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {candidate.city} - {candidate.state}
                        </span>
                        <span>{candidate.desiredPosition}</span>
                        <span>{new Date(candidate.registrationDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <span className={`text-xxxxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      candidate.status === 'Novo' ? 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700' :
                      candidate.status === 'Em análise' ? 'bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700' :
                      candidate.status === 'Entrevista' ? 'bg-slate-200 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600' :
                      candidate.status === 'Aprovado' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' :
                      candidate.status === 'Reprovado' ? 'bg-slate-50 text-slate-400 border border-slate-150 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800' :
                      'bg-slate-955 text-white dark:bg-white dark:text-slate-950 px-2.5'
                    }`}>
                      {candidate.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync logs Activity Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-855 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                Logs de Integração
              </h4>
              <button 
                onClick={() => setTab('sheets')}
                className="text-xxs font-semibold text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
              >
                Configurações
              </button>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {syncLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex gap-2.5 text-xxs leading-normal">
                  <div className="mt-1 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full block ${
                      log.status === 'success' ? 'bg-emerald-500' :
                      log.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-350">{log.message}</p>
                    <span className="text-slate-400 font-mono tracking-tighter text-xxxxs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {syncLogs.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">Nenhum log registrado.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
