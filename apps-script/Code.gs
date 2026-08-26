const CONFIG = Object.freeze({
  RAW_SHEET: 'Respostas_Brutas',
  DIM_SHEET: 'Dimensoes_por_Escola',
  SEGMENT_SHEET: 'Segmentacao_Cruzada',
  PUBLIC_FORM_URL: 'https://sgurfinkel1-dev.github.io/nexara-site/pesquisa.html',
  REPLY_TO: 'contato@nexaraconsulting.com.br',
});

const RAW_HEADERS = ['timestamp', 'origem', 'user_id', 'completo'].concat(Array.from({ length: 45 }, (_, i) => `P${i + 1}`));
const DIM_HEADERS = [
  'user_id', 'Porte', 'Trajetoria', 'Funcao_Respondente', 'Papeis_0a100', 'Pessoas_0a100',
  'Valores_0a100', 'Relacoes_0a100', 'Estrategia_0a100', 'Execucao_0a100',
  'Governanca_Percepcao_0a100', 'Experiencia_Comunidade_0a100', 'Resultado_0a100', 'Regua_Estrutura_0a100',
];

function doGet() {
  return json_({ ok: true, service: 'Pesquisa Nacional Nexara 2026', version: 'v6' });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    if (!payload || !['survey_save', 'survey_abandon'].includes(payload.action)) throw new Error('Ação inválida.');
    if (!payload.user_id) throw new Error('user_id ausente.');

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      validateWorkbook_(spreadsheet);
      const rawSheet = spreadsheet.getSheetByName(CONFIG.RAW_SHEET);
      const dimSheet = spreadsheet.getSheetByName(CONFIG.DIM_SHEET);
      const previous = findByUserId_(rawSheet, payload.user_id, 3);
      const wasComplete = previous.row ? Boolean(rawSheet.getRange(previous.row, 4).getValue()) : false;
      const rawRow = buildRawRow_(payload);
      const rawRowNumber = upsertRow_(rawSheet, previous.row, rawRow);
      const dimValues = calculateDimensions_(payload.responses || {}, payload.user_id);
      const dimMatch = findByUserId_(dimSheet, payload.user_id, 1);
      const dimRowNumber = upsertRow_(dimSheet, dimMatch.row, dimValues);

      SpreadsheetApp.flush();
      const emailSent = payload.completo && !wasComplete ? sendConfirmationEmails_(payload) : false;
      return json_({ ok: true, user_id: payload.user_id, completo: Boolean(payload.completo), email_sent: emailSent, raw_row: rawRowNumber, dimension_row: dimRowNumber, saved_at: new Date().toISOString() });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function validateWorkbook_(spreadsheet) {
  if (spreadsheet.getSheets().length !== 3) throw new Error('A planilha precisa conter somente as três abas definidas para a pesquisa.');
  const raw = spreadsheet.getSheetByName(CONFIG.RAW_SHEET);
  const dims = spreadsheet.getSheetByName(CONFIG.DIM_SHEET);
  const segments = spreadsheet.getSheetByName(CONFIG.SEGMENT_SHEET);
  if (!raw || !dims || !segments) throw new Error('A planilha precisa conter exatamente as abas Respostas_Brutas, Dimensoes_por_Escola e Segmentacao_Cruzada.');
  validateHeaders_(raw, RAW_HEADERS);
  validateHeaders_(dims, DIM_HEADERS);
}

function validateHeaders_(sheet, expected) {
  const actual = sheet.getRange(1, 1, 1, expected.length).getDisplayValues()[0];
  if (actual.join('|') !== expected.join('|')) throw new Error(`Cabeçalhos incompatíveis na aba ${sheet.getName()}.`);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  return JSON.parse(e.postData.contents);
}

function buildRawRow_(payload) {
  const answers = payload.responses || {};
  const row = [new Date(), String(payload.origem || 'direto'), String(payload.user_id), Boolean(payload.completo)];
  for (let i = 1; i <= 45; i += 1) row.push(rawValue_(answers[`P${i}`]));
  return row;
}

function rawValue_(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return JSON.stringify(value);
  return value;
}

function upsertRow_(sheet, rowNumber, values) {
  const row = rowNumber || Math.max(2, sheet.getLastRow() + 1);
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
  return row;
}

function findByUserId_(sheet, userId, column) {
  if (sheet.getLastRow() < 2) return { row: 0 };
  const found = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).createTextFinder(String(userId)).matchEntireCell(true).findNext();
  return { row: found ? found.getRow() : 0 };
}

function calculateDimensions_(p, userId) {
  const p12 = p.P12 === 'Existe e está em uso' ? 100 : p.P12 === 'Está em construção' ? 50 : p.P12 === 'Não existe' ? 0 : null;
  const p16 = score_(p.P16);
  return [
    userId,
    p.P2 || '',
    p.P4 || '',
    p.P5 || '',
    mean_([p12, p16]),
    likertMean_([p.P17, p.P18, p.P19, p.P20]),
    score_(p.P26),
    reverseScore_(p.P27),
    likertMean_([p.P28, p.P29]),
    reverseScore_(p.P30),
    governanceScore_(p.P31, p.P32),
    likertMean_([p.P21, p.P22, p.P23]),
    likertMean_([p.P24, p.P25]),
    structureScore_(p),
  ];
}

function numeric_(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 && number <= 5 ? number : null;
}

function score_(value) {
  const number = numeric_(value);
  return number === null ? '' : (number - 1) / 4 * 100;
}

function reverseScore_(value) {
  const number = numeric_(value);
  return number === null ? '' : ((6 - number) - 1) / 4 * 100;
}

function mean_(values) {
  const valid = values.filter(value => typeof value === 'number' && Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : '';
}

function likertMean_(values) {
  const valid = values.map(numeric_).filter(value => value !== null);
  return valid.length ? (valid.reduce((sum, value) => sum + value, 0) / valid.length - 1) / 4 * 100 : '';
}

function governanceScore_(p31, p32) {
  const direct = numeric_(p31);
  const reversedSource = numeric_(p32);
  const values = [];
  if (direct !== null) values.push(direct);
  if (reversedSource !== null) values.push(6 - reversedSource);
  return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length - 1) / 4 * 100 : '';
}

function structureScore_(p) {
  let installed = 0;
  for (let i = 8; i <= 15; i += 1) if (p[`P${i}`] === 'Existe e está em uso') installed += 1;
  return installed / 8 * 100;
}

function sendConfirmationEmails_(payload) {
  const p = payload.responses || {};
  if (!p.P40) {
    console.warn('Resposta concluída sem e-mail P40; confirmação não enviada.');
    return false;
  }
  const name = p.P39 || 'participante';
  const school = p.P41 || 'sua escola';
  const shareUrl = `${CONFIG.PUBLIC_FORM_URL}?origem=indicacao_respondente`;
  const confirmation = [
    `Olá, ${name}.`, '',
    'Obrigada por participar da Pesquisa Nacional do Ecossistema Humano Escolar 2026. Sua resposta foi registrada.', '',
    'O estudo compara escolas por porte, trajetória de matrículas, estrutura instalada e posição de quem responde. Quando há mais de uma liderança da mesma escola participando, também é possível observar diferenças de percepção dentro da própria instituição.', '',
    `Se outra pessoa da liderança da ${school} responder, sua escola passa a ter essa comparação disponível na leitura individual. O link é este: ${shareUrl}`, '',
    'Se você indicou que gostaria de receber o relatório antes da publicação aberta, ele será enviado para este e-mail em outubro.', '',
    'Um abraço,', 'Beth Loureiro',
  ].join('\n');
  MailApp.sendEmail({ to: p.P40, subject: 'Sua resposta foi registrada · Pesquisa Nacional do Ecossistema Humano Escolar', body: confirmation, name: 'Equipe Nexara · Nexara Consulting', replyTo: CONFIG.REPLY_TO });

  if (p.P44 === 'Sim, quero agendar a conversa') {
    const conversation = [
      `Olá, ${name}.`, '', `Registrei seu interesse na leitura dos números da ${school}.`, '',
      'A conversa terá aproximadamente 45 minutos, será online e será dedicada aos dados da sua escola em comparação com os padrões observados no estudo. A agenda vai até 30 de setembro, com prioridade para escolas com mais de uma liderança respondendo.', '',
      `Quando houver mais de uma liderança respondendo pela mesma escola, também poderemos observar onde as percepções convergem e onde divergem. Se quiser garantir isso, encaminhe o link para mais alguém da equipe: ${shareUrl}`, '',
      'Entro em contato pelo WhatsApp para combinarmos o horário.', '', 'Um abraço,', 'Equipe Nexara Consulting',
    ].join('\n');
    MailApp.sendEmail({ to: p.P40, subject: `Sobre a leitura dos números da ${school}`, body: conversation, name: 'Equipe Nexara · Nexara Consulting', replyTo: CONFIG.REPLY_TO });
  }
  return true;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

// Execute manualmente no editor do Apps Script para validar o caso crítico antes de publicar.
function testeP12NaoSei() {
  const result = calculateDimensions_({ P12: 'Não sei informar', P16: 4 }, 'teste_p12_nao_sei');
  if (result[4] !== 75) throw new Error(`Falha: Papeis_0a100 deveria ser 75 e retornou ${result[4]}.`);
  console.log('OK: P12 vazio foi ignorado; Papeis_0a100 = 75.');
}
