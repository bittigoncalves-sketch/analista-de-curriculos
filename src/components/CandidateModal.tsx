import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  HelpCircle, 
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Candidate, CandidateStatus } from '../types.js';

interface CandidateModalProps {
  candidate: Candidate | null; // Selected candidate if editing, null if creating
  onClose: () => void;
  onSave: (candidate: Candidate) => Promise<void>;
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void;
}

export default function CandidateModal({
  candidate,
  onClose,
  onSave,
  showToast
}: CandidateModalProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form fields states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [desiredPosition, setDesiredPosition] = useState('');
  const [observations, setObservations] = useState('');
  const [status, setStatus] = useState<CandidateStatus>('Novo');
  const [starred, setStarred] = useState(false);

  // File Upload states
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedConfidence, setParsedConfidence] = useState(false);

  // If candidate is supplied, we populate editable details
  useEffect(() => {
    if (candidate) {
      setName(candidate.name || '');
      setEmail(candidate.email || '');
      setPhone(candidate.phone || '');
      setCity(candidate.city || '');
      setState(candidate.state || 'SP');
      setEducation(candidate.education || '');
      setExperience(candidate.experience || '');
      setSkills(candidate.skills ? candidate.skills.join(', ') : '');
      setDesiredPosition(candidate.desiredPosition || '');
      setObservations(candidate.observations || '');
      setStatus(candidate.status || 'Novo');
      setStarred(candidate.starred || false);
    } else {
      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setCity('');
      setState('SP');
      setEducation('');
      setExperience('');
      setSkills('');
      setDesiredPosition('');
      setObservations('');
      setStatus('Novo');
      setStarred(false);
    }
    setParsedConfidence(false);
  }, [candidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Nome e E-mail são obrigatórios!', 'warn');
      return;
    }

    const savedCandidate: Candidate = {
      id: candidate ? candidate.id : '', // server generates uuid if empty
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      state: state.toUpperCase().trim(),
      education: education.trim(),
      experience: experience.trim(),
      skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      desiredPosition: desiredPosition.trim(),
      observations: observations.trim(),
      status,
      registrationDate: candidate ? candidate.registrationDate : new Date().toISOString(),
      starred
    };

    setUploading(true);
    try {
      await onSave(savedCandidate);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Falha ao salvar candidato.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Convert files to base64 encoding helper
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Trim standard base64 signature header e.g: "data:application/pdf;base64,"
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handle uploaded CV files
  const processUploadedResumeFile = async (file: File) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && extension !== 'docx' && extension !== 'doc' && extension !== 'pdf') {
      showToast('Formato de arquivo não suportado. Por favor insira um PDF ou DOCX.', 'warn');
      return;
    }

    setUploading(true);
    try {
      showToast('IA Gemini processando currículo. Extraindo dados...', 'success');
      const base64Data = await getBase64(file);
      
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType: file.type || 'application/pdf',
          fileName: file.name
        })
      });

      if (response.ok) {
        const bodyObj = await response.json();
        if (bodyObj.success && bodyObj.data) {
          const extracted = bodyObj.data;
          
          // Autofill form
          if (extracted.name) setName(extracted.name);
          if (extracted.email) setEmail(extracted.email);
          if (extracted.phone) setPhone(extracted.phone);
          if (extracted.city) setCity(extracted.city);
          if (extracted.state) setState(extracted.state);
          if (extracted.education) setEducation(extracted.education);
          if (extracted.experience) setExperience(extracted.experience);
          if (extracted.skills) setSkills(Array.isArray(extracted.skills) ? extracted.skills.join(', ') : extracted.skills);
          if (extracted.desiredPosition) setDesiredPosition(extracted.desiredPosition);
          if (extracted.observations) setObservations(extracted.observations);
          
          setParsedConfidence(true);
          showToast('Campos extraídos com IA carregados com sucesso! Revise e salve.', 'success');
        } else {
          showToast(bodyObj.error || 'Não foi possível ler as informações estruturadas. Fornecendo formulário manual.', 'warn');
        }
      } else {
        showToast('Falha no enfileiramento do processador de currículos.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ocorreu um erro ao extrair candidatos.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedResumeFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/45 dark:bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        
        {/* Modal card content wrapper */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                {candidate ? 'Editar Perfil Candidato' : 'Cadastrar Novo Candidato'}
              </h3>
              <p className="text-xxs text-slate-400 mt-0.5">Preencha de forma manual ou faça upload para preenchimento com IA.</p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Drag & Drop File Parser Container */}
            {!candidate && (
              <div 
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                  dragActive 
                    ? 'border-slate-900 bg-slate-50 dark:bg-slate-850' 
                    : parsedConfidence
                    ? 'border-slate-500 bg-slate-50 dark:bg-slate-850'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-350'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <div className="space-y-2 py-4 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-slate-850 dark:text-slate-250 animate-spin" />
                    <p className="text-xs font-bold text-slate-805 dark:text-slate-100 flex items-center gap-1 justify-center">
                      <Sparkles className="w-4 h-4 text-slate-600 animate-pulse" />
                      Extraindo informações com Inteligência Artificial...
                    </p>
                    <p className="text-xxxxs text-slate-400 font-medium uppercase tracking-widest">Processando via Gemini 3.5 Flash</p>
                  </div>
                ) : parsedConfidence ? (
                  <div className="space-y-1.5 py-2">
                    <div className="w-8 h-8 bg-slate-105 dark:bg-slate-800 text-slate-805 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Sucesso! Formulário pré-preenchido.</p>
                    <p className="text-xxs text-slate-400">Verifique e edite os dados extraídos abaixo antes de salvar.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-850 text-slate-450 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-slate-900 dark:text-slate-200 hover:underline cursor-pointer"
                      >
                        Carregar currículo PDF ou DOCX
                      </button>
                      <span className="text-xs text-slate-450 dark:text-slate-500 font-medium"> ou arraste e solte o arquivo aqui</span>
                    </div>
                    <p className="text-xxs text-slate-400 dark:text-slate-500">
                      O sistema usará a **API Gemini** para preencher automaticamente todos os campos do currículo do candidato.
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Form details */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full name input */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roberta Martins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">E-mail de Contato *</label>
                  <input
                    type="email"
                    required
                    placeholder="roberta@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Telefone</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: Curitiba"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350"
                  />
                </div>

                {/* State/UF */}
                <div>
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Estado / UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Ex: PR"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350"
                  />
                </div>

                {/* Target desired position */}
                <div>
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Cargo Desejado</label>
                  <input
                    type="text"
                    placeholder="Ex: Desenvolvedora React Sênior"
                    value={desiredPosition}
                    onChange={(e) => setDesiredPosition(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350"
                  />
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Status Processo</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CandidateStatus)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 transition-all"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Entrevista">Entrevista</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Reprovado">Reprovado</option>
                    <option value="Contratado">Contratado</option>
                  </select>
                </div>
                {/* Skills/Habilidades */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Habilidades (Separadas por vírgula)</label>
                  <input
                    type="text"
                    placeholder="React, CSS, Node, Kanban, Sourcing..."
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350"
                  />
                </div>

                {/* Academic qualification */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Formação Acadêmica</label>
                  <textarea
                    placeholder="Ex: Mestrado em IHC - Unicamp, Especialização Scrum..."
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    rows={1}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350 resize-none"
                  />
                </div>

                {/* Work summary / experience text */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Experiência Profissional</label>
                  <textarea
                    placeholder="Resumo cronológico de passagens anteriores chaves..."
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350 font-sans"
                  />
                </div>

                {/* Short notes/observations */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xxxxs font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Observações Adicionais</label>
                  <input
                    type="text"
                    placeholder="Comentários rápidos relevantes..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder-slate-350"
                  />
                </div>

                {/* Starred highlight toggle switch */}
                <div className="col-span-1 sm:col-span-2 flex items-center gap-2 p-1 pt-2">
                  <input
                    type="checkbox"
                    id="starred_chk"
                    checked={starred}
                    onChange={(e) => setStarred(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 border-slate-300 rounded focus:ring-slate-400 cursor-pointer"
                  />
                  <label htmlFor="starred_chk" className="text-xxs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                    Destacar candidato no Painel Geral (Destaque principal)
                  </label>
                </div>

              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xxs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-[#0F172A] hover:bg-[#1E293B] disabled:bg-slate-300 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xxs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Candidato</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      </div>
    </>
  );
}
