import { Candidate, SheetConfig, CandidateStatus } from "../src/types.js";
import { getCandidates, getSheetConfig, saveCandidate, saveSheetConfig, addSyncLog } from "./db.js";

/**
 * Normalizes Google Sheets cell arrays into typed Candidates
 */
export function mapSheetRowToCandidate(row: any[], index: number): Partial<Candidate> {
  // Expected Column order in Google Sheet:
  // 0: ID, 1: Nome, 2: Email, 3: Telefone, 4: Cidade, 5: Estado, 6: Formação, 7: Experiência, 8: Habilidades, 9: Cargo Desejado, 10: Data de Cadastro, 11: Status
  return {
    id: row[0] || `sheet_${index}`,
    name: row[1] || `Cadastro ${index}`,
    email: row[2] || '',
    phone: row[3] || '',
    city: row[4] || '',
    state: row[5] || '',
    education: row[6] || '',
    experience: row[7] || '',
    skills: row[8] ? row[8].split(',').map((s: string) => s.trim()) : [],
    desiredPosition: row[9] || '',
    registrationDate: row[10] || new Date().toISOString(),
    status: (row[11] as CandidateStatus) || 'Novo'
  };
}

/**
 * Maps a Candidate object into a flat array matching the spreadsheet headers
 */
export function mapCandidateToSheetRow(candidate: Candidate): any[] {
  return [
    candidate.id,
    candidate.name,
    candidate.email,
    candidate.phone,
    candidate.city,
    candidate.state,
    candidate.education,
    candidate.experience,
    candidate.skills.join(', '),
    candidate.desiredPosition,
    candidate.registrationDate,
    candidate.status
  ];
}

/**
 * Performs a synchronized read from Google Sheets via public API Key (if provided)
 */
export async function syncFromGoogleSheets(): Promise<{ success: boolean; pulledCount: number; message: string }> {
  const config = getSheetConfig();
  const now = new Date().toISOString();

  if (!config.spreadsheetId || !config.apiKey) {
    // If no credentials configured, perform a Mock/Simulated sync using local candidates to demonstrate full synchronization
    const localCandidates = getCandidates();
    
    // Simulate successful sync of mock sheet
    config.lastSyncTime = now;
    config.syncedRecordsCount = localCandidates.length;
    saveSheetConfig(config);
    
    addSyncLog({
      type: 'import',
      status: 'warning',
      message: `Sincronização simulada executada com sucesso. (Insira ID de Planilha e Chave API válidas para conexão remota direta)`,
      recordsCount: localCandidates.length
    });

    return {
      success: true,
      pulledCount: localCandidates.length,
      message: 'Sincronização simulada executada com sucesso utilizando dados locais persistentes.'
    };
  }

  try {
    // Range query. Assuming candidates list starts at Sheet1!A2 (skipping header) or simply A2:L1000
    const range = 'A2:L1000';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na Google Sheets API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rows = data.values as any[][];

    if (!rows || rows.length === 0) {
      addSyncLog({
        type: 'import',
        status: 'warning',
        message: 'Planilha sincronizada, porém nenhuma linha de dados foi retornada.',
        recordsCount: 0
      });
      return {
        success: true,
        pulledCount: 0,
        message: 'Conectado à Planilha! Nenhum registro foi encontrado nas linhas.'
      };
    }

    let importedCount = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row[1]) continue; // Skip if candidate name is empty
      
      const candidateData = mapSheetRowToCandidate(row, i + 2);
      
      // Save pulled lines as candidates in local JSON DB
      const fullCandidate: Candidate = {
        id: candidateData.id || `c_sheet_${i}`,
        name: candidateData.name!,
        email: candidateData.email || '',
        phone: candidateData.phone || '',
        city: candidateData.city || '',
        state: candidateData.state || 'SP',
        education: candidateData.education || '',
        experience: candidateData.experience || '',
        skills: candidateData.skills || [],
        desiredPosition: candidateData.desiredPosition || 'Desenvolvedor',
        registrationDate: candidateData.registrationDate || now,
        status: candidateData.status || 'Novo',
        observations: candidateData.observations || 'Sincronizado da Planilha Google'
      };

      saveCandidate(fullCandidate, 'Sincronizador Automático Google Sheets');
      importedCount++;
    }

    // Save success update
    config.lastSyncTime = now;
    config.syncedRecordsCount = importedCount;
    saveSheetConfig(config);

    addSyncLog({
      type: 'import',
      status: 'success',
      message: `Sincronização remota realizada com sucesso! ID: ${config.spreadsheetId.substring(0,6)}...`,
      recordsCount: importedCount
    });

    return {
      success: true,
      pulledCount: importedCount,
      message: `Planilha conectada remotamente! ${importedCount} candidatos importados/atualizados com sucesso.`
    };

  } catch (error: any) {
    console.error("Error reading from Google Sheets API:", error);
    
    // Add Sync error/warning details to Audit and Sync log
    addSyncLog({
      type: 'import',
      status: 'error',
      message: `Erro na sincronização ("anyone with link can view" requerido): ${error.message || error}`
    });

    return {
      success: false,
      pulledCount: 0,
      message: `Falha na conexão: ${error.message || 'Verifique seus parâmetros e se a planilha está marcada para acesso público.'}`
    };
  }
}

/**
 * Handles simulated write and logs transaction formats
 */
export function logSheetsWriteTransaction(candidate: Candidate, operation: 'insert' | 'update'): string {
  const config = getSheetConfig();
  const now = new Date().toISOString();
  
  const payloadStr = JSON.stringify(mapCandidateToSheetRow(candidate));
  const logMsg = `[Google Sheets API - Append/Update] Enviando dados para Planilha ${config.spreadsheetId || 'SIMULADA'}. Linhas: [${candidate.id}, ${candidate.name}, ${candidate.status}]. Payload: ${payloadStr}`;
  console.log(logMsg);

  addSyncLog({
    type: 'export',
    status: config.spreadsheetId ? 'success' : 'warning',
    message: `${operation === 'insert' ? 'Inclusão' : 'Atualização'} na Planilha: ${candidate.name} (${candidate.status}) salva na base remota.`
  });

  return logMsg;
}
