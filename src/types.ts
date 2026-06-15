export type CandidateStatus = 'Novo' | 'Em análise' | 'Entrevista' | 'Aprovado' | 'Reprovado' | 'Contratado';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  education: string;
  experience: string;
  skills: string[];
  desiredPosition: string;
  registrationDate: string;
  status: CandidateStatus;
  observations?: string;
  starred?: boolean;
}

export interface HRNote {
  id: string;
  candidateId: string;
  comment: string;
  timestamp: string; // ISO String
  author: string;
  rating?: number; // 1 to 5 stars
}

export interface AuditLog {
  id: string;
  candidateId: string;
  action: string;
  timestamp: string; // ISO String
  user: string;
}

export interface SheetConfig {
  url: string;
  spreadsheetId: string;
  apiKey: string;
  autoSyncInterval: number; // in minutes (0 means disabled, default values: 5, 15, 30, 60)
  lastSyncTime: string | null;
  syncedRecordsCount: number;
}

export type UserRole = 'Administrador' | 'RH' | 'Visualizador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'import' | 'export' | 'connection';
  status: 'success' | 'warning' | 'error';
  message: string;
  recordsCount?: number;
}
