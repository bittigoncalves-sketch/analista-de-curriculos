import fs from 'fs';
import path from 'path';
import { Candidate, HRNote, AuditLog, SheetConfig, User, SyncLog } from '../src/types.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DatabaseSchema {
  candidates: Candidate[];
  hrNotes: HRNote[];
  auditLogs: AuditLog[];
  sheetConfig: SheetConfig;
  users: User[];
  syncLogs: SyncLog[];
}

const DEFAULT_CONFIG: SheetConfig = {
  url: '',
  spreadsheetId: '',
  apiKey: '',
  autoSyncInterval: 15,
  lastSyncTime: null,
  syncedRecordsCount: 0
};

const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'Admin Sheets Sync', email: 'admin@sheetssync.com.br', role: 'Administrador' },
  { id: 'u2', name: 'Mariana Silva (Recrutadora)', email: 'mariana.rh@sheetssync.com.br', role: 'RH' },
  { id: 'u3', name: 'Carlos Santos (Diretor)', email: 'carlos.direcao@sheetssync.com.br', role: 'Visualizador' }
];

const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    name: 'Ana Julia Souza',
    email: 'ana.souza@gmail.com',
    phone: '(11) 98765-4321',
    city: 'São Paulo',
    state: 'SP',
    education: 'Bacharelado em Ciência da Computação - USP',
    experience: 'Desenvolvedora Frontend Pleno na TechSolutions (2 anos), Estágio Frontend na StartUp BR (1 ano). Experiência profunda com React, Tailwind e consumo de APIs REST.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Git', 'CSS3'],
    desiredPosition: 'Desenvolvedor Frontend',
    registrationDate: '2026-05-15T14:32:00.000Z',
    status: 'Aprovado',
    observations: 'Candidata com excelente comunicação, resolveu o desafio técnico de forma elegante utilizando boas práticas.',
    starred: true
  },
  {
    id: 'c2',
    name: 'Bruno Lima Fonseca',
    email: 'bruno.lima@yahoo.com.br',
    phone: '(21) 97112-2334',
    city: 'Rio de Janeiro',
    state: 'RJ',
    education: 'Tecnólogo em Análise e Desenvolvimento de Sistemas - FIAP',
    experience: 'Desenvolvedor Full Stack na InovaLabs (1 ano), Freelancer em desenvolvimento React e Node.js (2 anos). Atuou em projetos de e-commerce e integrações ágeis.',
    skills: ['Node.js', 'Express', 'React', 'MongoDB', 'PostgreSQL', 'Docker'],
    desiredPosition: 'Desenvolvedor Full Stack',
    registrationDate: '2026-06-02T09:12:00.000Z',
    status: 'Em análise',
    observations: 'Demonstrou boa base técnica em Node e React. Precisa avaliar melhor o nível de maturidade em infraestrutura.',
    starred: false
  },
  {
    id: 'c3',
    name: 'Carla Dias Moreira',
    email: 'carla.dias@outlook.com',
    phone: '(31) 99122-8877',
    city: 'Belo Horizonte',
    state: 'MG',
    education: 'Pós-graduação em Gestão de Pessoas - PUC Minas',
    experience: 'Analista de Recrutamento Tech na TalentHunter (3 anos), Analista de RH na Corporativo S/A (2 anos). Experiência sólida em sourcing técnico e dinâmicas de fit cultural.',
    skills: ['Sourcing', 'ATS', 'LinkedIn Recruiter', 'Cultura', 'Soft Skills'],
    desiredPosition: 'Recrutador Técnico (Tech Recruiter)',
    registrationDate: '2026-06-10T11:45:00.000Z',
    status: 'Entrevista',
    observations: 'Entrevista de fit cultural pré-agendada para quinta-feira. Recomendo muito pelo perfil analítico e dinâmico.',
    starred: true
  },
  {
    id: 'c4',
    name: 'Dilson Costa Junior',
    email: 'dilson.costa@tech.expert',
    phone: '(41) 98877-6655',
    city: 'Curitiba',
    state: 'PR',
    education: 'Engenharia de Software - UTFPR',
    experience: 'Líder Técnico de IA na Cognitivo (3 anos), Engenheiro de Dados na BigData Corp (2 anos). Liderou times no desenvolvimento de pipelines de LLM e microsserviços escaláveis.',
    skills: ['Python', 'LangChain', 'Gemini API', 'PyTorch', 'FastAPI', 'SQL'],
    desiredPosition: 'Engenheiro de IA',
    registrationDate: '2026-06-12T16:20:00.000Z',
    status: 'Novo',
    observations: 'Candidato sênior muito disputado no mercado. Gostou bastante da nossa proposta tecnológica.',
    starred: true
  },
  {
    id: 'c5',
    name: 'Estela Maria Mendes',
    email: 'estela.mendes@gmail.com',
    phone: '(51) 99344-5511',
    city: 'Porto Alegre',
    state: 'RS',
    education: 'Design Gráfico / UX - UFRGS',
    experience: 'Product Designer Lead na PayFintech (4 anos), UX Designer Sênior no Banco Digital (2 anos). Criou fluxos e protótipos de alta fidelidade para múltiplos aplicativos financeiros.',
    skills: ['Figma', 'UX Research', 'Design Systems', 'Motion', 'Prototipagem'],
    desiredPosition: 'Product Designer (UX/UI)',
    registrationDate: '2026-06-14T10:05:00.000Z',
    status: 'Novo',
    observations: 'Excelente portfólio no Behance com casos detalhados de fintechs de grande alcance.',
    starred: false
  },
  {
    id: 'c6',
    name: 'Felipe Augusto Rocha',
    email: 'felipe.rocha@hotmail.com',
    phone: '(19) 98111-2345',
    city: 'Campinas',
    state: 'SP',
    education: 'Graduação em Marketing Digital - UNICAMP',
    experience: 'Coordenador de Growth Marketing na FastGrow (2 anos), Analista de SEO na WebSearch S/A (3 anos). Responsável por otimização de conversão e campanhas de tráfego pago de alta performance.',
    skills: ['SEO', 'Google Ads', 'Analytics', 'Conversion Rate', 'SQL', 'Copywriting'],
    desiredPosition: 'Gerente de Growth Marketing',
    registrationDate: '2026-04-10T14:40:00.000Z',
    status: 'Contratado',
    observations: 'Contratação efetuada com sucesso! Iniciou o onboarding em maio e já está obtendo resultados significativos.',
    starred: false
  },
  {
    id: 'c7',
    name: 'Giovanna Nogueira Pires',
    email: 'giovanna.pires@live.com',
    phone: '(81) 97412-3698',
    city: 'Recife',
    state: 'PE',
    education: 'Administração de Empresas - UFPE',
    experience: 'Estagiária de RH na RecTech (6 meses). Domínio intermediário de planilhas e ótima comunicação interpessoal.',
    skills: ['Excel', 'PowerPoint', 'Comunicação', 'Organização de Eventos'],
    desiredPosition: 'Estagiário de RH',
    registrationDate: '2026-06-15T08:15:00.000Z',
    status: 'Reprovado',
    observations: 'Requisitos de formação técnica não se alinham à descrição da vaga atual. Mantida no banco de talentos para oportunidades futuras.',
    starred: false
  }
];

const DEFAULT_NOTES: HRNote[] = [
  {
    id: 'n1',
    candidateId: 'c1',
    comment: 'Candidata excelente na entrevista técnica inicial. Conhece muito bem fundamentos do React. Recomendada para a etapa final.',
    timestamp: '2026-05-18T16:40:00.000Z',
    author: 'Mariana Silva (Recrutadora)',
    rating: 5
  },
  {
    id: 'n2',
    candidateId: 'c1',
    comment: 'Aprovada após conversa com o gerente de engenharia. Proposta enviada e aceita.',
    timestamp: '2026-05-22T10:15:00.000Z',
    author: 'Admin Sheets Sync',
    rating: 5
  },
  {
    id: 'n3',
    candidateId: 'c2',
    comment: 'Entrevista por telefone realizada. Boa fluidez comunicativa, mas precisa de reforço em testes unitários.',
    timestamp: '2026-06-05T14:20:00.000Z',
    author: 'Mariana Silva (Recrutadora)',
    rating: 3
  }
];

const DEFAULT_AUDIT: AuditLog[] = [
  { id: 'a1', candidateId: 'c1', action: 'Currículo cadastrado via sistema.', timestamp: '2026-05-15T14:32:00.000Z', user: 'Ana Julia Souza' },
  { id: 'a2', candidateId: 'c1', action: 'Alterou status para "Em análise"', timestamp: '2026-05-15T15:00:00.000Z', user: 'Mariana Silva (Recrutadora)' },
  { id: 'a3', candidateId: 'c1', action: 'Alterou status de "Em análise" para "Aprovado"', timestamp: '2026-05-22T10:15:00.000Z', user: 'Admin Sheets Sync' },
  { id: 'a4', candidateId: 'c2', action: 'Currículo cadastrado via sistema.', timestamp: '2026-06-02T09:12:00.000Z', user: 'Bruno Lima Fonseca' },
  { id: 'a5', candidateId: 'c2', action: 'Adicionou comentário e alterou status para "Em análise".', timestamp: '2026-06-05T14:20:00.000Z', user: 'Mariana Silva (Recrutadora)' }
];

const DEFAULT_SYNC_LOGS: SyncLog[] = [
  {
    id: 'sl1',
    timestamp: '2026-06-15T04:30:00.000Z',
    type: 'connection',
    status: 'success',
    message: 'Sistema Sheets Sync inicializado. Banco de dados local ativo.',
    recordsCount: 7
  }
];

export function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const defaultData: DatabaseSchema = {
      candidates: DEFAULT_CANDIDATES,
      hrNotes: DEFAULT_NOTES,
      auditLogs: DEFAULT_AUDIT,
      sheetConfig: DEFAULT_CONFIG,
      users: DEFAULT_USERS,
      syncLogs: DEFAULT_SYNC_LOGS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    console.log('Database JSON initialized at', DB_FILE);
  }
}

export function readDb(): DatabaseSchema {
  initDb();
  const rawData = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(rawData) as DatabaseSchema;
}

export function writeDb(data: DatabaseSchema) {
  initDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Candidate operations
export function getCandidates(): Candidate[] {
  const db = readDb();
  return db.candidates;
}

export function getCandidateById(id: string): Candidate | undefined {
  const db = readDb();
  return db.candidates.find(c => c.id === id);
}

export function saveCandidate(candidate: Candidate, author: string): Candidate {
  const db = readDb();
  const existingIndex = db.candidates.findIndex(c => c.id === candidate.id);
  const now = new Date().toISOString();

  let action = '';

  if (existingIndex > -1) {
    const old = db.candidates[existingIndex];
    db.candidates[existingIndex] = { ...candidate };
    
    // Create audit log for changes
    const changes: string[] = [];
    if (old.status !== candidate.status) {
      changes.push(`Alterou status de "${old.status}" para "${candidate.status}"`);
    }
    if (old.name !== candidate.name) changes.push(`Alterou nome`);
    if (old.desiredPosition !== candidate.desiredPosition) changes.push(`Alterou cargo desejado para "${candidate.desiredPosition}"`);
    
    action = changes.length > 0 ? changes.join(', ') : 'Currículo atualizado';
  } else {
    db.candidates.unshift(candidate);
    action = 'Candidato cadastrado manualmente no sistema.';
  }

  // Create audit log
  const newLog: AuditLog = {
    id: 'a_' + Math.random().toString(36).substr(2, 9),
    candidateId: candidate.id,
    action,
    timestamp: now,
    user: author
  };
  db.auditLogs.push(newLog);

  writeDb(db);
  return candidate;
}

export function deleteCandidate(id: string): boolean {
  const db = readDb();
  const initialLength = db.candidates.length;
  db.candidates = db.candidates.filter(c => c.id !== id);
  db.hrNotes = db.hrNotes.filter(n => n.candidateId !== id);
  db.auditLogs = db.auditLogs.filter(a => a.candidateId !== id);
  
  if (db.candidates.length < initialLength) {
    writeDb(db);
    return true;
  }
  return false;
}

// HR Notes operations
export function getHrNotes(candidateId: string): HRNote[] {
  const db = readDb();
  return db.hrNotes
    .filter(n => n.candidateId === candidateId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function addHrNote(note: Omit<HRNote, 'id' | 'timestamp'>): HRNote {
  const db = readDb();
  const newNote: HRNote = {
    ...note,
    id: 'n_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString()
  };
  
  db.hrNotes.push(newNote);
  
  // Auditar comentário
  const newLog: AuditLog = {
    id: 'a_' + Math.random().toString(36).substr(2, 9),
    candidateId: note.candidateId,
    action: `Adicionou observação técnica com avaliação: ${note.rating || 0} estrelas.`,
    timestamp: new Date().toISOString(),
    user: note.author
  };
  db.auditLogs.push(newLog);

  writeDb(db);
  return newNote;
}

// Audit Logs operations
export function getAuditLogs(candidateId: string): AuditLog[] {
  const db = readDb();
  return db.auditLogs
    .filter(a => a.candidateId === candidateId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Sheets operations
export function getSheetConfig(): SheetConfig {
  const db = readDb();
  return db.sheetConfig;
}

export function saveSheetConfig(config: SheetConfig): SheetConfig {
  const db = readDb();
  db.sheetConfig = config;
  
  const now = new Date().toISOString();
  db.syncLogs.push({
    id: 'sl_' + Math.random().toString(36).substr(2, 9),
    timestamp: now,
    type: 'connection',
    status: config.spreadsheetId && config.apiKey ? 'success' : 'warning',
    message: config.spreadsheetId 
      ? `Configurações da planilha atualizadas. ID: ${config.spreadsheetId.substring(0, 8)}...` 
      : 'Configurações de planilha limpas'
  });

  writeDb(db);
  return config;
}

export function getSyncLogs(): SyncLog[] {
  const db = readDb();
  return db.syncLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function addSyncLog(log: Omit<SyncLog, 'id' | 'timestamp'>): SyncLog {
  const db = readDb();
  const newLog: SyncLog = {
    ...log,
    id: 'sl_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString()
  };
  db.syncLogs.push(newLog);
  writeDb(db);
  return newLog;
}
