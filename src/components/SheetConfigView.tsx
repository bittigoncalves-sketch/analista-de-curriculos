import React, { useState } from 'react';
import { 
  Database,
  Link,
  Key,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Code,
  Check,
  AlertTriangle,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { SheetConfig, SyncLog, UserRole } from '../types.js';

interface SheetConfigViewProps {
  config: SheetConfig;
  syncLogs: SyncLog[];
  onSaveConfig: (config: SheetConfig) => Promise<void>;
  onTriggerSync: () => Promise<void>;
  userRole: UserRole;
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void;
}

export default function SheetConfigView({
  config,
  syncLogs,
  onSaveConfig,
  onTriggerSync,
  userRole,
  showToast
}: SheetConfigViewProps) {
  
  // Local inputs
  const [url, setUrl] = useState(config.url || '');
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId || '');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [frequency, setFrequency] = useState<number>(config.autoSyncInterval || 15);
  
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'Administrador') {
      showToast('Apenas administradores podem alterar as configurações de planilha.', 'warn');
      return;
    }

    setSaving(true);
    try {
      // If URL is pasted, extract ID automatically to help the user
      let finalId = spreadsheetId.trim();
      if (url.includes('/d/')) {
        const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (matches && matches[1]) {
          finalId = matches[1];
          setSpreadsheetId(finalId);
        }
      }

      await onSaveConfig({
        url: url.trim(),
        spreadsheetId: finalId,
        apiKey: apiKey.trim(),
        autoSyncInterval: frequency,
        lastSyncTime: config.lastSyncTime,
        syncedRecordsCount: config.syncedRecordsCount
      });
      showToast('Configurações de planilha atualizadas no Sheets Sync!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Falha ao salvar as configurações.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      showToast('Lançando sincronização remota...', 'success');
      await onTriggerSync();
    } catch (err: any) {
      showToast(err.message || 'Falha na sincronização direta.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const syncFrequencies = [
    { label: 'Desativado', val: 0 },
    { label: 'A cada 5 minutos', val: 5 },
    { label: 'A cada 15 minutos', val: 15 },
    { label: 'A cada 30 minutos', val: 30 },
    { label: 'A cada 1 hora', val: 60 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Sincronização Google Sheets</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Defina os parâmetros de conexão para sincronização bidirecional do banco de dados.</p>
      </div>

      {/* Main Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Connection Setup Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm shadow-slate-100/10 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Link className="w-5 h-5 text-slate-800 dark:text-slate-200" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Parâmetros de Conexão</h3>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            {/* Input URL */}
            <div>
              <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">URL da Planilha Google</label>
              <input
                type="url"
                disabled={userRole !== 'Administrador'}
                placeholder="Ex: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvMnZh8m.../edit"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Spreadsheet ID */}
              <div>
                <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">ID da Planilha (Extraído da URL)</label>
                <input
                  type="text"
                  disabled={userRole !== 'Administrador'}
                  placeholder="Ex: 1BxiMVs0XRA5nFMdKvMnZh8m..."
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 font-mono text-xxxxs"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Chave de API do Google Cloud</label>
                <input
                  type="password"
                  disabled={userRole !== 'Administrador'}
                  placeholder="Ex: AIzaSyD6..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Sync frequency selector */}
            <div>
              <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Intervalo de Atualização Automática</label>
              <div className="flex gap-2">
                <select
                  disabled={userRole !== 'Administrador'}
                  value={frequency}
                  onChange={(e) => setFrequency(Number(e.target.value))}
                  className="flex-1 p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-150 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                >
                  {syncFrequencies.map(f => <option key={f.val} value={f.val}>{f.label}</option>)}
                </select>
                <div className="p-2 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Submit button */}
            {userRole === 'Administrador' && (
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-slate-300 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
              >
                {saving ? 'Sinalizando...' : 'Conectar Planilha'}
              </button>
            )}
          </form>
        </div>

        {/* Sync Controls / Dashboard State Cards */}
        <div className="space-y-6">
          
          {/* Sincronização Panel detail card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm shadow-slate-100/10 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <RefreshCw className={`w-5 h-5 text-slate-750 dark:text-slate-300 ${syncing ? 'animate-spin' : ''}`} />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Painel de Ações de Sincronismo</h3>
            </div>

            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-55 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
                <p className="text-xxxxs font-bold text-slate-450 uppercase tracking-widest leading-none mb-1">Última Sincronização</p>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleString() : 'Nunca Sincronizado'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-55 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
                <p className="text-xxxxs font-bold text-slate-450 uppercase tracking-widest leading-none mb-1">Registros Sincronizados</p>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {config.syncedRecordsCount} candidatos
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/50 dark:bg-slate-850/50 rounded-2xl space-y-2 text-xxs text-slate-650 dark:text-slate-350 leading-relaxed border border-slate-150 dark:border-slate-800">
              <div className="flex gap-2 items-start font-medium leading-normal">
                <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-405 mt-0.5 flex-shrink-0" />
                <p>
                  Sua planilha do Google Sheets funcionará como o **banco de dados mestre**. 
                  Os status de candidatos atualizados no Sheets Sync serão imediatamente atualizados e organizados na planilha.
                </p>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={syncing || userRole === 'Visualizador'}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200/60 dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-100 dark:border-slate-700 text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
            </button>
          </div>

          {/* Setup Instructions Card info */}
          <div className="bg-slate-1000 dark:bg-slate-900/50 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-950/20 border border-slate-205 dark:border-slate-800 p-5 rounded-3xl space-y-3">
            <h4 className="text-xxs font-extrabold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <Compass className="w-4 h-4 text-slate-700 dark:text-slate-300" /> Como configurar seu Google Sheet:
            </h4>
            
            <ol className="list-decimal pl-4 space-y-1 text-xxs text-slate-600 dark:text-slate-400 leading-normal font-sans font-medium">
              <li>Crie uma nova Planilha no Google Sheets.</li>
              <li>Defina o compartilhamento como **"Qualquer pessoa com o link pode ler"**.</li>
              <li>A planilha deve conter os cabeçalhos: **ID**, **Nome**, **Email**, **Telefone**, **Cidade**, **Estado**, **Formação**, **Experiência**, **Habilidades**, **Cargo**, **Data**, **Status** na primeira linha.</li>
              <li>Cole a URL completa ou o ID da planilha e sua Chave API obtida no console Google Cloud.</li>
            </ol>
          </div>

        </div>

      </div>

      {/* Sincronização Operations Logs Console terminal */}
      <div className="bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            </div>
            <span className="text-xxs font-bold text-slate-400 ml-2">Console do Sincronizador (Transações API)</span>
          </div>

          <span className="text-xxxxs bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">API v4 Ativa</span>
        </div>

        {/* Console dynamic logs text lines */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-xxxxs leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
          <p className="text-slate-500">[STARTUP - OK] Sheets Sync Engine iniciado no Cloud Run de contêineres.</p>
          <p className="text-slate-500">[GEMINI - PROMPT ACTIVE] Heurística sênior e de IA ativas usando o modelo gemini-3.5-flash.</p>
          
          {syncLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className={
                log.status === 'success' ? 'text-emerald-400' :
                log.status === 'warning' ? 'text-amber-400' : 'text-red-400'
              }>
                {log.status === 'success' ? '[INFO]' : log.status === 'warning' ? '[SIMULAR]' : '[AVISO]'}
              </span>
              <span className="text-slate-300">
                ({new Date(log.timestamp).toLocaleTimeString()}) {log.message}
              </span>
            </div>
          ))}
          
          <p className="text-slate-505">[Aguardando gatilhos] Escutando alterações no formulário de currículos e sincronias remotas.</p>
        </div>
      </div>
    </div>
  );
}
