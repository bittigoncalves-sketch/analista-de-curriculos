import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MapPin, 
  Sparkles,
  MoreVertical,
  Check,
  Briefcase,
  GraduationCap,
  Calendar,
  X,
  FileCheck,
  Printer
} from 'lucide-react';
import { Candidate, CandidateStatus, UserRole } from '../types.js';

interface CandidatesTableProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onUpdateStatus: (id: string, status: CandidateStatus) => Promise<void>;
  onOpenCreateModal: () => void;
  userRole: UserRole;
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void;
}

export default function CandidatesTable({
  candidates,
  onSelectCandidate,
  onUpdateStatus,
  onOpenCreateModal,
  userRole,
  showToast
}: CandidatesTableProps) {
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterEducation, setFilterEducation] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStatus, setFilterStatus] = useState<CandidateStatus | 'Todos'>('Todos');
  const [filterDateMin, setFilterDateMin] = useState('');

  // 1. Get unique filters lists for dropdown options
  const uniqueCities = useMemo(() => Array.from(new Set(candidates.map(c => c.city).filter(Boolean))), [candidates]);
  const uniqueStates = useMemo(() => Array.from(new Set(candidates.map(c => c.state).filter(Boolean))), [candidates]);
  const uniquePositions = useMemo(() => Array.from(new Set(candidates.map(c => c.desiredPosition).filter(Boolean))), [candidates]);

  // Status option lists
  const statusOptions: CandidateStatus[] = ['Novo', 'Em análise', 'Entrevista', 'Aprovado', 'Reprovado', 'Contratado'];

  // 2. Perform Filtering & Global Search matching
  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      // Global Search Match (Nome, Email, Cidade, Formação, Habilidade, Cargo)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' || 
        candidate.name.toLowerCase().includes(query) ||
        candidate.email.toLowerCase().includes(query) ||
        candidate.city.toLowerCase().includes(query) ||
        candidate.education.toLowerCase().includes(query) ||
        candidate.desiredPosition.toLowerCase().includes(query) ||
        candidate.skills.some(skill => skill.toLowerCase().includes(query));

      // Advanced Filters Match
      const matchesCity = filterCity === '' || candidate.city === filterCity;
      const matchesState = filterState === '' || candidate.state === filterState;
      const matchesStatus = filterStatus === 'Todos' || candidate.status === filterStatus;
      const matchesPosition = filterPosition === '' || candidate.desiredPosition === filterPosition;
      
      const matchesEducation = filterEducation === '' || 
        candidate.education.toLowerCase().includes(filterEducation.toLowerCase());
      
      const matchesDate = filterDateMin === '' || 
        new Date(candidate.registrationDate) >= new Date(filterDateMin);

      return matchesSearch && matchesCity && matchesState && matchesStatus && matchesPosition && matchesEducation && matchesDate;
    });
  }, [candidates, searchQuery, filterCity, filterState, filterStatus, filterPosition, filterEducation, filterDateMin]);

  // 3. Clear all filters
  const resetFilters = () => {
    setFilterCity('');
    setFilterState('');
    setFilterEducation('');
    setFilterPosition('');
    setFilterStatus('Todos');
    setFilterDateMin('');
    setSearchQuery('');
  };

  // 4. Export Functions
  const handleExportCSV = (onlyFiltered = false) => {
    const list = onlyFiltered ? filteredCandidates : candidates;
    if (list.length === 0) {
      showToast('Nenhum candidato para exportar.', 'warn');
      return;
    }

    // Header row
    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Cidade', 'Estado', 'Formação', 'Experiência', 'Habilidades', 'Cargo Desejado', 'Data de Cadastro', 'Status'];
    const csvRows = [headers.join(';')];

    // Data rows
    list.forEach(c => {
      const row = [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        c.email,
        c.phone,
        `"${c.city.replace(/"/g, '""')}"`,
        c.state,
        `"${c.education.replace(/"/g, '""')}"`,
        `"${c.experience.replace(/"/g, '""')}"`,
        `"${c.skills.join(', ').replace(/"/g, '""')}"`,
        `"${c.desiredPosition.replace(/"/g, '""')}"`,
        c.registrationDate,
        c.status
      ];
      csvRows.push(row.join(';'));
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cvs_sheets_sync_${onlyFiltered ? 'filtrados' : 'todos'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Arquivo CSV exportado com sucesso!', 'success');
  };

  const handleExportExcel = (onlyFiltered = false) => {
    const list = onlyFiltered ? filteredCandidates : candidates;
    if (list.length === 0) {
      showToast('Nenhum candidato para exportar.', 'warn');
      return;
    }

    // Create realistic HTML Table for Excel parsing (very robust trick for React without large libs)
    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>SheetsSync Curtidatos</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table border="1">
          <tr style="background-color: #2563EB; color: #FFFFFF; font-weight: bold;">
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Cidade</th>
            <th>Estado</th>
            <th>Formação</th>
            <th>Experiência</th>
            <th>Habilidades</th>
            <th>Cargo Desejado</th>
            <th>Data Cadastro</th>
            <th>Status</th>
          </tr>
    `;

    list.forEach(c => {
      excelTemplate += `
        <tr>
          <td>${c.id}</td>
          <td>${c.name}</td>
          <td>${c.email}</td>
          <td>${c.phone}</td>
          <td>${c.city}</td>
          <td>${c.state}</td>
          <td>${c.education}</td>
          <td>${c.experience}</td>
          <td>${c.skills.join(', ')}</td>
          <td>${c.desiredPosition}</td>
          <td>${new Date(c.registrationDate).toLocaleDateString()}</td>
          <td>${c.status}</td>
        </tr>
      `;
    });

    excelTemplate += `</table></body></html>`;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cvs_sheets_excel_${onlyFiltered ? 'filtrados' : 'todos'}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha Excel exportada com sucesso!', 'success');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Search and upper Actions panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-slate-100/10 no-print">
        
        {/* Left: Global Search controller */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email, cidade, formação ou vaga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-850 focus:outline-none focus:border-slate-400 text-sm transition-colors"
          />
        </div>

        {/* Right Action panels */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Advanced toggle filters button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
              showFilters || filterCity || filterStatus !== 'Todos' || filterEducation || filterState || filterPosition
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {(filterCity || filterStatus !== 'Todos' || filterEducation || filterState || filterPosition) && (
              <span className="w-4 h-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center text-xxxxs font-bold">
                !
              </span>
            )}
          </button>

          {/* Export dropdown XML helper */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all">
              <Download className="w-4 h-4 text-slate-505" />
              <span>Exportar</span>
            </button>
            
            {/* Hover Floating dropdown items */}
            <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg ring-1 ring-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-1">
                <button 
                  onClick={() => handleExportCSV(true)} 
                  className="w-full text-left px-3 py-2 text-xxs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  Filtrados para CSV
                </button>
                <button 
                  onClick={() => handleExportCSV(false)} 
                  className="w-full text-left px-3 py-2 text-xxs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  Todos para CSV
                </button>
              </div>
              <div className="p-1">
                <button 
                  onClick={() => handleExportExcel(true)} 
                  className="w-full text-left px-3 py-2 text-xxs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  Filtrados para Excel (.xls)
                </button>
                <button 
                  onClick={() => handleExportExcel(false)}
                  className="w-full text-left px-3 py-2 text-xxs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                  Todos para Excel (.xls)
                </button>
              </div>
              <div className="p-1">
                <button 
                  onClick={handlePrintPDF} 
                  className="w-full text-left px-3 py-2 text-xxs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center justify-between"
                >
                  <span>Gerar Relatório (PDF/Imprimir)</span>
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Create Manual buttons */}
          {userRole !== 'Visualizador' && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] dark:bg-slate-200 dark:hover:bg-slate-100 dark:text-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Candidato</span>
            </button>
          )}

        </div>
      </div>

      {/* Advanced Drawer Filter Panel (Collabsible) */}
      {showFilters && (
        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 no-print">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">Filtros Avançados</h5>
            <button 
              onClick={resetFilters}
              className="text-xxxxs font-bold uppercase tracking-wider text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              Limpar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Filter Status */}
            <div>
              <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1">Status do Processo</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="Todos">Todos</option>
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {/* Filter Cargo/Vaga */}
            <div>
              <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1">Cargo Desejado</label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="">Todos</option>
                {uniquePositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>

            {/* Filter Cidade */}
            <div>
              <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1">Cidade</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="">Todas</option>
                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Filter Formação/Ensino */}
            <div>
              <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1">Termo de Formação</label>
              <input
                type="text"
                placeholder="Ex: USP, Ciência, pós..."
                value={filterEducation}
                onChange={(e) => setFilterEducation(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>
            
          </div>
        </div>
      )}

      {/* Candidates List Counters summary */}
      <div className="flex items-center justify-between px-1 text-slate-500 no-print">
        <span className="text-xxs font-medium">
          Mostrando <strong>{filteredCandidates.length}</strong> de <strong>{candidates.length}</strong> currículos encontrados.
        </span>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm shadow-slate-100/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xxxxs font-extrabold uppercase tracking-widest">Candidato</th>
                <th className="px-6 py-4 text-xxxxs font-extrabold uppercase tracking-widest">Cidade/UF</th>
                <th className="px-6 py-4 text-xxxxs font-extrabold uppercase tracking-widest">Formação</th>
                <th className="px-6 py-4 text-xxxxs font-extrabold uppercase tracking-widest">Cargo Desejado</th>
                <th className="px-6 py-4 text-xxxxs font-extrabold uppercase tracking-widest">Inscrição</th>
                <th className="px-6 py-4 text-xxxxs font-extrabold uppercase tracking-widest">Status do RH</th>
                <th className="px-6 py-4 text-xxxxs font-extrabold uppercase tracking-widest text-right no-print">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
              {filteredCandidates.map((c) => (
                <tr 
                  key={c.id} 
                  className="hover:bg-slate-55 dark:hover:bg-slate-800/20 transition-all transition-colors duration-150"
                >
                  {/* Name and contact details columns */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-805 dark:text-slate-200 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span 
                            onClick={() => onSelectCandidate(c)}
                            className="font-semibold text-xs text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white hover:underline cursor-pointer block leading-none truncate"
                          >
                            {c.name}
                          </span>
                          {c.starred && (
                            <span className="bg-slate-100 text-slate-800 border border-slate-205 dark:bg-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-xxxxs font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                              <Sparkles className="w-2.5 h-2.5 text-slate-500" /> Top
                            </span>
                          )}
                        </div>
                        <p className="text-xxs text-slate-450 dark:text-slate-500 mt-1 truncate">{c.email}</p>
                        <p className="text-xxxxs text-slate-400 font-mono tracking-tighter mt-0.5">{c.phone}</p>
                      </div>
                    </div>
                  </td>

                  {/* Location Column */}
                  <td className="px-6 py-4 text-slate-650 dark:text-slate-350 select-none">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-28">{c.city}, {c.state}</span>
                    </div>
                  </td>

                  {/* Education column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-44" title={c.education}>{c.education}</span>
                    </div>
                  </td>

                  {/* Desired Position column */}
                  <td className="px-6 py-4 font-medium text-xs text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-44">{c.desiredPosition}</span>
                    </div>
                  </td>

                  {/* Date Column */}
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-450">
                    <div className="flex items-center gap-1.5 text-xxs font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(c.registrationDate).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Dynamic coloring processes status selector */}
                  <td className="px-6 py-4">
                    {userRole === 'Visualizador' ? (
                      <span className={`text-xxxxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        c.status === 'Novo' ? 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700' :
                        c.status === 'Em análise' ? 'bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-705' :
                        c.status === 'Entrevista' ? 'bg-slate-205 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600' :
                        c.status === 'Aprovado' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' :
                        c.status === 'Reprovado' ? 'bg-slate-50 text-slate-400 border border-slate-150 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800' :
                        'bg-slate-955 text-white dark:bg-white dark:text-slate-950 px-2.5'
                      }`}>
                        {c.status}
                      </span>
                    ) : (
                      <select
                        value={c.status}
                        onChange={(e) => onUpdateStatus(c.id, e.target.value as CandidateStatus)}
                        className={`text-xxxxs font-bold uppercase tracking-wider px-2 py-1 rounded-lg border-none focus:ring-2 focus:ring-slate-400 cursor-pointer ${
                          c.status === 'Novo' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                          c.status === 'Em análise' ? 'bg-slate-200/55 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200' :
                          c.status === 'Entrevista' ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white' :
                          c.status === 'Aprovado' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' :
                          c.status === 'Reprovado' ? 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500' :
                          'bg-slate-950 text-white dark:bg-white dark:text-slate-950 px-2'
                        }`}
                      >
                        {statusOptions.map(opt => <option className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xxs font-sans font-medium" key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </td>

                  {/* Actions column */}
                  <td className="px-6 py-4 text-right no-print">
                    <button
                      onClick={() => onSelectCandidate(c)}
                      className="text-xxs font-bold text-slate-800 dark:text-slate-200 hover:text-black dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Ver Perfil
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    Nenhum candidato localizado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
