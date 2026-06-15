import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { UserRole, User } from '../types.js';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
  currentUser: User | null;
  onLogout: () => void;
  onChangeRole: (role: UserRole) => void;
}

export default function Sidebar({
  currentTab,
  setTab,
  collapsed,
  setCollapsed,
  dark,
  setDark,
  currentUser,
  onLogout,
  onChangeRole
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'candidates', label: 'Candidatos', icon: Users },
    { id: 'sheets', label: 'Google Sheets', icon: Database },
  ];

  const roles: UserRole[] = ['Administrador', 'RH', 'Visualizador'];

  return (
    <aside 
      className={`bg-white dark:bg-slate-900 border-r border-[#E2E8F0] dark:border-slate-800 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } h-screen sticky top-0`}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0F172A] dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-none tracking-tight">Sheets Sync</h1>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1 block">Sincronizador ATS</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 bg-[#0F172A] dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:block hidden ml-2 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all text-left ${
                isActive 
                  ? 'bg-slate-100 dark:bg-slate-850 text-slate-900 dark:text-white border-r-[3px] border-slate-900 dark:border-white font-semibold' 
                  : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] hover:bg-slate-50 dark:hover:bg-slate-800/65 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-slate-900 dark:text-white' : 'text-[#64748B] dark:text-slate-500'}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Quick Role Tester Switcher (Excellent UI highlight for sandbox testing) */}
      {!collapsed && currentUser && (
        <div className="mx-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-800 mb-2">
          <div className="flex items-center gap-1.5 text-xxs font-bold uppercase tracking-wider text-slate-405 dark:text-slate-400 mb-1.5">
            <UserCheck className="w-3 h-3 text-slate-600 dark:text-slate-405" />
            <span>Simulador de Perfil</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => onChangeRole(r)}
                className={`text-xxxxs py-1 px-1.5 rounded border transition-all text-center leading-tight truncate ${
                  currentUser.role === r
                    ? 'bg-[#0F172A] dark:bg-slate-200 border-[#0F172A] dark:border-slate-200 text-white dark:text-slate-900 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
                title={`Mudar permissão para ${r}`}
              >
                {r === 'Administrador' ? 'Admin' : r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* System Theme Toggles & Account Profile */}
      <div className="p-3 border-t border-slate-150 dark:border-slate-800 mt-auto space-y-2">
        {/* Color controller toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-850 transition-all"
        >
          {dark ? (
            <>
              <Sun className="w-5 h-5 text-amber-500 flex-shrink-0" />
              {!collapsed && <span>Tema Claro</span>}
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-slate-500 flex-shrink-0" />
              {!collapsed && <span>Tema Escuro</span>}
            </>
          )}
        </button>

        {/* User Account summary info */}
        {currentUser && (
          <div className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-lg transition-all overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{currentUser.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <p className="text-xxxxs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-450 truncate">{currentUser.role}</p>
                </div>
              </div>
            )}
            {!collapsed && (
              <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
