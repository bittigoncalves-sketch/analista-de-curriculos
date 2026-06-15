import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  initDb, 
  getCandidates, 
  getCandidateById, 
  saveCandidate, 
  deleteCandidate, 
  getHrNotes, 
  addHrNote, 
  getAuditLogs, 
  getSheetConfig, 
  saveSheetConfig, 
  getSyncLogs,
  addSyncLog
} from "./server/db.js";
import { parseResumeWithGemini } from "./server/gemini.js";
import { syncFromGoogleSheets, logSheetsWriteTransaction } from "./server/sheets.js";
import { Candidate, SheetConfig, UserRole, User } from "./src/types.js";

// Load env variables
dotenv.config();

// Initialize Local database
initDb();

const app = express();
const PORT = 3000;

// Setup Middlewares for parsing payloads (with generous limit for base64 resumes)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Preset accounts details for simple demonstration logins
const PRESET_USERS = [
  { email: 'admin@sheetssync.com.br', pass: 'admin', role: 'Administrador', name: 'Admin Sheets Sync' },
  { email: 'mariana.rh@sheetssync.com.br', pass: 'rh', role: 'RH', name: 'Mariana Silva (Recrutora)' },
  { email: 'carlos.direcao@sheetssync.com.br', pass: 'carlos', role: 'Visualizador', name: 'Carlos Santos (Diretor)' }
];

// Helper to authenticate session/role permissions
function getRequestUser(req: express.Request): { name: string; email: string; role: UserRole } {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default to Admin in mock sandbox for easier initial developer testing if header omitted, 
    // but in interface we'll pass active role header
    return { name: 'Admin Sheets Sync', email: 'admin@sheetssync.com.br', role: 'Administrador' };
  }
  
  const token = authHeader.replace("Bearer ", "");
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64").toString());
    return { name: parsed.name, email: parsed.email, role: parsed.role as UserRole };
  } catch (err) {
    return { name: 'Visualizador Anonimo', email: 'anonimo@sheetssync.com.br', role: 'Visualizador' };
  }
}

// Custom permission guards
function guardRole(requiredRoles: UserRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = getRequestUser(req);
    if (requiredRoles.includes(user.role)) {
      next();
    } else {
      res.status(403).json({ 
        error: "Permissão Negada", 
        message: `Sua conta como "${user.role}" não possui permissão para realizar esta operação. Requer: ${requiredRoles.join(" ou ")}` 
      });
    }
  };
}

// ================= API ENDPOINTS =================

// Auth login endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  const matched = PRESET_USERS.find(u => u.email === email && u.pass === password);
  
  if (matched) {
    // Generate a simple base64-encoded session payload as mock JWT
    const tokenPayload = { id: Math.random().toString(), name: matched.name, email: matched.email, role: matched.role };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
    
    res.json({
      token,
      user: {
        name: matched.name,
        email: matched.email,
        role: matched.role
      }
    });
  } else {
    res.status(401).json({ error: "Credenciais inválidas. Use 'admin@sheetssync.com.br' e senha 'admin' para acesso total." });
  }
});

// Simple password recovery emulator
app.post("/api/auth/recover", (req, res) => {
  const { email } = req.body;
  const user = PRESET_USERS.find(u => u.email === email);
  if (user) {
    res.json({ message: `Instruções enviadas para ${email}. Sua senha atual é "${user.pass}"` });
  } else {
    res.status(404).json({ error: "E-mail não encontrado no sistema corporativo." });
  }
});

// GET currently logged user context
app.get("/api/auth/me", (req, res) => {
  const user = getRequestUser(req);
  res.json({ user });
});

// GET all candidates with query filter logic
app.get("/api/candidates", (req, res) => {
  const list = getCandidates();
  res.json({ candidates: list });
});

// POST save manual candidate
app.post("/api/candidates", guardRole(['Administrador', 'RH']), (req, res) => {
  const user = getRequestUser(req);
  const candidateData: Candidate = req.body;
  
  if (!candidateData.name || !candidateData.email) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  // Assign numeric standard ID if missing
  if (!candidateData.id) {
    candidateData.id = 'c_' + Math.random().toString(36).substr(2, 9);
  }
  if (!candidateData.registrationDate) {
    candidateData.registrationDate = new Date().toISOString();
  }

  const saved = saveCandidate(candidateData, user.name);
  
  // Log update structure to connected spreadsheets simulated console
  logSheetsWriteTransaction(saved, 'insert');

  res.status(201).json({ candidate: saved });
});

// PUT update candidate
app.put("/api/candidates/:id", guardRole(['Administrador', 'RH']), (req, res) => {
  const user = getRequestUser(req);
  const { id } = req.params;
  const original = getCandidateById(id);
  
  if (!original) {
    return res.status(404).json({ error: "Candidato não encontrado" });
  }

  const updatedCandidate: Candidate = { ...original, ...req.body, id };
  const saved = saveCandidate(updatedCandidate, user.name);

  // Sheets update logger
  logSheetsWriteTransaction(saved, 'update');

  res.json({ candidate: saved });
});

// PATCH partially update candidate status
app.patch("/api/candidates/:id/status", guardRole(['Administrador', 'RH']), (req, res) => {
  const user = getRequestUser(req);
  const { id } = req.params;
  const { status } = req.body;
  
  const original = getCandidateById(id);
  if (!original) {
    return res.status(404).json({ error: "Candidato não encontrado" });
  }

  const updatedCandidate: Candidate = { ...original, status };
  const saved = saveCandidate(updatedCandidate, user.name);

  // Log Sheets Sync Update
  logSheetsWriteTransaction(saved, 'update');

  res.json({ candidate: saved, audit: getAuditLogs(id) });
});

// DELETE delete candidate
app.delete("/api/candidates/:id", guardRole(['Administrador']), (req, res) => {
  const { id } = req.params;
  
  const success = deleteCandidate(id);
  if (success) {
    res.json({ success: true, message: "Candidato excluído permanentemente do servidor e cache físico." });
  } else {
    res.status(404).json({ error: "Candidato não cadastrado" });
  }
});

// GET candidate Notes
app.get("/api/candidates/:id/notes", (req, res) => {
  const { id } = req.params;
  res.json({ notes: getHrNotes(id) });
});

// POST save candidate comment note
app.post("/api/candidates/:id/notes", guardRole(['Administrador', 'RH']), (req, res) => {
  const user = getRequestUser(req);
  const { id } = req.params;
  const { comment, rating } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "Comentário não pode estar vazio" });
  }

  const newNote = addHrNote({
    candidateId: id,
    comment,
    author: user.name,
    rating: rating || 0
  });

  res.status(201).json({ note: newNote, audit: getAuditLogs(id) });
});

// GET audit logs for candidates history Timeline
app.get("/api/candidates/:id/audit", (req, res) => {
  const { id } = req.params;
  res.json({ auditLogs: getAuditLogs(id) });
});

// GET current spreadsheet config
app.get("/api/sheets/config", (req, res) => {
  res.json({ config: getSheetConfig() });
});

// POST save spreadsheet config
app.post("/api/sheets/config", guardRole(['Administrador']), (req, res) => {
  const newConfig: SheetConfig = req.body;
  const saved = saveSheetConfig(newConfig);
  res.json({ config: saved });
});

// GET sync logs
app.get("/api/sheets/logs", (req, res) => {
  res.json({ logs: getSyncLogs() });
});

// POST trigger Sheets sync operations
app.post("/api/sheets/sync", guardRole(['Administrador', 'RH']), async (req, res) => {
  const result = await syncFromGoogleSheets();
  if (result.success) {
    res.json({ 
      success: true, 
      message: result.message, 
      config: getSheetConfig(),
      candidates: getCandidates()
    });
  } else {
    res.status(500).json({ 
      success: false, 
      message: result.message,
      config: getSheetConfig()
    });
  }
});

// POST automated resume parser using server-side Gemini 3.5 Flash
app.post("/api/resume/parse", guardRole(['Administrador', 'RH']), async (req, res) => {
  const { base64Data, mimeType, fileName } = req.body;

  if (!base64Data) {
    return res.status(400).json({ error: "Dados base64 do arquivo ausentes no corpo da requisição." });
  }

  try {
    const extractedFields = await parseResumeWithGemini(
      base64Data, 
      mimeType || "application/pdf", 
      fileName || "cv_upload.pdf"
    );

    res.json({ success: true, data: extractedFields });
  } catch (error: any) {
    console.error("Critical Gemini processing error:", error);
    res.status(200).json({ 
      success: false, 
      error: error.message || error,
      message: "Falha na extração de IA. Utilizando analisador de contingência." 
    });
  }
});

// ================= VITE OR STATIC SERVING =================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sheets Sync sever running continuously on http://0.0.0.0:${PORT}`);
  });
}

startServer();
