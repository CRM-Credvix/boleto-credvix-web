const SPREADSHEET_ID = '13D3M9RMOYQTnosboBZzKvVB-hnQE8YBWG9_OmCzQrrw';
const SHEET_NAME = 'EMISSÃO BOLETOS';
const HEADER_ROW = 3;
const TIMEZONE = 'America/Sao_Paulo';
const REQUEST_ID_COLUMN = 28; // AB

function json_(payload, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doGet(e) {
  const requestId = String(e && e.parameter && e.parameter.requestId || '').trim();
  const signature = String(e && e.parameter && e.parameter.sig || '').trim().toLowerCase();

  if (!requestId) {
    return json_({ ok: true, service: 'boleto-credvix-queue', sheet: SHEET_NAME }, 200);
  }

  const props = PropertiesService.getScriptProperties();
  const expectedKey = String(props.getProperty('BRIDGE_KEY') || '').trim();
  if (!expectedKey) return json_({ ok: false, error: 'BRIDGE_KEY_NOT_CONFIGURED' }, 500);

  const expectedSignature = hmacHex_(requestId, expectedKey);
  if (!signature || signature !== expectedSignature) {
    return json_({ ok: false, error: 'UNAUTHORIZED' }, 403);
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return json_({ ok: false, error: 'SHEET_NOT_FOUND' }, 500);

  const found = findRequest_(sheet, requestId);
  if (!found) {
    return json_({ ok: true, found: false, requestId: requestId }, 200);
  }

  return json_({
    ok: true,
    found: true,
    requestId: requestId,
    row: found.row,
    queueId: found.queueId,
    status: found.status
  }, 200);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const props = PropertiesService.getScriptProperties();
    const expectedKey = String(props.getProperty('BRIDGE_KEY') || '').trim();
    if (!expectedKey) return json_({ ok: false, error: 'BRIDGE_KEY_NOT_CONFIGURED' }, 500);

    let body = {};
    try {
      body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    } catch (err) {
      return json_({ ok: false, error: 'INVALID_JSON' }, 400);
    }

    if (String(body.bridgeKey || '') !== expectedKey) {
      return json_({ ok: false, error: 'UNAUTHORIZED' }, 403);
    }

    const requestId = String(body.requestId || '').trim();
    const submittedAt = new Date(String(body.submittedAt || ''));
    const solicitante = String(body.solicitante || '').trim();
    const unidade = String(body.unidade || '').trim();
    const cpf = digits_(body.cpf);
    const telefone = digits_(body.telefone);
    const contrato = digits_(body.contrato);
    const tipoSolicitacao = String(body.tipoSolicitacao || '').trim();
    const parcelaInicial = Number(body.parcelaInicial);
    const parcelaFinal = Number(body.parcelaFinal);
    const origem = String(body.origem || 'GITHUB_PAGES').trim() || 'GITHUB_PAGES';

    if (!requestId) return json_({ ok: false, error: 'REQUEST_ID_REQUIRED' }, 400);
    if (isNaN(submittedAt.getTime())) return json_({ ok: false, error: 'INVALID_SUBMITTED_AT' }, 400);
    if (solicitante.length < 3) return json_({ ok: false, error: 'INVALID_SOLICITANTE' }, 400);
    if (!unidade) return json_({ ok: false, error: 'INVALID_UNIDADE' }, 400);
    if (cpf.length !== 11) return json_({ ok: false, error: 'INVALID_CPF' }, 400);
    if (![10, 11].includes(telefone.length)) return json_({ ok: false, error: 'INVALID_TELEFONE' }, 400);
    if (telefone === cpf) return json_({ ok: false, error: 'TELEFONE_EQUALS_CPF' }, 400);
    if (!['parcela_especifica', 'intervalo'].includes(tipoSolicitacao)) return json_({ ok: false, error: 'INVALID_TIPO_SOLICITACAO' }, 400);
    if (!Number.isInteger(parcelaInicial) || !Number.isInteger(parcelaFinal) || parcelaInicial < 1 || parcelaFinal < parcelaInicial || parcelaFinal > 999) {
      return json_({ ok: false, error: 'INVALID_PARCELAS' }, 400);
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return json_({ ok: false, error: 'SHEET_NOT_FOUND' }, 500);

    const existing = findRequest_(sheet, requestId);
    if (existing) {
      return json_({
        ok: true,
        duplicate: true,
        row: existing.row,
        queueId: existing.queueId,
        requestId: requestId,
        status: existing.status
      }, 200);
    }

    const targetRow = firstEmptyRequestRow_(sheet);
    const now = new Date();

    // Colunas com ARRAYFORMULA na planilha (A, J, K, Q, S e V) não são escritas aqui.
    // Isso preserva as fórmulas e evita #REF! quando novas solicitações entram.
    sheet.getRange(targetRow, 2, 1, 8).setValues([[
      submittedAt,       // B DATA / HORA SOLICITAÇÃO
      solicitante,       // C SOLICITANTE
      unidade,           // D UNIDADE
      cpf,               // E CPF
      '',                // F CLIENTE
      contrato,          // G CONTRATO
      parcelaInicial,    // H PARCELA INICIAL
      parcelaFinal       // I PARCELA FINAL
    ]]);

    sheet.getRange(targetRow, 12, 1, 5).setValues([[
      'NORMAL',          // L PRIORIDADE
      'PENDENTE',        // M STATUS
      0,                 // N TENTATIVAS
      '',                // O INÍCIO PROCESSAMENTO
      ''                 // P FIM PROCESSAMENTO
    ]]);

    sheet.getRange(targetRow, 18, 1, 1).setValue('');       // R ARQUIVO / LINK
    sheet.getRange(targetRow, 20, 1, 2).setValues([['', now]]); // T LOG / ERRO, U ÚLTIMA ATUALIZAÇÃO
    sheet.getRange(targetRow, 23, 1, 3).setValues([['', '', '']]); // W:X:Y
    sheet.getRange(targetRow, 26, 1, 4).setValues([[
      'PENDENTE',        // Z ETAPA PROCESSAMENTO
      telefone,          // AA TELEFONE
      requestId,         // AB REQUEST_ID
      origem             // AC ORIGEM
    ]]);

    sheet.getRange(targetRow, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    sheet.getRange(targetRow, 21).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    SpreadsheetApp.flush();
    Utilities.sleep(150);

    const confirmed = findRequest_(sheet, requestId);
    if (!confirmed || !confirmed.queueId) {
      return json_({ ok: false, error: 'QUEUE_CONFIRMATION_FAILED', requestId: requestId }, 500);
    }

    return json_({
      ok: true,
      duplicate: false,
      row: confirmed.row,
      queueId: confirmed.queueId,
      requestId: requestId,
      status: confirmed.status
    }, 200);
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: 'INTERNAL_ERROR', message: String(error && error.message || error) }, 500);
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function digits_(value) {
  return String(value == null ? '' : value).replace(/\D/g, '');
}

function firstEmptyRequestRow_(sheet) {
  const firstDataRow = HEADER_ROW + 1;
  const maxRows = sheet.getMaxRows();
  const values = sheet.getRange(firstDataRow, 2, maxRows - HEADER_ROW, 1).getDisplayValues(); // coluna B
  const emptyIndex = values.findIndex((row) => !String(row[0] || '').trim());
  if (emptyIndex >= 0) return firstDataRow + emptyIndex;

  sheet.insertRowsAfter(maxRows, 100);
  return maxRows + 1;
}

function findRequest_(sheet, requestId) {
  const maxRows = sheet.getMaxRows();
  const firstDataRow = HEADER_ROW + 1;
  const values = sheet.getRange(firstDataRow, REQUEST_ID_COLUMN, maxRows - HEADER_ROW, 1).getDisplayValues().flat();
  const index = values.findIndex((value) => String(value || '').trim() === requestId);
  if (index < 0) return null;

  const row = firstDataRow + index;
  return {
    row: row,
    queueId: String(sheet.getRange(row, 1).getDisplayValue() || '').trim(),
    status: String(sheet.getRange(row, 13).getDisplayValue() || '').trim()
  };
}

function hmacHex_(value, key) {
  const bytes = Utilities.computeHmacSha256Signature(value, key, Utilities.Charset.UTF_8);
  return bytes.map((byte) => {
    const normalized = byte < 0 ? byte + 256 : byte;
    return ('0' + normalized.toString(16)).slice(-2);
  }).join('');
}
