/**
 * Mythos — Leads · endpoint + Meta CAPI
 *
 * LP (GitHub Pages) --POST--> doPost --> linha na aba Leads + evento Lead server-side
 * Comercial muda Status na planilha --> onEdit --> evento de funil (LeadQualificado etc.)
 *
 * Config em Configurações do projeto > Propriedades do script:
 *   META_PIXEL_ID     obrigatório
 *   META_ACCESS_TOKEN obrigatório
 *   META_TEST_CODE    opcional — enquanto preenchido, os eventos caem só em Testar eventos
 */

const ABA = 'Leads';
const API = 'https://graph.facebook.com/v21.0';

const HEADERS = [
  'Mês', 'Data', 'Nome', 'Email', 'Telefone', 'Empresa', 'CNPJ/RUC', 'Faturamento', 'Status',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'Event ID', 'FBCLID', 'GCLID', 'GBRAID', 'WBRAID', 'TTCLID', 'MSCLKID', 'FBP', 'FBC',
  'Primeiro Nome', 'Sobrenome', 'Pagina', 'Referencia', 'Idioma', 'Resolucao', 'Fuso Horario',
  'IP', 'Navegador', 'Cidade', 'Estado', 'CEP', 'Pais', 'Data ISO', 'Enviado CAPI'
];

const STATUS = ['Frio', 'Morno', 'Quente', 'Fechado', 'Desqualificado'];
const EVENTO_POR_STATUS = {
  'Frio': 'LeadFrio',
  'Morno': 'LeadMorno',
  'Quente': 'LeadQualificado',
  'Fechado': 'LeadFechado',
  'Desqualificado': 'LeadDesqualificado'
};

const COLS_TEXTO = ['Telefone', 'CNPJ/RUC', 'CEP'];

/* ======================= SETUP ======================= */

function configurarTudo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.getSheets()[0];
    if (sh.getLastRow() === 0 && sh.getLastColumn() === 0) sh.setName(ABA);
    else sh = ss.insertSheet(ABA, 0);
  }
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1);

  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getMaxColumns() > HEADERS.length) {
    sh.deleteColumns(HEADERS.length + 1, sh.getMaxColumns() - HEADERS.length);
  }

  const head = sh.getRange(1, 1, 1, HEADERS.length);
  head.setBackground('#2D1B4E').setFontColor('#F4F0FF').setFontWeight('bold')
      .setFontSize(10).setVerticalAlignment('middle').setWrap(false);
  sh.setRowHeight(1, 38);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(3);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), HEADERS.length).createFilter();

  COLS_TEXTO.forEach(nome => {
    const c = HEADERS.indexOf(nome) + 1;
    sh.getRange(2, c, sh.getMaxRows() - 1, 1).setNumberFormat('@');
  });

  const cStatus = HEADERS.indexOf('Status') + 1;
  const rgStatus = sh.getRange(2, cStatus, sh.getMaxRows() - 1, 1);
  rgStatus.setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build()
  );

  const cores = { 'Frio': '#D6E4FF', 'Morno': '#FFE8CC', 'Quente': '#FFD6DD', 'Fechado': '#D7F5DC', 'Desqualificado': '#E4E4E4' };
  sh.setConditionalFormatRules(Object.keys(cores).map(k =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(k).setBackground(cores[k]).setRanges([rgStatus]).build()
  ));

  [['Nome', 190], ['Email', 220], ['Telefone', 150], ['Empresa', 190], ['Faturamento', 170], ['Data', 150]]
    .forEach(([nome, w]) => sh.setColumnWidth(HEADERS.indexOf(nome) + 1, w));

  instalarGatilhos_();
  SpreadsheetApp.getUi().alert('Planilha configurada.\n\n' + diagnosticoTexto_());
}

function instalarGatilhos_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existentes = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  if (existentes.indexOf('onEditInstalado') === -1) {
    ScriptApp.newTrigger('onEditInstalado').forSpreadsheet(ss).onEdit().create();
  }
}

/* ======================= ENDPOINT ======================= */

function doGet() {
  return json_({ ok: true, service: 'mythos-leads', pixel: !!prop_('META_PIXEL_ID') });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (err) {
    return json_({ ok: false, error: 'lock' });
  }
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!body.nome && !body.email && !body.telefone) return json_({ ok: false, error: 'payload vazio' });

    const linha = gravar_(body);
    let capi = 'sem config';
    try {
      capi = enviarLead_(body);
    } catch (err) {
      capi = 'ERRO: ' + err.message;
    }
    marcarCapi_(linha, capi);
    return json_({ ok: true, row: linha, capi: capi });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function gravar_(b) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA);
  const cabecalhos = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const agora = new Date();
  const tz = 'America/Sao_Paulo';
  const nome = String(b.nome || '').trim();
  const partes = nome.split(/\s+/);

  const dados = {
    'mês': Utilities.formatDate(agora, tz, 'MMMM/yyyy'),
    'data': Utilities.formatDate(agora, tz, 'dd/MM/yyyy HH:mm'),
    'nome': nome,
    'email': String(b.email || '').trim().toLowerCase(),
    'telefone': formatarTelefone_(b.telefone),
    'empresa': String(b.empresa || '').trim(),
    'cnpj/ruc': String(b.cnpj || '').trim(),
    'faturamento': rotuloFaturamento_(b.faturamento),
    'status': '',
    'event id': b.event_id || Utilities.getUuid(),
    'primeiro nome': partes[0] || '',
    'sobrenome': partes.slice(1).join(' '),
    'pagina': b.page_url || '',
    'referencia': b.referrer || '',
    'idioma': b.language || '',
    'resolucao': b.screen || '',
    'fuso horario': b.timezone || '',
    'ip': b.ip || '',
    'navegador': b.user_agent || '',
    'cidade': b.city || '',
    'estado': b.region || '',
    'cep': String(b.postal || '').replace(/\D/g, ''),
    'pais': (b.country || 'BR').toUpperCase(),
    'data iso': Utilities.formatDate(agora, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    'enviado capi': ''
  };
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(k => dados[k] = b[k] || '');
  ['fbclid', 'gclid', 'gbraid', 'wbraid', 'ttclid', 'msclkid', 'fbp', 'fbc'].forEach(k => dados[k] = b[k] || '');

  const linha = cabecalhos.map(h => {
    const v = dados[String(h).trim().toLowerCase()];
    return v === undefined ? '' : v;
  });

  sh.insertRowBefore(2);
  sh.getRange(2, 1, 1, linha.length).setValues([linha]);
  COLS_TEXTO.forEach(nomeCol => {
    const c = cabecalhos.indexOf(nomeCol) + 1;
    if (c > 0) sh.getRange(2, c).setNumberFormat('@');
  });
  return 2;
}

function marcarCapi_(linha, texto) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA);
  const c = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].indexOf('Enviado CAPI') + 1;
  if (c > 0) sh.getRange(linha, c).setValue(texto);
}

/* ======================= META CAPI ======================= */

function enviarLead_(b) {
  const eventId = b.event_id || '';
  const chave = 'meta_sent_Lead_' + eventId;
  const props = PropertiesService.getScriptProperties();
  if (eventId && props.getProperty(chave)) return 'duplicado';

  const nome = String(b.nome || '').trim().split(/\s+/);
  const user = montarUser_({
    email: b.email,
    telefone: formatarTelefone_(b.telefone),
    primeiro: nome[0] || '',
    sobrenome: nome.slice(1).join(' '),
    cidade: b.city,
    estado: b.region,
    cep: b.postal,
    pais: b.country,
    externalId: eventId,
    ip: b.ip,
    ua: b.user_agent,
    fbp: b.fbp,
    fbc: b.fbc || (b.fbclid ? 'fb.1.' + Date.now() + '.' + b.fbclid : '')
  });

  const r = postarEvento_({
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: b.page_url || '',
    user_data: user,
    custom_data: { content_category: rotuloFaturamento_(b.faturamento) }
  });

  if (r.ok && eventId) props.setProperty(chave, '1');
  return r.ok ? 'OK ' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM HH:mm') : 'ERRO: ' + r.erro;
}

function onEditInstalado(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== ABA) return;

  const cabecalhos = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const cStatus = cabecalhos.indexOf('Status') + 1;
  if (e.range.getColumn() !== cStatus || e.range.getRow() < 2) return;

  const evento = EVENTO_POR_STATUS[String(e.range.getValue()).trim()];
  if (!evento) return;

  const linha = e.range.getRow();
  const props = PropertiesService.getScriptProperties();
  const valores = sh.getRange(linha, 1, 1, cabecalhos.length).getValues()[0];
  const get = nome => {
    const i = cabecalhos.indexOf(nome);
    return i === -1 ? '' : String(valores[i] || '');
  };

  const eventId = evento.toLowerCase() + '_' + (get('Event ID') || linha);
  const chave = 'meta_sent_' + eventId;
  if (props.getProperty(chave)) return;

  const user = montarUser_({
    email: get('Email'),
    telefone: get('Telefone'),
    primeiro: get('Primeiro Nome'),
    sobrenome: get('Sobrenome'),
    cidade: get('Cidade'),
    estado: get('Estado'),
    cep: get('CEP'),
    pais: get('Pais'),
    externalId: get('Event ID'),
    ip: get('IP'),
    ua: get('Navegador'),
    fbp: get('FBP'),
    fbc: get('FBC')
  });

  const r = postarEvento_({
    event_name: evento,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'system_generated',
    user_data: user,
    custom_data: { content_category: get('Faturamento') }
  });
  if (r.ok) props.setProperty(chave, '1');
}

function postarEvento_(evento) {
  const pixel = prop_('META_PIXEL_ID');
  const token = prop_('META_ACCESS_TOKEN');
  if (!pixel || !token) return { ok: false, erro: 'META_PIXEL_ID/META_ACCESS_TOKEN não configurados' };

  const payload = { data: [evento], access_token: token };
  const teste = prop_('META_TEST_CODE');
  if (teste) payload.test_event_code = teste;

  const res = UrlFetchApp.fetch(API + '/' + pixel + '/events', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const codigo = res.getResponseCode();
  const corpo = res.getContentText();
  if (codigo >= 200 && codigo < 300) return { ok: true, corpo: corpo };
  return { ok: false, erro: codigo + ' ' + corpo.slice(0, 300) };
}

function montarUser_(d) {
  const u = {};
  const add = (k, v) => { if (v) u[k] = [sha256_(v)]; };

  add('em', String(d.email || '').trim().toLowerCase());
  add('ph', String(d.telefone || '').replace(/\D/g, ''));
  add('fn', normalizar_(d.primeiro));
  add('ln', normalizar_(d.sobrenome));
  add('ct', normalizar_(d.cidade));
  add('st', normalizar_(d.estado).slice(0, 2));
  add('zp', String(d.cep || '').replace(/\D/g, ''));
  add('country', (String(d.pais || 'BR').trim().toLowerCase() || 'br').slice(0, 2));
  add('external_id', d.externalId);

  if (d.ip) u.client_ip_address = d.ip;
  if (d.ua) u.client_user_agent = d.ua;
  if (d.fbp) u.fbp = d.fbp;
  if (d.fbc) u.fbc = d.fbc;
  return u;
}

/* ======================= HELPERS ======================= */

// DDI sai do que a pessoa digitou. Nunca do país do IP: VPN ou viagem viraria número errado.
function formatarTelefone_(bruto) {
  const cru = String(bruto || '').trim();
  let d = cru.replace(/\D/g, '');
  if (!d) return '';
  if (cru.charAt(0) === '+') return '+' + d;
  if (d.indexOf('0') === 0) d = d.slice(1);
  if (d.length === 10) d = d.slice(0, 2) + '9' + d.slice(2);
  return '+55' + d;
}

function rotuloFaturamento_(v) {
  const mapa = {
    'ate-10k': 'Até R$ 10 mil/mês',
    '10k-50k': 'R$ 10 mil a R$ 50 mil/mês',
    '50k-100k': 'R$ 50 mil a R$ 100 mil/mês',
    '100k-500k': 'R$ 100 mil a R$ 500 mil/mês',
    '500k-1m': 'R$ 500 mil a R$ 1 milhão/mês',
    'acima-1m': 'Acima de R$ 1 milhão/mês',
    'pre-faturamento': 'Ainda não fatura'
  };
  return mapa[v] || String(v || '');
}

function normalizar_(v) {
  const s = String(v || '').normalize('NFD');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x0300 || c > 0x036f) out += s.charAt(i);
  }
  return out.toLowerCase().replace(/[^a-z]/g, '');
}

function sha256_(v) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v), Utilities.Charset.UTF_8)
    .map(b => ((b < 0 ? b + 256 : b) + 0x100).toString(16).slice(1)).join('');
}

function prop_(k) {
  return PropertiesService.getScriptProperties().getProperty(k) || '';
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ======================= DIAGNÓSTICO ======================= */

function diagnosticar() {
  SpreadsheetApp.getUi().alert(diagnosticoTexto_());
}

function diagnosticoTexto_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA);
  const gatilhos = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction()).join(', ') || 'nenhum';
  const faltando = HEADERS.filter(h =>
    sh ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].indexOf(h) === -1 : true);

  return [
    'Aba Leads: ' + (sh ? 'ok (' + Math.max(0, sh.getLastRow() - 1) + ' leads)' : 'NÃO EXISTE — rode configurarTudo'),
    'Colunas faltando: ' + (faltando.length ? faltando.join(', ') : 'nenhuma'),
    'META_PIXEL_ID: ' + (prop_('META_PIXEL_ID') || 'FALTANDO'),
    'META_ACCESS_TOKEN: ' + (prop_('META_ACCESS_TOKEN') ? 'configurado' : 'FALTANDO'),
    'META_TEST_CODE: ' + (prop_('META_TEST_CODE') || 'vazio (eventos vão para produção)'),
    'Gatilhos: ' + gatilhos
  ].join('\n');
}

function testarCAPI() {
  const r = postarEvento_({
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: 'teste_' + Date.now(),
    action_source: 'system_generated',
    user_data: montarUser_({ email: 'teste@mythos.test', telefone: '+5548999999999', primeiro: 'teste', sobrenome: 'mythos', pais: 'BR' })
  });
  SpreadsheetApp.getUi().alert(r.ok ? 'CAPI OK\n\n' + r.corpo : 'CAPI FALHOU\n\n' + r.erro);
}

function limparCache() {
  const props = PropertiesService.getScriptProperties();
  props.getKeys().filter(k => k.indexOf('meta_sent_') === 0).forEach(k => props.deleteProperty(k));
  SpreadsheetApp.getUi().alert('Cache de dedup limpo.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Mythos')
    .addItem('Configurar planilha', 'configurarTudo')
    .addItem('Diagnosticar', 'diagnosticar')
    .addItem('Testar CAPI', 'testarCAPI')
    .addSeparator()
    .addItem('Limpar cache de dedup', 'limparCache')
    .addToUi();
}
