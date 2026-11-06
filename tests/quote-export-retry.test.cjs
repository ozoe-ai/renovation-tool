const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(path, mocks, globals = {}) {
  mocks = { "./firebase-production-config.json": require("../lib/firebase-production-config.json"), ...mocks };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => name in mocks ? mocks[name] : require(name), ...globals });
  return exports;
}

test('real Firestore serializer reproduces the unentered-area error and accepts the corrected settings without committing', async () => {
  let settings;
  const client = load('lib/firebase-client.ts', {
    'firebase/app': { getApps: () => [{}] }, 'firebase/auth': {},
    'firebase/firestore': { initializeFirestore: (_app, options) => { settings = options; return {}; },
      persistentLocalCache: options => options, persistentMultipleTabManager: () => ({}) }
  }, { window: {}, process: { env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'test', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-local', NEXT_PUBLIC_FIREBASE_APP_ID: 'test'
  } } });
  client.getFirestoreDb();
  const { initializeApp, deleteApp } = require('firebase/app');
  const { initializeFirestore, writeBatch, doc, terminate } = require('firebase/firestore');
  const data = { state: { roomCountSettings: { totalAreaSqm: undefined, roomCount: 2 }, assigneeIds: ['go'] } };
  for (const corrected of [false, true]) {
    const app = initializeApp({ projectId: 'demo-local' }, 'serializer-' + corrected);
    const db = initializeFirestore(app, corrected ? { ignoreUndefinedProperties: settings.ignoreUndefinedProperties } : {});
    const serialize = () => writeBatch(db).set(doc(db, 'estimate_projects/local-only'), data);
    if (corrected) assert.doesNotThrow(serialize);
    else assert.throws(serialize, /Unsupported field value: undefined.*totalAreaSqm/);
    // No batch.commit(): this checks the real SDK serializer without network writes.
    await terminate(db); await deleteApp(app);
  }
  assert.equal(data.state.roomCountSettings.roomCount, 2);
  assert.equal(data.state.roomCountSettings.totalAreaSqm, undefined);
});

function gas() {
  const properties = new Map(), folders = new Map(), files = new Map(), logs = [];
  const counts = { copies: 0, writes: 0, held: false };
  const failures = { writeOnce: false, loseCopyResponse: false, copyStatus: 0, ambiguousCopy: false };
  const parentId = '1oUKD65onJYeZWqfoeTdWuEhzr-3TE216';
  const parent = {
    getFoldersByName: name => ({ hasNext: () => folders.has(name), next: () => folders.get(name) }),
    createFolder: name => { assert.equal(counts.held, true); const folder = { getId: () => 'staff-folder' }; folders.set(name, folder); return folder; }
  };
  const context = {
    console: { log: data => logs.push(data), error: data => logs.push(data) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties.get(key) || null, setProperty: (key, value) => properties.set(key, value) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { counts.held = true; return true; }, releaseLock: () => { counts.held = false; } }) },
    DriveApp: {
      getFolderById: id => id === parentId ? parent : { getId: () => 'staff-folder' },
      getFileById: () => ({ getMimeType: () => 'application/vnd.google-apps.spreadsheet' })
    },
    ScriptApp: { getOAuthToken: () => 'PRIVATE_TOKEN' },
    SpreadsheetApp: {
      flush: () => {},
      openById: id => ({ getId: () => id, getUrl: () => `https://docs.google.com/spreadsheets/d/${id}/edit`,
        getSheets: () => [{ getRange: () => ({ getValue: () => '物件名：11.4' }) }] })
    },
    UrlFetchApp: { fetch: (url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer PRIVATE_TOKEN');
      const response = (body, status = 200) => ({ getResponseCode: () => status, getContentText: () => JSON.stringify(body) });
      if (options.method === 'post') {
        if (failures.copyStatus) return response({ error: 'PRIVATE_RESPONSE' }, failures.copyStatus);
        if (failures.ambiguousCopy) throw new Error('PRIVATE_RESPONSE');
        counts.copies++;
        const body = JSON.parse(options.payload);
        const file = { id: 'spreadsheet-file-' + counts.copies, name: body.name, parents: body.parents,
          mimeType: 'application/vnd.google-apps.spreadsheet', appProperties: body.appProperties };
        files.set(file.id, file);
        if (failures.loseCopyResponse) { failures.loseCopyResponse = false; throw new Error('PRIVATE_RESPONSE'); }
        return response(file);
      }
      if (url.includes('/files?')) return response({ files: [...files.values()] });
      const id = new URL(url).pathname.split('/').pop();
      return response(files.get(id));
    } }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('outputs/Code.gs', 'utf8'), context);
  context.writeToOriginalTemplate_ = () => {
    counts.writes++;
    if (failures.writeOnce) { failures.writeOnce = false; throw new Error('PRIVATE_QUOTE 11.4 PRIVATE_TOKEN'); }
  };
  const payload = { protocolVersion: 'quote-export-v2', requestId: 'a'.repeat(64), projectName: '11.4', assigneeName: '豪志', items: [] };
  const post = changes => context.doPost({ postData: { contents: JSON.stringify({ ...payload, ...changes }) } });
  return { counts, failures, properties, folders, files, logs, context, post };
}

test('completed GAS exports are reused without copying or rewriting, preserving the filename rule', () => {
  const service = gas();
  const first = service.post();
  assert.equal(first.ok, true);
  assert.match(first.fileName, /^見積書_11\.4_\d{8}_\d{4}$/);
  const repeated = service.post();
  assert.equal(repeated.ok, true);
  assert.equal(repeated.reused, true);
  assert.equal(repeated.spreadsheetId, first.spreadsheetId);
  assert.equal(service.counts.copies, 1);
  assert.equal(service.counts.writes, 1);
  assert.equal(service.folders.size, 1);
  assert.equal(service.counts.held, false);
});

test('write failure resumes the same file and does not report success early or leak data', () => {
  const service = gas();
  service.failures.writeOnce = true;
  const failed = service.post();
  assert.equal(failed.ok, false);
  assert.equal(failed.stage, 'write');
  assert.equal(failed.code, 'WRITE_FAILED');
  assert.equal(service.post().ok, true);
  assert.equal(service.counts.copies, 1);
  assert.equal(service.counts.writes, 2);
  assert.doesNotMatch(JSON.stringify(service.logs) + JSON.stringify(failed), /PRIVATE_|11\.4|豪志/);
});

test('a lost copy response is reconciled by atomic Drive metadata on the next retry', () => {
  const service = gas();
  service.failures.loseCopyResponse = true;
  assert.equal(service.post().code, 'COPY_UNCERTAIN');
  assert.equal(service.post().ok, true);
  assert.equal(service.counts.copies, 1);
  assert.equal(service.counts.writes, 1);
});

test('an ambiguous copy with no visible file is never repeated blindly', () => {
  const service = gas();
  service.failures.ambiguousCopy = true;
  assert.equal(service.post().code, 'COPY_UNCERTAIN');
  service.failures.ambiguousCopy = false;
  assert.equal(service.post().code, 'COPY_UNCERTAIN');
  assert.equal(service.counts.copies, 0);
  assert.equal(service.counts.held, false);
});

test('definite Drive permission rejection can be retried after access is restored', () => {
  const service = gas();
  service.failures.copyStatus = 403;
  const failed = service.post();
  assert.equal(failed.code, 'ACCESS_DENIED');
  assert.equal(failed.stage, 'copy');
  service.failures.copyStatus = 0;
  assert.equal(service.post().ok, true);
  assert.equal(service.counts.copies, 1);
});

test('GAS rejects old/missing-assignee requests before creating folders or files', () => {
  const service = gas();
  assert.equal(service.post({ assigneeName: '' }).code, 'INVALID_PAYLOAD');
  assert.equal(service.post({ protocolVersion: undefined }).code, 'INVALID_PAYLOAD');
  assert.equal(service.counts.copies, 0);
  assert.equal(service.folders.size, 0);
  assert.equal(service.context.doGet().protocolVersion, 'quote-export-v2');
});

const quote = () => ({ activeProjectId: 'saved-project', projectName: '11.4', selectedWorkItems: [], assigneeIds: ['go'], assigneeNames: { go: '豪志' } });
function api(fetch) {
  const logs = [];
  return { logs, ...load('app/api/export-quote/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) } }
  }, { process: { env: { GAS_API_SECRET: 'PRIVATE_SECRET' } }, AbortSignal, fetch,
    console: { info: (...args) => logs.push(args), error: (...args) => logs.push(args) } }) };
}

test('API export identity survives reload/navigation and changes when quote content changes', async () => {
  const sent = [];
  const route = api(async (_url, options) => {
    if (!options.body) return { ok: true, json: async () => ({ protocolVersion: 'quote-export-v2' }) };
    const payload = JSON.parse(options.body); sent.push(payload);
    return { ok: true, json: async () => ({ ok: true, protocolVersion: 'quote-export-v2', requestId: payload.requestId, spreadsheetId: 'spreadsheet-file-123' }) };
  });
  for (const state of [quote(), { ...quote(), currentStep: 7, activeProjectStatus: 'completed' }, { ...quote(), projectName: 'Edited' }]) {
    assert.equal((await route.POST({ json: async () => state })).status, 200);
  }
  assert.equal(sent[0].requestId, sent[1].requestId);
  assert.notEqual(sent[1].requestId, sent[2].requestId);
  assert.doesNotMatch(JSON.stringify(route.logs), /PRIVATE_SECRET|11\.4|豪志/);
});

test('API does not POST to old GAS or accept HTML/errors as a saved file', async () => {
  let posts = 0;
  const old = api(async (_url, options) => { if (options.body) posts++; return { ok: true, status: 200, json: async () => { throw new Error('HTML response PRIVATE_SECRET'); } }; });
  const failed = await old.POST({ json: async () => quote() });
  assert.equal(failed.body.code, 'GAS_UPGRADE_REQUIRED');
  assert.equal(posts, 0);
  const bad = api(async (_url, options) => options.body
    ? { ok: true, json: async () => ({ ok: true, protocolVersion: 'quote-export-v2', spreadsheetId: 'file-12345678', requestId: 'wrong' }) }
    : { ok: true, json: async () => ({ protocolVersion: 'quote-export-v2' }) });
  assert.equal((await bad.POST({ json: async () => quote() })).body.code, 'INVALID_RECEIPT');
});

test('API reports controlled stage/code without echoing raw GAS details', async () => {
  const route = api(async (_url, options) => options.body
    ? { ok: true, json: async () => ({ ok: false, stage: 'folder', code: 'ACCESS_DENIED', error: 'PRIVATE_SECRET 11.4 豪志' }) }
    : { ok: true, json: async () => ({ protocolVersion: 'quote-export-v2' }) });
  const result = await route.POST({ json: async () => quote() });
  assert.equal(result.body.stage, 'folder');
  assert.match(result.body.error, /担当者フォルダ/);
  assert.doesNotMatch(JSON.stringify(result) + JSON.stringify(route.logs), /PRIVATE_SECRET|11\.4|豪志/);
});

function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

test('final confirmation persists input first, blocks double submission, and retries a failed project save', async () => {
  const React = require('react');
  const states = [], refs = [], events = [];
  let index = 0, refIndex = 0, remoteFailure = true, release;
  const app = {
    state: { ...quote(), activeProjectStatus: 'draft', multiplier: null }, staff: [],
    getSumCost: () => 0, getSumSell: () => null, getSumSellTax: () => null,
    setProjectName: () => {}, setMultiplier: () => {},
    saveProject: async (status, snapshot, options) => {
      events.push(status);
      app.state = { ...snapshot, activeProjectStatus: status };
      if (options?.requireRemote && remoteFailure) throw new Error('offline');
    }
  };
  const component = load('components/screens/FinalConfirmScreen.tsx', {
    '@/lib/WizardContext': { useApp: () => app }, '@/lib/item-display': {},
    react: { ...React, useEffect: () => {},
      useState: initial => { const i = index++; if (!(i in states)) states[i] = initial; return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }]; },
      useRef: initial => { const i = refIndex++; return refs[i] ??= { current: initial }; }
    }
  }, { fetch: async () => { events.push('fetch'); await new Promise(resolve => { release = resolve; }); return {
    ok: true, json: async () => ({ ok: true, spreadsheetId: 'spreadsheet-file-123', spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/spreadsheet-file-123/edit' })
  }; } });
  const render = () => { index = refIndex = 0; return component.FinalConfirmScreen(); };
  const button = nodes(render()).find(node => node.type === 'button' && node.props.children === '見積確定');
  const first = button.props.onClick();
  await button.props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, ['draft', 'fetch']);
  release(); await first;
  assert.equal(states[1], false, 'must not show success before the project is remotely saved');
  assert.match(states[3], /案件データの保存確認/);
  assert.equal(app.state.projectName, '11.4');
  remoteFailure = false;
  const retry = nodes(render()).find(node => node.type === 'button' && node.props.children === '見積確定').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  release(); await retry;
  assert.equal(states[1], true);
  assert.equal(app.state.projectName, '11.4');
});

test('email authentication lands on the project list even when the editor lock restores a draft', async () => {
  const React = require('react');
  const states = [], refs = [], effects = [];
  let index = 0, refIndex = 0, effectIndex = 0, observer;
  let lock = {};
  const blank = () => ({ currentStep: 7, selectedWorkItems: [], assigneeIds: [] });
  const cache = { projects: [], staff: [], pending: {}, draft: { ...blank(), currentStep: 6, projectName: 'keep-draft', activeProjectId: 'p1' } };
  const context = load('lib/WizardContext.tsx', {
    react: { ...React, useCallback: fn => fn, useMemo: fn => fn(), useEffect: fn => { effects[effectIndex++] = fn; },
      useState: initial => { const i = index++; if (!(i in states)) states[i] = initial; return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }]; },
      useRef: initial => { const i = refIndex++; return refs[i] ??= { current: initial }; }
    },
    './store': { initialState: blank, isBlankEstimate: () => false, PROJECT_LIST_STEP: 7 },
    './project-repository': { watchMembership: (_uid, next) => { next({ active: true }, false); return () => {}; } },
    './shared-project-cache': { readSharedCache: () => cache, overlayPending: value => value.projects },
    './firebase-client': {
      onFirebaseUserChanged: fn => { observer = fn; fn(null); return () => {}; },
      signInWithEmail: async () => observer({ uid: 'staff', email: 'example@invalid.test', isAnonymous: false })
    }
  }, { window: { setTimeout: () => 1, clearTimeout: () => {} }, navigator: { locks: { request: (_name, _options, fn) => fn(lock) } } });
  const render = () => { index = refIndex = effectIndex = 0; return context.AppProvider({ children: null }).props.value; };
  render(); const stopObserver = effects[0]();
  await render().loginWithEmail('example@invalid.test', 'unused');
  assert.equal(render().state.currentStep, 7);
  const releaseLock = effects[1]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(render().state.currentStep, 7);
  assert.equal(render().state.projectName, 'keep-draft');
  releaseLock();
  lock = null;
  const stopMembership = effects[2]();
  const stopBlockedLock = effects[1]();
  await new Promise(resolve => setImmediate(resolve));
  const blocked = render();
  assert.equal(blocked.authUser.uid, "staff");
  assert.equal(blocked.memberActive, true);
  assert.equal(blocked.canEdit, false);
  assert.equal(blocked.authError, null);
  await assert.rejects(blocked.saveProject("draft"), /編集できません/);
  stopBlockedLock(); stopMembership(); stopObserver();
});
