import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Database, 
  Menu, 
  Sun, 
  Moon, 
  LogIn, 
  Lock, 
  HelpCircle, 
  RefreshCw, 
  AlertCircle,
  FileSpreadsheet,
  XCircle,
  Clock,
  LogOut,
  UserCheck
} from 'lucide-react';
import { Candidate, SheetConfig, User, UserRole, SyncLog, CandidateStatus } from './types.js';
import Sidebar from './components/Sidebar.tsx';
import DashboardView from './components/DashboardView.tsx';
import CandidatesTable from './components/CandidatesTable.tsx';
import CandidateDrawer from './components/CandidateDrawer.tsx';
import CandidateModal from './components/CandidateModal.tsx';
import SheetConfigView from './components/SheetConfigView.tsx';

export default function App() {
  
  // Applet Tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);

  // Authentication Context
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('admin@sheetssync.com.br');
  const [authPass, setAuthPass] = useState('admin');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Core candidate data cache state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [syncConfig, setSyncConfig] = useState<SheetConfig>({
    url: '',
    spreadsheetId: '',
    apiKey: '',
    autoSyncInterval: 15,
    lastSyncTime: null,
    syncedRecordsCount: 0
  });
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Selection & Form Drawers/Modals states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null); // null means creating

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  // Load user session on start, sync configuration, and initial cached candidates
  useEffect(() => {
    // Check local storage for session parameters
    const savedToken = localStorage.getItem('sheets_sync_token');
    const savedUser = localStorage.getItem('sheets_sync_user');
    const savedTheme = localStorage.getItem('sheets_sync_dark');

    if (savedTheme === 'true') {
      setDarkTheme(true);
    }

    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    } else {
      // Setup preset session by default for immediate preview if login bypass chosen
      // But let's let them login. To make testing amazing, we have preset selectors on the Login view
    }

    fetchConfigAndLogs();
  }, []);

  // Update theme tag on html node
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkTheme) {
      root.classList.add('dark');
      localStorage.setItem('sheets_sync_dark', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('sheets_sync_dark', 'false');
    }
  }, [darkTheme]);

  // Sync Log, configs loader
  const fetchConfigAndLogs = async () => {
    try {
      const [configRes, logsRes] = await Promise.all([
        fetch('/api/sheets/config'),
        fetch('/api/sheets/logs')
      ]);

      if (configRes.ok) {
        const cData = await configRes.json();
        setSyncConfig(cData.config);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setSyncLogs(lData.logs || []);
      }
    } catch (err) {
      console.error("Failed to load configs", err);
    }
  };

  // Main candidates list fetcher
  useEffect(() => {
    if (currentUser) {
      fetchCandidates();
    }
  }, [currentUser]);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Failed to fetch candidates", err);
    }
  };

  // Auto synchronization scheduler interval hook
  useEffect(() => {
    if (!currentUser || syncConfig.autoSyncInterval === 0) return;

    const intervalMs = syncConfig.autoSyncInterval * 60 * 1000;
    
    const autoSyncTimer = setInterval(() => {
      console.log(`Auto synchronizer tick: running sync every ${syncConfig.autoSyncInterval} minutes.`);
      triggerSyncRoutine(true); // silent background sync
    }, intervalMs);

    return () => clearInterval(autoSyncTimer);
  }, [currentUser, syncConfig.autoSyncInterval]);

  const showToast = (message: string, type: 'success' | 'warn' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPass })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setCurrentUser(data.user);
        
        localStorage.setItem('sheets_sync_token', data.token);
        localStorage.setItem('sheets_sync_user', JSON.stringify(data.user));
        
        showToast(`Bem-vindo de volta, ${data.user.name}!`, 'success');
      } else {
        const err = await response.json();
        showToast(err.error || 'Credenciais incorretas.', 'error');
      }
    } catch (err) {
      showToast('Erro de rede ao conectar com o servidor.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;

    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        setShowRecovery(false);
      } else {
        const err = await response.json();
        showToast(err.error || 'E-mail não localizado.', 'error');
      }
    } catch (err) {
      showToast('Erro de rede.', 'error');
    }
  };

  // Quick switch logins helper inside development sandbox
  const handlePresetLogin = (email: string, pass: string) => {
    setAuthEmail(email);
    setAuthPass(pass);
    showToast('Campos de login preenchidos!', 'success');
  };

  // Change current Role Simulator (RBAC testing)
  const handleChangeRole = (role: UserRole) => {
    if (!currentUser) return;
    const updatedUser: User = { ...currentUser, role };
    setCurrentUser(updatedUser);
    
    // Set a new temporary token for authorization header
    const tokenPayload = { id: Math.random().toString(), name: updatedUser.name, email: updatedUser.email, role: updatedUser.role };
    const newToken = btoa(JSON.stringify(tokenPayload));
    setToken(newToken);
    
    localStorage.setItem('sheets_sync_token', newToken);
    localStorage.setItem('sheets_sync_user', JSON.stringify(updatedUser));
    showToast(`Perfil alterado para: ${role}`, 'success');
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('sheets_sync_token');
    localStorage.removeItem('sheets_sync_user');
    showToast('Sessão encerrada.', 'success');
  };

  // Google Sheets integration operations
  const handleSaveSheetConfig = async (newConfig: SheetConfig) => {
    try {
      const response = await fetch('/api/sheets/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newConfig)
      });

      if (response.ok) {
        const data = await response.json();
        setSyncConfig(data.config);
        fetchConfigAndLogs();
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Falha ao salvar as configurações.');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const triggerSyncRoutine = async (silent = false) => {
    try {
      const response = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSyncConfig(data.config);
        setCandidates(data.candidates);
        fetchConfigAndLogs();
        if (!silent) {
          showToast(data.message || 'Sincronização realizada com sucesso!', 'success');
        }
      } else {
        const err = await response.json();
        if (!silent) {
          showToast(err.message || 'Falha na sincronização.', 'error');
        }
        fetchConfigAndLogs();
      }
    } catch (err: any) {
      if (!silent) {
        showToast(err.message || 'Erro ao conectar.', 'error');
      }
    }
  };

  // Candidate Data operations
  const handleSaveCandidate = async (candidate: Candidate) => {
    const isEdit = !!candidate.id;
    const urlStr = isEdit ? `/api/candidates/${candidate.id}` : '/api/candidates';
    const methodStr = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(urlStr, {
        method: methodStr,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(candidate)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (isEdit) {
          setCandidates(candidates.map(c => c.id === candidate.id ? data.candidate : c));
          showToast('Candidato atualizado com sucesso!', 'success');
          
          // If drawer is opened with edited candidate, refresh active state
          if (selectedCandidate && selectedCandidate.id === candidate.id) {
            setSelectedCandidate(data.candidate);
          }
        } else {
          setCandidates([data.candidate, ...candidates]);
          showToast('Candidato cadastrado com sucesso!', 'success');
        }
        
        fetchConfigAndLogs(); // refresh sync console logs
        
      } else {
        const err = await response.json();
        showToast(err.message || 'Erro ao salvar candidato.', 'error');
      }
    } catch (err) {
      showToast('Falha na comunicação de salvamento.', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: CandidateStatus) => {
    try {
      const response = await fetch(`/api/candidates/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(candidates.map(c => c.id === id ? data.candidate : c));
        
        if (selectedCandidate && selectedCandidate.id === id) {
          setSelectedCandidate(data.candidate);
        }
        showToast(`Status atualizado para: ${status}`, 'success');
        fetchConfigAndLogs();
      } else {
        const err = await response.json();
        showToast(err.message || 'Falha ao alterar status.', 'error');
      }
    } catch (err) {
      showToast('Erro de rede.', 'error');
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCandidates(candidates.filter(c => c.id !== id));
        setSelectedCandidate(null);
        showToast('Candidato removido permanentemente.', 'success');
        fetchConfigAndLogs();
      } else {
        const err = await response.json();
        showToast(err.message || 'Falha ao remover o registro.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão.', 'error');
    }
  };

  const handleToggleStarred = async (candidate: Candidate) => {
    const updated = { ...candidate, starred: !candidate.starred };
    
    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      
      if (response.ok) {
        const data = await response.json();
        setCandidates(candidates.map(c => c.id === candidate.id ? data.candidate : c));
        setSelectedCandidate(data.candidate);
        showToast(data.candidate.starred ? 'Candidato colocado nos destaques!' : 'Candidato removido dos destaques.', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerManualEditFromDrawer = (candidate: Candidate) => {
    setCandidateToEdit(candidate);
    setIsModalOpen(true);
  };

  // Renders the correct content view based on active tab state
  const renderContainerView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            candidates={candidates}
            syncLogs={syncLogs}
            onSelectCandidate={setSelectedCandidate}
            setTab={setActiveTab}
          />
        );
      case 'candidates':
        return (
          <CandidatesTable 
            candidates={candidates}
            onSelectCandidate={setSelectedCandidate}
            onUpdateStatus={handleUpdateStatus}
            onOpenCreateModal={() => {
              setCandidateToEdit(null);
              setIsModalOpen(true);
            }}
            userRole={currentUser ? currentUser.role : 'Visualizador'}
            showToast={showToast}
          />
        );
      case 'sheets':
        return (
          <SheetConfigView 
            config={syncConfig}
            syncLogs={syncLogs}
            onSaveConfig={handleSaveSheetConfig}
            onTriggerSync={() => triggerSyncRoutine(false)}
            userRole={currentUser ? currentUser.role : 'Visualizador'}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  // If session token not active, we render the corporate login panel screen
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100 transition-colors">
        
        {/* UPPER BRANDING HEADER */}
        <div className="text-center mb-6 space-y-2">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/10">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase leading-none">Sheets Sync</h1>
            <p className="text-xxs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mt-1">Sincronizador Inteligente de Currículos</p>
          </div>
        </div>

        {/* LOG-IN PANEL FRAME */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-xl space-y-4">
          
          {showRecovery ? (
            // Recovery form interface
            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recuperação de Senha</h2>
                <p className="text-xxxxs text-slate-450 dark:text-slate-400 mt-1 leading-normal uppercase font-semibold">Insira o e-mail cadastrado e recuperaremos seu acesso instantaneamente.</p>
              </div>

              <div>
                <label className="block text-xxxxs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Endereço de E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@sheetssync.com.br"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecovery(false)}
                  className="text-xxs font-bold text-slate-500 hover:underline"
                >
                  Voltar ao Login
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-650 text-white rounded-xl text-xxs font-bold shadow-md shadow-blue-500/10"
                >
                  Confirmar Recuperação
                </button>
              </div>
            </form>
          ) : (
            // standard login layout
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <p className="text-xxxxs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Acesso Corporativo</p>
                <p className="text-xxs text-slate-500 dark:text-slate-400 leading-normal font-sans">Forneça credenciais autorizadas de RH ou Administrador.</p>
              </div>

              <div className="space-y-3.5">
                {/* Email inputs */}
                <div>
                  <label className="block text-xxxxs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Endereço de E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@sheetssync.com.br"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all font-mono"
                  />
                </div>

                {/* Password inputs */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xxxxs font-bold text-slate-400 uppercase tracking-widest leading-none">Senha</label>
                    <button
                      type="button"
                      onClick={() => setShowRecovery(true)}
                      className="text-xxxxs font-bold hover:underline text-slate-450 dark:text-slate-400 block uppercase"
                    >
                      Esqueceu?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPass}
                      onChange={(e) => setAuthPass(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                    <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Login submit button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-650 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Acessar o Sincronizador</span>
                  </>
                )}
              </button>

              {/* Sandbox Direct Login accounts switcher (PRESETS) to make evaluation exceptionally painless */}
              <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-1.5">
                <span className="block text-xxxxs font-bold text-slate-400 uppercase tracking-widest text-center leading-none">Selecione uma conta para testes imediatos</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => handlePresetLogin('admin@sheetssync.com.br', 'admin')}
                    className="text-xxxxs font-bold py-1.5 px-1 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300"
                  >
                    Administrador
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetLogin('mariana.rh@sheetssync.com.br', 'rh')}
                    className="text-xxxxs font-bold py-1.5 px-1 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300"
                  >
                    Recrutador RH
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetLogin('carlos.direcao@sheetssync.com.br', 'carlos')}
                    className="text-xxxxs font-bold py-1.5 px-1 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300"
                  >
                    Visualizador
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

        {/* Outer Help note */}
        <div className="text-center mt-4 text-xxxxs text-slate-400 max-w-sm leading-normal font-sans font-medium">
          Dica: Usuários têm diferentes níveis de permissão (Admin tem controle total de planilhas e exclusão, RH gerencia e comenta, Visualizador apenas lê).
        </div>

        {/* Global Floating Toast Popup inside authentication views */}
        {toast && (
          <div className={`fixed bottom-5 right-5 z-[100] p-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up border ${
            toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' :
            toast.type === 'warn' ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300' :
            'bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xxs font-bold font-sans">{toast.message}</span>
          </div>
        )}

      </div>
    );
  }

  // PORTAL PANEL TEMPLATE SYSTEM IF LOGGED IN
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors overflow-hidden">
      
      {/* SIDEBAR NAVIGATION COLUMN */}
      <Sidebar 
        currentTab={activeTab}
        setTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        dark={darkTheme}
        setDark={setDarkTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
        onChangeRole={handleChangeRole}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* UPPER TOP NAVBAR */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30 flex items-center justify-between no-print shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              {activeTab === 'dashboard' ? 'Métricas & Painel' : activeTab === 'candidates' ? 'Gestão de Currículos' : 'Conector Google Sheets'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Direct manual synchronization action button */}
            <button
              onClick={() => triggerSyncRoutine(false)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
              title="Sincronizar dados agora"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Micro active status */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xxxxs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Conectado</span>
            </div>

          </div>
        </header>

        {/* CONTAINER VIEW WRAPPER */}
        <div className="p-6 max-w-7xl w-full mx-auto flex-1">
          {renderContainerView()}
        </div>

      </main>

      {/* LATERAL SLIDE-OUT DRAWER PANEL (Candidate profiles inspection) */}
      <CandidateDrawer 
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onEdit={triggerManualEditFromDrawer}
        onDelete={handleDeleteCandidate}
        userRole={currentUser.role}
        currentUsername={currentUser.name}
        showToast={showToast}
        onToggleStarred={handleToggleStarred}
      />

      {/* FORM MODAL POPUP (Manual entry + dynamic file extract parser) */}
      {isModalOpen && (
        <CandidateModal 
          candidate={candidateToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setCandidateToEdit(null);
          }}
          onSave={handleSaveCandidate}
          showToast={showToast}
        />
      )}

      {/* GLOBAL NOTIFICATION SYSTEM (TOAST POPUP) */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] p-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up border ${
          toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-150 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' :
          toast.type === 'warn' ? 'bg-amber-50 dark:bg-amber-950 border-amber-150 dark:border-amber-900 text-amber-805 dark:text-amber-300' :
          'bg-rose-50 dark:bg-rose-950 border-rose-150 dark:border-rose-900 text-rose-800 dark:text-rose-300'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xxs font-bold font-sans">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
