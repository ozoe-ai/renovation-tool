const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText;
  vm.runInNewContext(code, { exports, require: id => id in mocks ? mocks[id] : require(id), ...globals }, { filename: file });
  return exports;
}
const record = (updatedAt = '2026-10-28T01:00:00.000Z') => ({
  id: 'p1', name: '共有案件', ownerId: 'creator', status: 'draft', createdAt: '2026-10-01', updatedAt,
  state: { activeProjectId: 'p1', activeProjectStatus: 'draft', assigneeIds: ['construction-a', 'sales-b'] }
});
function repo(existing, uid = 'editor', failure = null) {
  const writes = [];
  const firestore = {
    doc: (...args) => args.slice(1),
    runTransaction: async (_db, action) => {
      if (failure) throw failure;
      return action({
        get: async () => ({ exists: () => !!existing, data: () => existing }),
        set: (path, value) => writes.push({ path, value })
      });
    }
  };
  return { writes, ...load('lib/project-repository.ts', {
    'firebase/firestore': firestore,
    './firebase-client': { getFirestoreDb: () => ({}), getCurrentFirebaseUser: async () => uid ? ({ uid }) : null }
  }) };
}
test('new shared project uses top-level path and authenticated creator', async () => {
  const repository = repo(null);
  const saved = await repository.saveSharedProject('editor', { project: record(), baseUpdatedAt: null });
  assert.deepEqual([...repository.writes[0].path], ['estimate_projects', 'p1']);
  assert.equal(saved.ownerId, 'editor');
  assert.deepEqual([...saved.state.assigneeIds], ['construction-a', 'sales-b']);
});
test('another staff member can update without changing creator or creation date', async () => {
  const existing = record();
  const repository = repo(existing);
  const edited = { ...record('2026-10-28T02:00:00.000Z'), ownerId: 'editor', createdAt: 'wrong' };
  const saved = await repository.saveSharedProject('editor', { project: edited, baseUpdatedAt: existing.updatedAt });
  assert.equal(saved.ownerId, 'creator');
  assert.equal(saved.createdAt, existing.createdAt);
});
test('concurrent update rejects without overwriting shared project', async () => {
  const repository = repo(record('new-version'));
  await assert.rejects(repository.saveSharedProject('editor', { project: record(), baseUpdatedAt: 'old-version' }), /他の端末/);
  assert.equal(repository.writes.length, 0);
});
test('deleted remote project is not accidentally recreated from stale offline edit', async () => {
  const repository = repo(null);
  await assert.rejects(repository.saveSharedProject('editor', { project: record(), baseUpdatedAt: 'old-version' }), /他の端末/);
  assert.equal(repository.writes.length, 0);
});
test('account switch and unauthenticated writes are rejected', async () => {
  for (const uid of [null, 'different-account']) {
    const repository = repo(null, uid);
    await assert.rejects(repository.saveSharedProject('editor', { project: record(), baseUpdatedAt: null }), /ログイン/);
    assert.equal(repository.writes.length, 0);
  }
});
test('server rejection propagates to sync error handler', async () => {
  const repository = repo(null, 'editor', new Error('permission-denied'));
  await assert.rejects(repository.saveSharedProject('editor', { project: record(), baseUpdatedAt: null }), /permission-denied/);
});
test('offline queue survives reload, is account scoped, and overlays remote data', () => {
  const data = new Map([['estimate_projects', JSON.stringify([record()])]]);
  const localStorage = { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) };
  const cache = load('lib/shared-project-cache.ts', {}, { localStorage });
  assert.equal(cache.readSharedCache('a').projects.length, 0, 'legacy personal data must not auto-upload');
  const pendingProject = record('2026-10-28T03:00:00.000Z');
  cache.writeSharedCache('a', { projects: [record()], staff: [], pending: { p1: { project: pendingProject, baseUpdatedAt: record().updatedAt } }, draft: pendingProject.state, draftBaseUpdatedAt: record().updatedAt });
  assert.equal(cache.readSharedCache('b').projects.length, 0);
  const restored = cache.readSharedCache('a');
  assert.equal(restored.pending.p1.baseUpdatedAt, record().updatedAt);
  assert.equal(restored.draftBaseUpdatedAt, record().updatedAt);
  assert.equal(cache.overlayPending(restored)[0].updatedAt, pendingProject.updatedAt);
});
test('storage quota errors are surfaced rather than reported as saved', () => {
  const cache = load('lib/shared-project-cache.ts', {}, { localStorage: { setItem: () => { throw new Error('quota'); } } });
  assert.throws(() => cache.writeSharedCache('a', {}), /quota/);
});
test('assignee buttons allow multiple people across departments and deselection', () => {
  let selected = ['construction-a'];
  const app = {
    state: { assigneeIds: selected },
    staff: [
      { id: 'construction-a', name: '施工A', department: 'construction', active: true },
      { id: 'sales-b', name: '営業B', department: 'sales', active: true },
      { id: 'new-person', name: '追加社員', active: true },
      { id: 'inactive', name: '停止社員', active: false }
    ],
    setAssigneeIds: ids => { selected = ids; app.state.assigneeIds = ids; }
  };
  const ui = load('components/AssigneeButtons.tsx', { '@/lib/WizardContext': { useApp: () => app } });
  function buttons(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(buttons);
    return [...(node.type === 'button' ? [node] : []), ...buttons(node.props?.children)];
  }
  const first = buttons(ui.AssigneeButtons());
  assert.equal(first.length, 3);
  first.find(button => button.key === 'sales-b').props.onClick();
  assert.deepEqual([...selected], ['construction-a', 'sales-b']);
  buttons(ui.AssigneeButtons()).find(button => button.key === 'construction-a').props.onClick();
  assert.deepEqual([...selected], ['sales-b']);
});

test('department and individual views include shared assignments and retain unassigned in all', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const staff = [
    { id: 'construction-a', name: '施工A', department: 'construction', active: true },
    { id: 'sales-b', name: '営業B', department: 'sales', active: true }
  ];
  const make = (name, assigneeIds) => ({ ...record(), id: name, name, state: { ...record().state, assigneeIds } });
  const app = { projects: [make('共同担当案件', ['construction-a','sales-b']), make('営業専任案件', ['sales-b']), make('担当未設定案件', [])], staff, pendingIds: [], hasUnsavedChanges: false };
  function render(department, person = null, search = '') {
    const states = [search, department, person];
    const component = load('components/screens/ProjectListScreen.tsx', {
      '@/lib/WizardContext': { useApp: () => app },
      react: { ...React, useState: () => [states.shift(), () => {}], useMemo: f => f() }
    });
    return renderToStaticMarkup(component.ProjectListScreen());
  }
  assert.match(render('all'), /担当未設定案件/);
  const construction = render('construction');
  assert.match(construction, /共同担当案件/);
  assert.doesNotMatch(construction, /営業専任案件|担当未設定案件/);
  assert.match(render('sales'), /共同担当案件/);
  assert.match(render('sales'), /営業専任案件/);
  assert.doesNotMatch(render('all', 'construction-a'), /営業専任案件|担当未設定案件/);
  assert.doesNotMatch(render('all', null, '営業専任'), /共同担当案件|担当未設定案件/);
});
test('retry after a lost acknowledgement does not create a false conflict', async () => {
  const project = { ...record(), clientSaveId: 'save-unique-id' };
  const repository = repo(project);
  const saved = await repository.saveSharedProject('editor', { project, baseUpdatedAt: 'previous-version' });
  assert.equal(saved.clientSaveId, 'save-unique-id');
  assert.equal(repository.writes.length, 0);
});
test('authentication waits for restored session and never creates an anonymous user', async () => {
  let ready = false;
  const auth = { currentUser: null, authStateReady: async () => { ready = true; auth.currentUser = { uid: 'restored', isAnonymous: false }; } };
  const client = load('lib/firebase-client.ts', {
    'firebase/app': { getApps: () => [{}] },
    'firebase/auth': { initializeAuth: () => auth },
    'firebase/firestore': {}
  }, { process: { env: { NEXT_PUBLIC_FIREBASE_API_KEY: 'test', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test', NEXT_PUBLIC_FIREBASE_APP_ID: 'test' } } });
  assert.equal((await client.getCurrentFirebaseUser()).uid, 'restored');
  assert.equal(ready, true);
  auth.authStateReady = async () => { auth.currentUser = { uid: 'anonymous', isAnonymous: true }; };
  assert.equal(await client.getCurrentFirebaseUser(), null);
});
test('login explicitly persists the account locally before opening Google sign-in', async () => {
  const calls = [];
  const auth = {};
  const client = load('lib/firebase-client.ts', {
    'firebase/app': { getApps: () => [{}] },
    'firebase/auth': { initializeAuth: () => auth, browserLocalPersistence: 'local', GoogleAuthProvider: class {},
      setPersistence: async (_auth, type) => calls.push(type), signInWithPopup: async () => { calls.push('signin'); return { user: { uid: 'staff' } }; } },
    'firebase/firestore': {}
  }, { process: { env: { NEXT_PUBLIC_FIREBASE_API_KEY: 'test', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test', NEXT_PUBLIC_FIREBASE_APP_ID: 'test' } } });
  assert.equal((await client.signInWithGoogle()).uid, 'staff');
  assert.deepEqual(calls, ['local','signin']);
});

function emailClient({ storageBlocked = false, persistenceBlocked = false, lateStorageFailure = false, signInError = null } = {}) {
  const calls = [];
  const data = new Map([['existing-draft', 'keep']]);
  const storage = {
    setItem: (key, value) => { if (storageBlocked) throw new Error('storage denied'); data.set(key, value); },
    getItem: key => data.get(key), removeItem: key => data.delete(key)
  };
  let options;
  const auth = { currentUser: null };
  const client = load('lib/firebase-client.ts', {
    'firebase/app': { getApps: () => [{}] },
    'firebase/auth': {
      initializeAuth: (_app, config) => { options = config; return auth; }, browserSessionPersistence: "session", inMemoryPersistence: "memory", browserLocalPersistence: 'local', indexedDBLocalPersistence: 'indexeddb',
      setPersistence: async (_auth, type) => { calls.push(type); if (persistenceBlocked) throw new Error('storage unavailable'); },
      updateCurrentUser: async (_auth, user) => { calls.push("publish"); auth.currentUser = user; },
      signInWithEmailAndPassword: async (_auth, email, password) => {
        calls.push(['signin', email, password]);
        if (signInError) throw signInError;
        if (lateStorageFailure) {
          auth.currentUser = { uid: "existing-staff" };
          throw Object.assign(new Error("sensitive detail"), { name: "QuotaExceededError" });
        }
        return { user: { uid: 'existing-staff' } };
      }
    }, 'firebase/firestore': {}
  }, { window: { localStorage: storage }, process: { env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'test', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test', NEXT_PUBLIC_FIREBASE_APP_ID: 'test'
  } } });
  return { client, calls, data, getOptions: () => options };
}

test('blocked localStorage does not prevent email authentication', async () => {
  const { client, calls, data, getOptions } = emailClient({ storageBlocked: true, persistenceBlocked: true });
  assert.equal((await client.signInWithEmail('staff@example.test', 'secret')).uid, 'existing-staff');
  assert.deepEqual(calls, [['signin', 'staff@example.test', 'secret']]);
  assert.deepEqual([...data], [['existing-draft', 'keep']]);
  assert.deepEqual([...getOptions().persistence], ['indexeddb', 'local', 'session', 'memory']);
});

test('a failed session write after authentication falls back without submitting credentials twice', async () => {
  const { client, calls } = emailClient({ lateStorageFailure: true });
  assert.equal((await client.signInWithEmail('staff@example.test', 'secret')).uid, 'existing-staff');
  assert.deepEqual(calls, [['signin', 'staff@example.test', 'secret'], 'memory', 'publish']);
  assert.match(client.describeAuthError({ name: 'QuotaExceededError', message: 'sensitive detail' }), /auth\/storage-failed/);
  assert.doesNotMatch(client.describeAuthError(new Error('sensitive detail')), /sensitive detail/);
});

test('credential and network failures propagate, explain the stage, and permit retry', async () => {
  for (const [code, message] of [['auth/invalid-credential', /パスワード/], ['auth/network-request-failed', /通信状態/]]) {
    const { client, calls } = emailClient({ signInError: { code } });
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(client.signInWithEmail('staff@example.test', 'secret'), error => {
        assert.match(client.describeAuthError(error), message);
        return true;
      });
    }
    assert.equal(calls.filter(call => Array.isArray(call)).length, 2);
  }
});

test('single large login button submits credentials and blocks duplicates until completion', async () => {
  const React = require('react');
  const states = [];
  const refs = [];
  let stateIndex = 0, refIndex = 0, submissions = 0, finish;
  const app = {
    state: { currentStep: 7 }, authReady: true, authUser: null, authError: null, pendingIds: [],
    loginWithEmail: () => { submissions++; return new Promise(resolve => { finish = resolve; }); }
  };
  const ui = load('components/EmailLoginForm.tsx', {
    '@/lib/WizardContext': { useApp: () => app },
    react: { ...React,
      useEffect: () => {},
      useState: initial => { const i = stateIndex++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
      useRef: initial => { const i = refIndex++; return refs[i] ??= { current: initial }; }
    }
  });
  const render = () => { stateIndex = refIndex = 0; return ui.EmailLoginForm({ children: controls => [controls.inputs, controls.button, controls.feedback] }); };
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  const initial = nodes(render());
  const trigger = initial.find(node => node.type === 'button' && node.props.type === 'submit');
  assert.equal(trigger.props.children, 'ログイン');
  assert.equal(initial.filter(node => node.type === 'button' && node.props.type === 'submit').length, 1);
  assert.equal(initial.some(node => node.type === 'button' && node.props.children === '新規登録'), false);
  assert.match(trigger.props.className, /h-\[60px\] w-\[280px\] max-w-full/);
  const opened = nodes(render());
  opened.find(node => node.type === 'input' && node.props.type === 'email').props.onChange({ target: { value: 'staff@example.test' } });
  opened.find(node => node.type === 'input' && node.props.type === 'password').props.onChange({ target: { value: 'secret' } });
  const form = nodes(render()).find(node => node.type === 'form');
  form.props.onSubmit({ preventDefault() {} });
  form.props.onSubmit({ preventDefault() {} });
  assert.equal(submissions, 1);
  assert.equal(nodes(render()).find(node => node.type === 'button' && node.props.type === 'submit').props.disabled, true);
  finish();
  await new Promise(resolve => setImmediate(resolve));
  const retried = nodes(render()).find(node => node.type === 'form');
  retried.props.onSubmit({ preventDefault() {} });
  assert.equal(submissions, 2);
  finish();
});

test('GAS variants reuse direct-child assignee folders under a lock without touching existing files', () => {
  for (const file of fs.readdirSync('scripts/gas').filter(name => name.endsWith('.gs'))) {
    const folders = new Map();
    let held = false, created = 0;
    const parent = {
      getFoldersByName: name => {
        assert.equal(held, true);
        return { hasNext: () => folders.has(name), next: () => folders.get(name) };
      },
      createFolder: name => { assert.equal(held, true); created++; const folder = { name }; folders.set(name, folder); return folder; }
    };
    const context = {
      DriveApp: { getFolderById: id => { assert.equal(id, '1oUKD65onJYeZWqfoeTdWuEhzr-3TE216'); return parent; } },
      LockService: { getScriptLock: () => ({ waitLock: () => { held = true; }, releaseLock: () => { held = false; } }) }
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(`scripts/gas/${file}`, 'utf8'), context);
    const first = context.assigneeFolder_('1oUKD65onJYeZWqfoeTdWuEhzr-3TE216', { assigneeName: '豪志' });
    assert.equal(context.assigneeFolder_('1oUKD65onJYeZWqfoeTdWuEhzr-3TE216', { assigneeName: '豪志' }), first);
    assert.equal(created, 1, file);
    assert.equal(held, false);
    assert.throws(() => context.assigneeFolder_('parent', {}), /担当者名/);
    parent.getFoldersByName = () => { throw new Error('Drive offline'); };
    assert.throws(() => context.assigneeFolder_('1oUKD65onJYeZWqfoeTdWuEhzr-3TE216', { assigneeName: '豪志' }), /offline/);
    assert.equal(held, false, 'lock must be released after a Drive error');
  }
});

test('export API uses the saved first assignee and keeps legacy multiple assignments', async () => {
  const requests = [];
  const route = load('app/api/export-quote/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200 }) } }
  }, {
    process: { env: {} }, console, AbortSignal,
    fetch: async (url, init) => {
      if (!init.body) return { ok: true, json: async () => ({ protocolVersion: 'quote-export-v2' }) };
      const payload = JSON.parse(init.body); requests.push(payload);
      return { ok: true, json: async () => ({ ok: true, protocolVersion: 'quote-export-v2', requestId: payload.requestId, spreadsheetId: 'new-quote-123' }) };
    }
  });
  const state = { activeProjectId: 'saved-project', projectName: '案件名', selectedWorkItems: [], assigneeIds: ['go', 'ozoe'], assigneeNames: { go: '豪志', ozoe: '尾添' } };
  const original = JSON.stringify(state);
  for (let i = 0; i < 2; i++) assert.equal((await route.POST({ json: async () => state })).status, 200);
  assert.equal(requests[0].assigneeName, '豪志');
  assert.deepEqual([...requests[1].assigneeIds], ['go', 'ozoe']);
  assert.equal(JSON.stringify(state), original);
  assert.equal((await route.POST({ json: async () => ({ ...state, assigneeIds: [] }) })).status, 400);
  assert.equal(requests.length, 2, 'no export request without a saved assignee');
});

test('new projects inherit the chosen individual, further new projects retain it, and loaded assignments survive', () => {
  const React = require('react');
  const values = [], refs = [], setters = [];
  let index = 0, refIndex = 0;
  const alerts = [];
  const existing = { ...record(), state: { ...record().state, assigneeIds: ['legacy-a', 'legacy-b'] } };
  const empty = () => ({ currentStep: 0, assigneeIds: [], activeProjectId: null, selectedWorkItems: [] });
  const context = load('lib/WizardContext.tsx', {
    react: { ...React, useEffect: () => {}, useCallback: fn => fn, useMemo: fn => fn(),
      useState: initial => { const i = index++; if (!(i in values)) values[i] = initial; setters[i] = v => { values[i] = typeof v === 'function' ? v(values[i]) : v; }; return [values[i], setters[i]]; },
      useRef: initial => { const i = refIndex++; return refs[i] ??= { current: initial?.pending ? { ...initial, projects: [existing] } : initial }; }
    },
    './store': { initialState: empty, newEstimateState: empty, isBlankEstimate: () => false, PROJECT_LIST_STEP: 7 },
    './project-repository': {}, './firebase-client': {},
    './shared-project-cache': { overlayPending: cache => cache.projects }
  }, { window: { alert: message => alerts.push(message) } });
  const render = () => { index = refIndex = 0; return context.AppProvider({ children: null }).props.value; };
  render();
  setters[6]([{ id: 'go', name: '豪志', active: true }]);
  render().startNewProject();
  assert.equal(alerts.length, 1);
  render().startNewProject('go');
  assert.deepEqual([...render().state.assigneeIds], ['go']);
  assert.equal(render().state.assigneeNames.go, '豪志');
  render().startNewProject();
  assert.deepEqual([...render().state.assigneeIds], ['go']);
  render().loadProject('p1');
  assert.deepEqual([...render().state.assigneeIds], ['legacy-a', 'legacy-b']);
  render().resetCurrentEstimate();
  assert.deepEqual([...render().state.assigneeIds], ['legacy-a', 'legacy-b']);
  render().startNewProject();
  assert.deepEqual([...render().state.assigneeIds], ['go']);
});
