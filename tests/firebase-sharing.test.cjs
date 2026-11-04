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
    'firebase/auth': { getAuth: () => auth },
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
    'firebase/auth': { getAuth: () => auth, browserLocalPersistence: 'local', GoogleAuthProvider: class {},
      setPersistence: async (_auth, type) => calls.push(type), signInWithPopup: async () => { calls.push('signin'); return { user: { uid: 'staff' } }; } },
    'firebase/firestore': {}
  }, { process: { env: { NEXT_PUBLIC_FIREBASE_API_KEY: 'test', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test', NEXT_PUBLIC_FIREBASE_APP_ID: 'test' } } });
  assert.equal((await client.signInWithGoogle()).uid, 'staff');
  assert.deepEqual(calls, ['local','signin']);
});

function emailClient({ storageBlocked = false, persistenceBlocked = false, signInError = null } = {}) {
  const calls = [];
  const data = new Map([['existing-draft', 'keep']]);
  const storage = {
    setItem: (key, value) => { if (storageBlocked) throw new Error('storage denied'); data.set(key, value); },
    getItem: key => data.get(key), removeItem: key => data.delete(key)
  };
  const client = load('lib/firebase-client.ts', {
    'firebase/app': { getApps: () => [{}] },
    'firebase/auth': {
      getAuth: () => ({}), browserLocalPersistence: 'local', indexedDBLocalPersistence: 'indexeddb',
      setPersistence: async (_auth, type) => { calls.push(type); if (persistenceBlocked) throw new Error('storage unavailable'); },
      signInWithEmailAndPassword: async (_auth, email, password) => {
        calls.push(['signin', email, password]);
        if (signInError) throw signInError;
        return { user: { uid: 'existing-staff' } };
      }
    }, 'firebase/firestore': {}
  }, { window: { localStorage: storage }, process: { env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'test', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test', NEXT_PUBLIC_FIREBASE_APP_ID: 'test'
  } } });
  return { client, calls, data };
}

test('email login uses existing credentials after durable persistence and preserves draft data', async () => {
  const { client, calls, data } = emailClient();
  assert.equal((await client.signInWithEmail('staff@example.test', 'secret')).uid, 'existing-staff');
  assert.deepEqual(calls, ['local', ['signin', 'staff@example.test', 'secret']]);
  assert.deepEqual([...data], [['existing-draft', 'keep']]);
});

test('blocked localStorage falls back to IndexedDB before email authentication', async () => {
  const { client, calls } = emailClient({ storageBlocked: true });
  await client.signInWithEmail('staff@example.test', 'secret');
  assert.deepEqual(calls, ['indexeddb', ['signin', 'staff@example.test', 'secret']]);
});

test('persistence failure prevents credential submission and explains recovery', async () => {
  const { client, calls } = emailClient({ persistenceBlocked: true });
  await assert.rejects(client.signInWithEmail('staff@example.test', 'secret'), error => {
    assert.equal(error.code, 'auth/persistence-unavailable');
    assert.match(client.describeAuthError(error), /空き容量/);
    return true;
  });
  assert.deepEqual(calls, ['local', 'indexeddb']);
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

test('login button opens the existing email form and duplicate submissions are blocked until completion', async () => {
  const React = require('react');
  const states = [];
  const refs = [];
  let stateIndex = 0, refIndex = 0, submissions = 0, finish;
  const app = {
    state: { currentStep: 7 }, authReady: true, authUser: null, authError: null, pendingIds: [],
    loginWithEmail: () => { submissions++; return new Promise(resolve => { finish = resolve; }); }
  };
  const ui = load('components/AuthControls.tsx', {
    '@/lib/WizardContext': { useApp: () => app },
    react: { ...React,
      useEffect: () => {},
      useState: initial => { const i = stateIndex++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
      useRef: initial => { const i = refIndex++; return refs[i] ??= { current: initial }; }
    }
  });
  let showEmailForm = false;
  const containerMocks = {
    '@/lib/WizardContext': { useApp: () => app },
    '@/lib/store': { PROJECT_LIST_STEP: 7 },
    './AuthControls': ui,
    react: { ...React, useState: () => [showEmailForm, value => { showEmailForm = typeof value === 'function' ? value(showEmailForm) : value; }] }
  };
  for (const [, name, path] of fs.readFileSync('components/WizardContainer.tsx', 'utf8').matchAll(/import \{ (\w+) \} from "([^"]+)";/g)) {
    if (!(path in containerMocks) && path !== 'react') containerMocks[path] = { [name]: () => null };
  }
  const container = load('components/WizardContainer.tsx', containerMocks);
  const render = () => { stateIndex = refIndex = 0; return ui.AuthControls({ showEmailForm }); };
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  const initial = nodes(render());
  assert.equal(initial.some(node => node.type === 'form'), false);
  assert.equal(initial.some(node => node.props?.children === 'Googleログイン'), false);
  assert.equal(initial.some(node => node.type === 'button' && node.props['aria-controls'] === 'email-login-form'), false);
  const trigger = nodes(container.WizardContainer()).find(node => node.type === 'button' && node.props['aria-controls'] === 'email-login-form');
  assert.equal(trigger.props.children, 'ログイン');
  assert.match(trigger.props.className, /h-\[60px\] w-\[280px\] max-w-full/);
  trigger.props.onClick();
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
