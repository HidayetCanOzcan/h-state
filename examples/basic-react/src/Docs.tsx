import './styles.css';
import { useState } from 'react';

interface DocsProps {
  onBack: () => void;
}

export function Docs({ onBack }: DocsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="docs-page">
      {/* Floating Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      {/* Header */}
      <header className="docs-header">
        <div className="container">
          <button onClick={onBack} className="back-btn">
            ← Back to Home
          </button>
          <h1 className="docs-logo">h-state <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>docs</span></h1>
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <nav className="docs-nav">
            <a href="#installation" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Installation</a>
            <a href="#quick-start" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Quick Start</a>
            <a href="#basic-usage" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Basic Usage</a>
            <a href="#nested-objects" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Nested Objects</a>
            <a href="#arrays" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Arrays</a>
            <a href="#methods" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Methods</a>
            <a href="#persistence" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Persistence</a>
            <a href="#batch" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Batch Updates</a>
            <a href="#typescript" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>TypeScript</a>
            <a href="#nextjs" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Next.js / SSR</a>
            <a href="#examples" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Examples</a>
            <a href="#best-practices" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Best Practices</a>
            <a href="#migration" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>Migration Guide</a>
            <a href="#faq" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <a href="#api" className="docs-nav-link" onClick={() => setMobileMenuOpen(false)}>API Reference</a>
          </nav>
        </div>
      )}

      {/* Sidebar + Content */}
      <div className="docs-layout container">
        <aside className="docs-sidebar">
          <nav className="docs-nav">
            <span className="docs-nav-label">Getting Started</span>
            <a href="#installation" className="docs-nav-link">Installation</a>
            <a href="#quick-start" className="docs-nav-link">Quick Start</a>
            
            <span className="docs-nav-label">Core Concepts</span>
            <a href="#basic-usage" className="docs-nav-link">Basic Usage</a>
            <a href="#nested-objects" className="docs-nav-link">Nested Objects</a>
            <a href="#arrays" className="docs-nav-link">Arrays</a>
            <a href="#methods" className="docs-nav-link">Methods</a>
            
            <span className="docs-nav-label">Advanced</span>
            <a href="#subscriptions" className="docs-nav-link">Subscriptions</a>
            <a href="#time-travel" className="docs-nav-link">Time Travel</a>
            <a href="#cross-tab" className="docs-nav-link">Cross-Tab Sync</a>
            <a href="#transactions" className="docs-nav-link">Transactions</a>
            <a href="#persistence" className="docs-nav-link">Persistence</a>
            <a href="#batch" className="docs-nav-link">Batch Updates</a>
            <a href="#typescript" className="docs-nav-link">TypeScript</a>
            <a href="#nextjs" className="docs-nav-link">Next.js / SSR</a>
            
            <span className="docs-nav-label">Guides</span>
            <a href="#examples" className="docs-nav-link">Examples</a>
            <a href="#best-practices" className="docs-nav-link">Best Practices</a>
            <a href="#migration" className="docs-nav-link">Migration Guide</a>
            <a href="#faq" className="docs-nav-link">FAQ</a>
            
            <span className="docs-nav-label">Reference</span>
            <a href="#api" className="docs-nav-link">API Reference</a>
          </nav>
        </aside>

        <main className="docs-content">
          {/* Installation */}
          <section id="installation" className="docs-section">
            <h2>Installation</h2>
            <p>Install h-state using your favorite package manager:</p>
            <div className="code-block">
              <code>npm install h-state</code>
            </div>
            <p>Or with yarn/pnpm/bun:</p>
            <div className="code-block">
              <code>yarn add h-state</code><br/>
              <code>pnpm add h-state</code><br/>
              <code>bun add h-state</code>
            </div>
          </section>

          {/* Quick Start */}
          <section id="quick-start" className="docs-section">
            <h2>Quick Start</h2>
            <p>Create a store in 3 simple steps:</p>
            
            <h3>1. Create your store</h3>
            <div className="code-block">
              <pre>{`import { createStore } from 'h-state';

const { useStore } = createStore(
  // Initial state
  {
    count: 0,
    user: { name: 'John', age: 25 }
  },
  // Methods
  {
    increment: (store) => () => {
      store.count++;
    },
    setUser: (store) => (name: string) => {
      store.user.name = name;
    }
  }
);

export { useStore };`}</pre>
            </div>

            <h3>2. Use in your component</h3>
            <div className="code-block">
              <pre>{`import { useStore } from './store';

function Counter() {
  const store = useStore();

  return (
    <div>
      <p>Count: {store.count}</p>
      <button onClick={() => store.count++}>
        Increment
      </button>
    </div>
  );
}`}</pre>
            </div>

            <h3>3. That's it! 🎉</h3>
            <p>No providers, no reducers, no actions. Just direct mutations.</p>
          </section>

          {/* Basic Usage */}
          <section id="basic-usage" className="docs-section">
            <h2>Basic Usage</h2>
            <p>
              h-state allows you to mutate state directly. When you change a value,
              all components using the store automatically re-render.
            </p>
            <div className="code-block">
              <pre>{`const store = useStore();

// Direct mutation - triggers re-render
store.count = 10;

// Increment/decrement
store.count++;
store.count--;

// Any assignment works
store.name = "Jane";
store.isActive = true;`}</pre>
            </div>
          </section>

          {/* Nested Objects */}
          <section id="nested-objects" className="docs-section">
            <h2>Nested Objects</h2>
            <p>
              Deep mutations work automatically. No need for spread operators
              or immutable update patterns.
            </p>
            <div className="code-block">
              <pre>{`// This just works™
store.user.name = "Jane";
store.user.profile.bio = "Hello!";
store.settings.theme.colors.primary = "#6366f1";

// All trigger reactivity automatically`}</pre>
            </div>
            <div className="info-box">
              <strong>💡 Tip:</strong> Nested objects are wrapped in reactive proxies
              automatically. You don't need to do anything special.
            </div>
          </section>

          {/* Arrays */}
          <section id="arrays" className="docs-section">
            <h2>Arrays</h2>
            <p>
              Since v2.2, array mutation methods are tracked automatically — no Proxy, and{' '}
              <code>Array.isArray</code> stays <code>true</code>. Nested mutations on elements
              (including freshly inserted ones) re-render too.
            </p>
            <div className="code-block">
              <pre>{`// Tracked methods: push, pop, shift, unshift,
// splice, sort, reverse, fill, copyWithin
store.todos.push({ text, done: false }); // ✅ re-render
store.todos.splice(i, 1);                 // ✅
store.todos.sort(byName);                 // ✅
store.todos[i].done = true;               // ✅ nested element

// Immutable reassignment still works too
store.todos = [...store.todos, newTodo];  // ✅`}</pre>
            </div>
            <p style={{ marginTop: '1rem' }}>
              <strong>Proxy-free limitation:</strong> direct index assignment and length writes
              are NOT tracked — use <code>splice</code> or reassign instead:
            </p>
            <div className="code-block">
              <pre>{`store.todos[0] = item;   // ❌ not tracked
store.todos.length = 0;  // ❌ not tracked

store.todos.splice(0, 1, item); // ✅ use this
store.todos = [];               // ✅ or reassign`}</pre>
            </div>
          </section>

          {/* Subscriptions */}
          <section id="subscriptions" className="docs-section">
            <h2>Subscriptions (outside React)</h2>
            <p>
              <code>createStore</code> returns the live <code>store</code> alongside{' '}
              <code>useStore</code>, so you can read and react to state outside components —
              loggers, WebSocket/IndexedDB bridges, effects, and tests.
            </p>
            <div className="code-block">
              <pre>{`const { useStore, store } = createStore(/* … */);

// Plain, non-reactive deep snapshot (state keys only)
store.$getState();

// Fire on ANY change — receives next + previous snapshots
const unsub = store.$subscribe((next, prev) => {
  console.log(prev.count, '→', next.count);
});

// Fire only when a derived slice changes
const stop = store.$subscribeWithSelector(
  (s) => s.user.name,
  (name, prevName) => console.log(prevName, '→', name),
  // optional equalityFn (defaults to Object.is)
);

unsub();
stop();`}</pre>
            </div>
            <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>
              <li><code>$getState()</code> reads through the reactive layer, so nested mutations are reflected.</li>
              <li>Subscriptions are batch-aware: inside <code>batch(...)</code> listeners fire once per flush.</li>
              <li>Both subscribe methods return an unsubscribe function.</li>
            </ul>
          </section>

          {/* Time Travel */}
          <section id="time-travel" className="docs-section">
            <h2>Time Travel (undo / redo)</h2>
            <p>
              Opt in with the 4th <code>createStore</code> argument and get undo/redo with no extra
              libraries. History is <strong>off by default</strong> (zero overhead).
            </p>
            <div className="code-block">
              <pre>{`const { useStore, store } = createStore(
  { text: '', items: [] },
  {
    setText: (s) => (t) => { s.text = t; },
    addItem: (s) => (i) => { s.items.push(i); },
  },
  undefined,             // persistOptions (3rd arg)
  { history: true },     // 👈 enable time travel (or { history: { limit: 50 } })
);

store.$undo();   // step back  → boolean
store.$redo();   // step forward → boolean
store.$history(); // { canUndo, canRedo, past, future }
store.$clearHistory();`}</pre>
            </div>
            <p style={{ marginTop: '1rem' }}>Wire it to buttons in React:</p>
            <div className="code-block">
              <pre>{`function Editor() {
  const store = useStore();
  const { canUndo, canRedo } = store.$history();
  return (
    <>
      <input value={store.text} onChange={(e) => store.setText(e.target.value)} />
      <button disabled={!canUndo} onClick={store.$undo}>Undo</button>
      <button disabled={!canRedo} onClick={store.$redo}>Redo</button>
    </>
  );
}`}</pre>
            </div>
            <div className="info-box">
              <strong>💡 Tip:</strong> each committed change records one snapshot. Group multiple
              mutations with <code>batch(...)</code> so an action becomes a single undo step. A new
              change after an undo clears the redo stack (linear history).
            </div>
          </section>

          {/* Cross-Tab Sync */}
          <section id="cross-tab" className="docs-section">
            <h2>Cross-Tab Sync</h2>
            <p>
              Keep state consistent across every open tab/window with one option — powered by the
              browser's <code>BroadcastChannel</code>, no server required.
            </p>
            <div className="code-block">
              <pre>{`const { useStore, store } = createStore(
  { theme: 'dark', cart: [] },
  {
    setTheme: (s) => (t) => { s.theme = t; },
    addToCart: (s) => (id) => { s.cart.push(id); },
  },
  undefined,             // persistOptions (3rd arg)
  { syncTabs: true },    // 👈 sync across tabs (or { syncTabs: { channel: 'my-app' } })
);

// Change in tab A → instantly reflected in tab B, C…
store.addToCart('sku-1');

store.$destroy(); // close the channel when done`}</pre>
            </div>
            <div className="info-box">
              <strong>💡 Tip:</strong> the channel name defaults to your persistence <code>key</code>
              (or <code>"h-state"</code>). Remote updates are applied without re-broadcasting (no
              feedback loops) and don't pollute undo history. Combine with persistence so a fresh
              tab loads the last state, then stays live via sync. Safe no-op on SSR / unsupported browsers.
            </div>
          </section>

          {/* Atomic Transactions */}
          <section id="transactions" className="docs-section">
            <h2>Atomic Transactions</h2>
            <p>
              Run a group of mutations as a single unit with <code>$transaction(fn)</code>. If the
              callback throws, <strong>every change is rolled back</strong> to the pre-transaction
              state — no half-applied updates.
            </p>
            <div className="code-block">
              <pre>{`try {
  const total = store.$transaction(() => {
    store.balance -= amount;        // debit
    store.history.push({ amount }); // log
    if (store.balance < 0) {
      throw new Error('Insufficient funds'); // 👈 full rollback
    }
    return store.balance;
  });
  console.log('New balance:', total);
} catch (err) {
  // state is exactly as before the transaction
}`}</pre>
            </div>
            <div className="info-box">
              <strong>💡 Tip:</strong> on success all writes commit as one re-render and one undo
              step (with <code>{'{ history: true }'}</code>). On failure the original error is
              re-thrown after rollback. Nested transactions are supported — an inner rollback won't
              undo the outer one.
            </div>
          </section>

          {/* Methods */}
          <section id="methods" className="docs-section">
            <h2>Methods</h2>
            <p>
              Define methods in the second argument of createStore.
              Methods receive the store and return a function.
            </p>
            <div className="code-block">
              <pre>{`const { useStore } = createStore(
  { count: 0 },
  {
    // Simple method
    increment: (store) => () => {
      store.count++;
    },
    
    // Method with arguments
    add: (store) => (amount: number) => {
      store.count += amount;
    },
    
    // Async method
    fetchData: (store) => async () => {
      const data = await api.getData();
      store.data = data;
    },
    
    // Computed value (getter)
    doubled: (store) => store.count * 2
  }
);

// Usage
store.increment();
store.add(5);
await store.fetchData();
console.log(store.doubled); // computed`}</pre>
            </div>
          </section>

          {/* Persistence */}
          <section id="persistence" className="docs-section">
            <h2>Persistence</h2>
            <p>
              Enable localStorage persistence with a simple config:
            </p>
            <div className="code-block">
              <pre>{`const { useStore } = createStore(
  { count: 0, user: { name: '' } },
  { /* methods */ },
  {
    enabled: true,
    key: 'my-app-state',    // localStorage key
    debounce: 300,          // ms delay before saving
  }
);

// State is automatically saved and restored!

// Manual controls
store.$persist();      // Force save now
store.$clearPersist(); // Clear saved data`}</pre>
            </div>
            <div className="info-box">
              <strong>🔧 Advanced:</strong> Custom serialization is supported
              via <code>serialize</code> and <code>deserialize</code> options.
            </div>
          </section>

          {/* Batch */}
          <section id="batch" className="docs-section">
            <h2>Batch Updates</h2>
            <p>
              Multiple mutations in a single re-render with <code>batch()</code>:
            </p>
            <div className="code-block">
              <pre>{`import { batch } from 'h-state';

// Without batch: 3 re-renders
store.count = 1;
store.name = "Jane";
store.active = true;

// With batch: 1 re-render
batch(() => {
  store.count = 1;
  store.name = "Jane";
  store.active = true;
});`}</pre>
            </div>
          </section>

          {/* TypeScript */}
          <section id="typescript" className="docs-section">
            <h2>TypeScript</h2>
            <p>
              Full TypeScript support with automatic type inference:
            </p>
            <div className="code-block">
              <pre>{`interface AppState {
  count: number;
  user: {
    name: string;
    age: number;
  };
}

interface AppMethods {
  increment: () => void;
  setName: (name: string) => void;
}

const { useStore } = createStore<AppState, AppMethods>(
  {
    count: 0,
    user: { name: '', age: 0 }
  },
  {
    increment: (store) => () => store.count++,
    setName: (store) => (name) => store.user.name = name
  }
);

// Full autocomplete and type checking!`}</pre>
            </div>
          </section>

          {/* API Reference */}
          <section id="api" className="docs-section">
            <h2>API Reference</h2>
            
            <h3>createStore(initialState, methods, options?)</h3>
            <p>Creates a new store instance.</p>
            <div className="api-table">
              <div className="api-row">
                <code>initialState</code>
                <span>Object with initial values</span>
              </div>
              <div className="api-row">
                <code>methods</code>
                <span>Object with method creators</span>
              </div>
              <div className="api-row">
                <code>options.enabled</code>
                <span>Enable persistence (default: false)</span>
              </div>
              <div className="api-row">
                <code>options.key</code>
                <span>localStorage key</span>
              </div>
              <div className="api-row">
                <code>options.debounce</code>
                <span>Debounce delay in ms</span>
              </div>
            </div>

            <h3>Store Methods</h3>
            <div className="api-table">
              <div className="api-row">
                <code>store.$update()</code>
                <span>Force re-render</span>
              </div>
              <div className="api-row">
                <code>store.$merge(partial)</code>
                <span>Merge partial state</span>
              </div>
              <div className="api-row">
                <code>store.$persist()</code>
                <span>Force save to storage</span>
              </div>
              <div className="api-row">
                <code>store.$clearPersist()</code>
                <span>Clear persisted data</span>
              </div>
            </div>

            <h3>batch(fn)</h3>
            <p>Execute multiple mutations in a single re-render.</p>
          </section>

          {/* Next.js / SSR */}
          <section id="nextjs" className="docs-section">
            <h2>Next.js / SSR</h2>
            <p>
              h-state works with Next.js and server-side rendering. Here's how to set it up:
            </p>

            <h3>App Router (Next.js 13+)</h3>
            <div className="code-block">
              <pre>{`// store.ts
'use client'; // Mark as client component

import { createStore } from 'h-state';

export const { useStore } = createStore(
  { count: 0 },
  { increment: (store) => () => store.count++ }
);`}</pre>
            </div>

            <div className="code-block">
              <pre>{`// page.tsx
'use client';

import { useStore } from './store';

export default function Page() {
  const store = useStore();
  return <button onClick={() => store.count++}>{store.count}</button>;
}`}</pre>
            </div>

            <h3>Pages Router</h3>
            <div className="code-block">
              <pre>{`// Works the same way, just import and use
import { useStore } from '../store';

export default function Page() {
  const store = useStore();
  return <div>{store.count}</div>;
}`}</pre>
            </div>

            <div className="info-box">
              <strong>⚠️ Note:</strong> h-state stores are client-side only. 
              For SSR, the initial state will be used on the server, 
              and persisted state (if any) will be restored on hydration.
            </div>
          </section>

          {/* Examples */}
          <section id="examples" className="docs-section">
            <h2>Examples</h2>
            <p>Real-world examples to get you started:</p>

            <h3>Shopping Cart</h3>
            <div className="code-block">
              <pre>{`interface CartState {
  items: Array<{ id: string; name: string; price: number; qty: number }>;
  discount: number;
}

interface CartMethods {
  addItem: (item: Omit<CartState['items'][0], 'qty'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  total: number;
  itemCount: number;
}

const { useStore } = createStore<CartState, CartMethods>(
  { items: [], discount: 0 },
  {
    addItem: (store) => (item) => {
      const existing = store.items.find(i => i.id === item.id);
      if (existing) {
        store.items = store.items.map(i => 
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        store.items = [...store.items, { ...item, qty: 1 }];
      }
    },
    removeItem: (store) => (id) => {
      store.items = store.items.filter(i => i.id !== id);
    },
    updateQty: (store) => (id, qty) => {
      store.items = store.items.map(i => 
        i.id === id ? { ...i, qty } : i
      );
    },
    total: (store) => {
      const subtotal = store.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      return subtotal * (1 - store.discount);
    },
    itemCount: (store) => store.items.reduce((sum, i) => sum + i.qty, 0),
  },
  { enabled: true, key: 'cart' }
);`}</pre>
            </div>

            <h3>Authentication Store</h3>
            <div className="code-block">
              <pre>{`interface AuthState {
  user: { id: string; email: string; name: string } | null;
  token: string | null;
  loading: boolean;
}

interface AuthMethods {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const { useStore: useAuth } = createStore<AuthState, AuthMethods>(
  { user: null, token: null, loading: false },
  {
    login: (store) => async (email, password) => {
      store.loading = true;
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        store.user = data.user;
        store.token = data.token;
      } finally {
        store.loading = false;
      }
    },
    logout: (store) => () => {
      store.user = null;
      store.token = null;
    },
    isAuthenticated: (store) => store.user !== null,
  },
  { enabled: true, key: 'auth' }
);`}</pre>
            </div>

            <h3>Form State</h3>
            <div className="code-block">
              <pre>{`const { useStore: useForm } = createStore(
  {
    values: { name: '', email: '', message: '' },
    errors: {} as Record<string, string>,
    touched: {} as Record<string, boolean>,
    submitting: false,
  },
  {
    setField: (store) => (field: string, value: string) => {
      store.values = { ...store.values, [field]: value };
      store.touched = { ...store.touched, [field]: true };
    },
    setError: (store) => (field: string, error: string) => {
      store.errors = { ...store.errors, [field]: error };
    },
    reset: (store) => () => {
      store.values = { name: '', email: '', message: '' };
      store.errors = {};
      store.touched = {};
    },
    isValid: (store) => Object.keys(store.errors).length === 0,
  }
);`}</pre>
            </div>
          </section>

          {/* Best Practices */}
          <section id="best-practices" className="docs-section">
            <h2>Best Practices</h2>

            <h3>✅ Do: Keep stores focused</h3>
            <div className="code-block">
              <pre>{`// Good: Separate concerns
const { useStore: useAuth } = createStore({ user: null }, { ... });
const { useStore: useCart } = createStore({ items: [] }, { ... });
const { useStore: useUI } = createStore({ theme: 'dark' }, { ... });`}</pre>
            </div>

            <h3>✅ Do: Use methods for complex logic</h3>
            <div className="code-block">
              <pre>{`// Good: Encapsulate logic in methods
const { useStore } = createStore(
  { items: [] },
  {
    addItem: (store) => (item) => {
      // Validation, deduplication, etc.
      if (!store.items.find(i => i.id === item.id)) {
        store.items = [...store.items, item];
      }
    }
  }
);

// Usage
store.addItem(newItem); // Clean and reusable`}</pre>
            </div>

            <h3>✅ Do: Use batch for multiple updates</h3>
            <div className="code-block">
              <pre>{`// Good: Single re-render
batch(() => {
  store.loading = false;
  store.data = response.data;
  store.error = null;
});`}</pre>
            </div>

            <h3>❌ Don't: Store derived state</h3>
            <div className="code-block">
              <pre>{`// Bad: Storing computed values
const store = { items: [], total: 0 }; // total is derived

// Good: Compute in methods
const store = createStore(
  { items: [] },
  { total: (store) => store.items.reduce((sum, i) => sum + i.price, 0) }
);`}</pre>
            </div>

            <h3>❌ Don't: Mutate arrays in place</h3>
            <div className="code-block">
              <pre>{`// Bad: Won't trigger re-render
store.items.push(newItem);

// Good: Replace the array
store.items = [...store.items, newItem];`}</pre>
            </div>
          </section>

          {/* Migration Guide */}
          <section id="migration" className="docs-section">
            <h2>Migration Guide</h2>

            <h3>From Redux</h3>
            <div className="code-block">
              <pre>{`// Redux
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: state => { state.value += 1 },
    decrement: state => { state.value -= 1 },
    incrementByAmount: (state, action) => { 
      state.value += action.payload 
    },
  },
});

// h-state
const { useStore } = createStore(
  { value: 0 },
  {
    increment: (store) => () => store.value++,
    decrement: (store) => () => store.value--,
    incrementByAmount: (store) => (amount: number) => {
      store.value += amount;
    },
  }
);`}</pre>
            </div>

            <h3>From Zustand</h3>
            <div className="code-block">
              <pre>{`// Zustand
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// h-state
const { useStore } = createStore(
  { count: 0 },
  { increment: (store) => () => store.count++ }
);`}</pre>
            </div>

            <h3>From useState</h3>
            <div className="code-block">
              <pre>{`// Before: useState scattered across components
function App() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState({ name: '' });
  // Pass down as props...
}

// After: Centralized store
const { useStore } = createStore(
  { count: 0, user: { name: '' } },
  {}
);

function App() {
  const store = useStore();
  // Access anywhere: store.count, store.user.name
}`}</pre>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="docs-section">
            <h2>FAQ</h2>

            <h3>Do array mutations work?</h3>
            <p>
              Yes — since v2.2, mutation methods (<code>push</code>, <code>splice</code>,{' '}
              <code>sort</code>, etc.) are tracked automatically and trigger re-renders. Only
              direct index assignment (<code>items[0] = x</code>) and <code>length</code> writes
              are not tracked; use <code>splice</code> or reassign the array instead.
            </p>
            <div className="code-block">
              <pre>{`store.items.push(item);         // ✅ tracked
store.items[0] = item;          // ❌ not tracked
store.items.splice(0, 1, item); // ✅ use this instead`}</pre>
            </div>

            <h3>Can I use h-state with class components?</h3>
            <p>
              h-state is designed for functional components with hooks. 
              For class components, consider using a wrapper or the subscribe API directly.
            </p>

            <h3>How do I debug state changes?</h3>
            <p>
              Use React DevTools or add logging in your methods:
            </p>
            <div className="code-block">
              <pre>{`increment: (store) => () => {
  console.log('Before:', store.count);
  store.count++;
  console.log('After:', store.count);
}`}</pre>
            </div>

            <h3>Is h-state suitable for large applications?</h3>
            <p>
              Yes! h-state scales well. For large apps:
            </p>
            <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>
              <li>Split state into multiple focused stores</li>
              <li>Use TypeScript for type safety</li>
              <li>Leverage persistence for user preferences</li>
              <li>Use batch() for performance-critical updates</li>
            </ul>

            <h3>Does h-state work with React Native?</h3>
            <p>
              Yes! h-state works with React Native. For persistence, 
              you may need to use AsyncStorage with custom serialize/deserialize functions.
            </p>

            <h3>What's the bundle size?</h3>
            <p>
              h-state is approximately <strong>2KB gzipped</strong> with zero dependencies 
              (only React as a peer dependency).
            </p>
          </section>

          {/* Footer */}
          <div className="docs-footer">
            <p>
              Found an issue? <a href="https://github.com/HidayetCanOzcan/h-state/issues" target="_blank" rel="noopener noreferrer">Report on GitHub</a>
            </p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
              Made with ❤️ by <a href="https://github.com/HidayetCanOzcan" target="_blank" rel="noopener noreferrer">Hidayet Can Özcan</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
