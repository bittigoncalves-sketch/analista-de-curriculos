import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Calendar, 
  Star, 
  MessageSquare, 
  Send,
  Trash,
  Edit,
  History,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { Candidate, HRNote, AuditLog, UserRole } from '../types.js';

interface CandidateDrawerProps {
  candidate: Candidate | null;
  onClose: () => void;
  onEdit: (candidate: Candidate) => void;
  onDelete: (id: string) => Promise<void>;
  userRole: UserRole;
  currentUsername: string;
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void;
  onToggleStarred: (candidate: Candidate) => Promise<void>;
}

export default function CandidateDrawer({
  candidate,
  onClose,
  onEdit,
  onDelete,
  userRole,
  currentUsername,
  showToast,
  onToggleStarred
}: CandidateDrawerProps) {
  
  const [notes, setNotes] = useState<HRNote[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'timeline'>('profile');

  // Load comments and history whenever candidate changes
  useEffect(() => {
    if (candidate) {
      fetchNotesAndAudit();
    }
  }, [candidate]);

  const fetchNotesAndAudit = async () => {
    if (!candidate) return;
    try {
      const [notesRes, auditRes] = await Promise.all([
        fetch(`/api/candidates/${candidate.id}/notes`),
        fetch(`/api/candidates/${candidate.id}/audit`)
      ]);
      
      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.notes || []);
      }
      
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Failed to load candidate additions:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !newComment.trim()) return;

    if (userRole === 'Visualizador') {
      showToast('Visualizadores não possuem permissão para adicionar comentários.', 'warn');
      return;
    }

    setLoading(true);
    try {
      const token = btoa(JSON.stringify({ name: currentUsername, role: userRole, email: '' }));
      const response = await fetch(`/api/candidates/${candidate.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment, rating })
      });

      if (response.ok) {
        const data = await response.json();
        setNotes([data.note, ...notes]);
        if (data.audit) {
          setAuditLogs(data.audit);
        }
        setNewComment('');
        setRating(5);
        showToast('Observação adicionada com sucesso!', 'success');
      } else {
        const err = await response.json();
        showToast(err.message || 'Erro ao adicionar o comentário.', 'error');
      }
    } catch (err) {
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!candidate) return;
    if (userRole !== 'Administrador') {
      showToast('Apenas administradores podem excluir candidatos do sistema.', 'warn');
      return;
    }

    if (window.confirm(`Tem certeza de que deseja excluir permanentemente o candidato "${candidate.name}" do Sheets Sync? Esta operação não pode ser desfeita.`)) {
      await onDelete(candidate.id);
    }
  };

  if (!candidate) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity no-print"
        onClick={onClose}
      />

      {/* Drawer layout container */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] md:w-[620px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col h-full transition-transform duration-300 overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 no-print">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onToggleStarred(candidate)}
              className="text-slate-400 hover:text-amber-500 transition-colors"
              title={candidate.starred ? "Não estelar" : "Destacar Candidato"}
            >
              <Star className={`w-5 h-5 ${candidate.starred ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Currículo Detalhado</span>
          </div>

          <div className="flex items-center gap-1.5 font-sans whitespace-nowrap">
            {/* Quick Actions if Admin/HR */}
            {userRole !== 'Visualizador' && (
              <button
                onClick={() => onEdit(candidate)}
                className="text-slate-550 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Editar Currículo"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {userRole === 'Administrador' && (
              <button
                onClick={handleDeleteCandidate}
                className="text-slate-550 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Excluir Candidato"
              >
                <Trash className="w-4 h-4" />
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-800 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content splits */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Candidate overview banner card */}
          <div className="p-6 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/50 dark:to-transparent border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0F172A] dark:bg-slate-150 text-white dark:text-slate-950 font-bold flex items-center justify-center text-lg shadow-sm">
                {candidate.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{candidate.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-wide truncate">{candidate.desiredPosition}</p>
                
                <div className="flex flex-wrap gap-2.5 mt-2">
                  <span className={`text-xxxxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    candidate.status === 'Novo' ? 'bg-slate-100 text-slate-800 border border-slate-205 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700' :
                    candidate.status === 'Em análise' ? 'bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-705' :
                    candidate.status === 'Entrevista' ? 'bg-slate-205 text-slate-900 border border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600' :
                    candidate.status === 'Aprovado' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' :
                    candidate.status === 'Reprovado' ? 'bg-slate-50 text-slate-400 border border-slate-150 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800' :
                    'bg-slate-955 text-white dark:bg-white dark:text-slate-950 px-2.5'
                  }`}>
                    {candidate.status}
                  </span>
                  
                  <span className="text-xxxxs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                    <Calendar className="w-3" /> {new Date(candidate.registrationDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation/Toggle tabs */}
          <div className="border-b border-slate-150 dark:border-slate-800 flex px-6 no-print">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-1 border-b-2 font-bold text-xs mr-6 transition-all ${
                activeTab === 'profile' 
                  ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Perfil do Currículo
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-1 border-b-2 font-bold text-xs transition-all ${
                activeTab === 'timeline'
                  ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Histórico & Comentários ({notes.length + auditLogs.length})
            </button>
          </div>

          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              
              {/* Contact Grid details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xxxxs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">E-mail</p>
                    <a href={`mailto:${candidate.email}`} className="text-xxs font-medium text-slate-700 dark:text-slate-200 block truncate hover:underline">{candidate.email}</a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xxxxs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Telefone</p>
                    <span className="text-xxs font-medium text-slate-705 dark:text-slate-205 font-mono">{candidate.phone || 'Sem telefone'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 col-span-1 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xxxxs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Origem geográfica</p>
                    <span className="text-xxs font-medium text-slate-700 dark:text-slate-250 font-sans">{candidate.city} - {candidate.state}</span>
                  </div>
                </div>
              </div>

              {/* Education section */}
              <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-850 rounded-xl">
                <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Formação Acadêmica
                </h4>
                <p className="text-xs font-semibold text-slate-805 dark:text-slate-200">{candidate.education || 'Nenhuma qualificação acadêmica especificada.'}</p>
              </div>

              {/* Skills tags list */}
              <div className="space-y-2">
                <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Habilidades Técnicas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map((skill, index) => (
                      <span 
                        key={index} 
                        className="px-2.5 py-1 text-xxxxs font-bold bg-slate-100 text-slate-850 dark:bg-slate-800 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xxs text-slate-400 dark:text-slate-550">Nenhuma habilidade chaves listada.</span>
                  )}
                </div>
              </div>

              {/* Experience summary text */}
              <div className="space-y-2">
                <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Experiência Profissional
                </h4>
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-705 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-white dark:bg-slate-900 shadow-slate-100/5 shadow-inner">
                  {candidate.experience || 'Currículo sem descritores de experiências anteriores.'}
                </div>
              </div>

              {/* Observations context details */}
              {candidate.observations && (
                <div className="space-y-2">
                  <h4 className="text-xxs font-bold text-slate-405 uppercase tracking-wide">Observações do Currículo</h4>
                  <p className="text-xxs text-slate-500 italic leading-relaxed">{candidate.observations}</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Comments notes logs, rating and history audit timeline combined */}
          {activeTab === 'timeline' && (
            <div className="p-6 space-y-6">
              
              {/* Comment submission form (Authorized users only) */}
              {userRole !== 'Visualizador' && (
                <form onSubmit={handleAddComment} className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-3 no-print">
                  <div className="flex items-center justify-between">
                    <label className="text-xxxxs font-bold text-slate-450 uppercase tracking-wider block">Adicionar Nota de RH</label>
                    
                    {/* Star Rating selector */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-slate-300 hover:text-amber-500"
                        >
                          <Star className={`w-3.5 h-3.5 ${star <= rating ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      placeholder="Adicionar comentários sobre comportamento, fit cultural, perfil técnico..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                      rows={2}
                      className="flex-1 p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-xl text-xs focus:outline-none focus:border-slate-400 resize-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={loading || !newComment.trim()}
                      className="p-3 bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center self-end cursor-pointer dark:bg-slate-100 dark:text-slate-900"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* Feed: Alternates Comments and Audit timeline logs */}
              <div className="space-y-6">
                
                {/* Notes Feed section */}
                <div className="space-y-4">
                  <h4 className="text-xxs font-bold text-slate-405 uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-600 dark:text-slate-450" /> Notas de Avaliação do RH ({notes.length})
                  </h4>
                  {notes.length === 0 ? (
                    <p className="text-xxxs text-slate-400 italic py-2 pl-1 bg-slate-50/50 dark:bg-slate-800/10 rounded">Nenhum feedback registrado.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {notes.map((note) => (
                        <div key={note.id} className="p-3.5 bg-slate-50/40 dark:bg-slate-850/40 rounded-2xl border border-slate-150 dark:border-slate-800 relative">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate pr-4">{note.author}</span>
                            
                            {/* Stars badge display */}
                            <div className="flex gap-0.5 flex-shrink-0">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 ${i < (note.rating || 0) ? 'fill-amber-400 text-amber-500' : 'text-slate-200 dark:text-slate-750'}`} 
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-xxs leading-normal text-slate-650 dark:text-slate-300 font-sans whitespace-pre-wrap">{note.comment}</p>
                          
                          <div className="flex items-center gap-1.5 mt-2 text-xxxxs text-slate-400 font-mono">
                            <Clock className="w-3" />
                            <span>{new Date(note.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auditlogs section */}
                <div className="space-y-4 pt-1">
                  <h4 className="text-xxs font-bold text-slate-405 uppercase tracking-widest flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-slate-600 dark:text-slate-455" /> Registro de Atividades ({auditLogs.length})
                  </h4>

                  <div className="border-l border-slate-100 dark:border-slate-800 ml-2.5 pl-4 space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="relative">
                        <span className="absolute -left-6.5 top-0.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900" />
                        <p className="text-xxxxs text-slate-400 font-mono uppercase tracking-wider">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        <p className="text-xxs font-medium text-slate-700 dark:text-slate-300 mt-1 leading-tight">{log.action}</p>
                        <p className="text-xxxxs text-slate-450 dark:text-slate-500 mt-0.5">Operador: <strong className="font-semibold text-slate-750">{log.user}</strong></p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
