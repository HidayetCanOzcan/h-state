# H-State

A lightweight and intuitive state management library for React with deep nested reactivity, built on signals and getter/setter patterns for optimal performance.

[![npm version](https://img.shields.io/npm/v/h-state?color=cb3837&label=npm)](https://www.npmjs.com/package/h-state)
[![npm downloads](https://img.shields.io/npm/dm/h-state?color=6366f1)](https://www.npmjs.com/package/h-state)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/h-state?color=22c55e&label=gzip)](https://bundlephobia.com/package/h-state)
[![CI](https://github.com/HidayetCanOzcan/h-state/actions/workflows/ci.yml/badge.svg)](https://github.com/HidayetCanOzcan/h-state/actions/workflows/ci.yml)
[![types](https://img.shields.io/npm/types/h-state?color=3178c6)](https://www.npmjs.com/package/h-state)
[![tree shakeable](https://img.shields.io/badge/tree--shakeable-✓-22c55e)](https://bundlephobia.com/package/h-state)
[![zero deps](https://img.shields.io/badge/dependencies-0-22c55e)](https://www.npmjs.com/package/h-state?activeTab=dependencies)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🎮 **[Live Demo & Examples](https://hidayetcanozcan.github.io/h-state)**

> **🤖 AI / LLM support:** This package ships first-class guidance for AI coding agents.
> [`AGENTS.md`](./AGENTS.md) (exact API, patterns, and ❌/✅ mistakes) and [`llms.txt`](./llms.txt)
> are bundled in the npm tarball, so Cursor / Claude Code / Copilot / Codex can read them from
> `node_modules/h-state/`. An installable Agent Skill lives in [`skills/h-state/SKILL.md`](./skills/h-state/SKILL.md).

## What's New in v2.7.0 🎉

- ⏳ **Time Travel (undo / redo) — in one line.** Opt in with `{ history: true }` and get full undo/redo for free:
  - `store.$undo()` / `store.$redo()` → step back/forward through state; return `true` if a step was taken.
  - `store.$history()` → `{ canUndo, canRedo, past, future }` for wiring up buttons.
  - `store.$clearHistory()` → drop the stacks without touching state. `limit` caps memory (default 100).
  - Works with primitives, nested objects, and arrays. Zero extra dependencies.
- 📡 **Cross-Tab Sync — also one line.** Opt in with `{ syncTabs: true }` and state stays in sync across every open tab/window via `BroadcastChannel`:
  - No setup, no server, no extra deps. Defaults the channel to your persistence `key`.
  - `store.$destroy()` closes the channel when you're done.
  - Safe no-op on SSR / browsers without `BroadcastChannel`.

### Previously in v2.5.0

- 🔌 **Vanilla Subscriptions (use outside React)**: `createStore` now also returns the live `store` so you can read and react to state anywhere — effects, loggers, WebSocket bridges, tests.
  - `store.$getState()` → plain, non-reactive deep snapshot (state keys only).
  - `store.$subscribe((next, prev) => …)` → fires on every change with new/previous snapshots; returns an unsubscribe.
  - `store.$subscribeWithSelector(selector, listener, equalityFn?)` → fires only when the selected slice changes.
- 🐛 **Array element fix**: nested mutations on **newly pushed/unshifted/spliced** objects (e.g. `items[i].done = true`) now re-render correctly — fresh raw elements are wrapped on insertion.

### Previously in v2.2.0

- 🧬 **Reactive Arrays**: `push / pop / shift / unshift / splice / sort / reverse / fill / copyWithin` now trigger re-renders and persistence automatically — no Proxy, no wrapper types, `Array.isArray` stays `true`.
- 🧩 **Selector-Based Subscriptions**: `useStore(selector, equalityFn?)` re-renders only when the selected slice changes. Powered by `useSyncExternalStore` for concurrent-mode safety.
- 🧳 **Versioned Persistence + Deep Merge**: `version` + `migrate` options upgrade stored payloads; nested objects deep-merge with initial state so newly added fields keep their defaults.
- ♻️ **`$reset()`**: One-call return to initial state + clears persisted payload.
- ⚙️ **Microtask-Coalesced Persist**: Many synchronous mutations collapse into a single `localStorage` write per tick.
- 🪶 **Batch Coalescing**: Within `batch(...)` only a single flush is scheduled per store regardless of how many setters fire.

### Previously in v2.1.0

- 💾 **localStorage Persistence**: Automatic state persistence with customizable options
- ✨ **Deep Nested Reactivity**: Unlimited depth object reactivity with no Proxy overhead
- ⚡ **Batch Updates**: Group multiple state changes into single re-render
- 🚀 **Performance Optimized**: WeakMap caching and shallow comparison
- 🎯 **Signal-Based Architecture**: Efficient change detection with UID tracking
- 📦 **Zero Dependencies**: Pure TypeScript implementation

## Features

- 🪶 **Lightweight**: ~3KB minified, zero dependencies
- ⚡ **Simple API**: No boilerplate, just direct property access
- 🔄 **Deep Reactivity**: Nested objects automatically reactive to any depth
- 🎯 **Type-Safe**: Full TypeScript support with perfect type inference
- 🚀 **High Performance**: Batch updates, shallow comparison, smart caching
- 🛠️ **Flexible**: Works with any React project, any component pattern

## Installation

```bash
npm install h-state
# or
yarn add h-state
```

## Quick Start

```typescript
import { createStore } from 'h-state';

// 1. Define your state structure
interface CounterState {
  count: number;
}

// 2. Define your methods
interface CounterMethods {
  increment: () => void;
  decrement: () => void;
}

// 3. Create your store
const { useStore } = createStore<CounterState, CounterMethods>(
  {
    count: 0,
  },
  {
    increment: (store) => () => {
      store.count++;
    },
    decrement: (store) => () => {
      store.count--;
    },
  }
);

// 4. Use in your React components
function Counter() {
  const store = useStore();
  
  return (
    <div>
      <button onClick={store.decrement}>-</button>
      <span>Count: {store.count}</span>
      <button onClick={store.increment}>+</button>
    </div>
  );
}
```

## Examples

Our [live demo](https://hidayetcanozcan.github.io/h-state) includes several examples:

- 📊 Basic Counter
- 👤 User Profile Management  
- ✅ Todo List
- 🔄 Nested State Updates
- 📝 Form Handling
- 💾 localStorage Persistence

### Complete Todo List Example

```typescript
import { createStore } from 'h-state';

// Define types
interface TodoState {
  todos: string[];
  newTodo: string;
}

interface TodoMethods {
  addTodo: () => void;
  removeTodo: (index: number) => void;
}

// Create store
const { useStore } = createStore<TodoState, TodoMethods>(
  {
    todos: ['Learn H-State', 'Build awesome apps'],
    newTodo: '',
  },
  {
    addTodo: (store) => () => {
      if (store.newTodo.trim()) {
        store.todos = [...store.todos, store.newTodo];
        store.newTodo = '';
      }
    },
    removeTodo: (store) => (index: number) => {
      store.todos = store.todos.filter((_, i) => i !== index);
    },
  }
);

// Use in component
function TodoList() {
  const store = useStore();

  return (
    <div>
      <input
        type="text"
        value={store.newTodo}
        onChange={(e) => (store.newTodo = e.target.value)}
        placeholder="Add a new todo..."
      />
      <button onClick={store.addTodo}>Add</button>

      <ul>
        {store.todos.map((todo, index) => (
          <li key={index}>
            {todo}
            <button onClick={() => store.removeTodo(index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### User Profile with Nested State

```typescript
import { createStore } from 'h-state';

interface UserState {
  user: {
    name: string;
    age: number;
  };
}

interface UserMethods {}

const { useStore } = createStore<UserState, UserMethods>(
  {
    user: {
      name: 'John Doe',
      age: 25,
    },
  },
  {}
);

function UserProfile() {
  const store = useStore();

  return (
    <div>
      <input
        type="text"
        value={store.user.name}
        onChange={(e) => {
          // Deep reactivity - just update nested property!
          store.user.name = e.target.value;
        }}
      />
      <input
        type="number"
        value={store.user.age}
        onChange={(e) => {
          store.user.age = parseInt(e.target.value);
        }}
      />
      <p>User: {store.user.name}, Age: {store.user.age}</p>
    </div>
  );
}
```

### Deep Nested Reactivity (v2.0+)

```typescript
const { useStore } = createStore(
  {
    user: {
      name: '',
      profile: {
        bio: '',
        settings: {
          theme: 'light'
        }
      }
    }
  },
  {
    // Methods have access to store
    updateTheme: (store) => (theme: string) => {
      store.user.profile.settings.theme = theme;
    }
  }
);

function Component() {
  const store = useStore();
  
  // All nested updates are reactive!
  store.user.name = 'John';                          // ✅ Reactive
  store.user.profile.bio = 'Developer';              // ✅ Reactive
  store.user.profile.settings.theme = 'dark';        // ✅ Reactive
  
  return <div>{store.user.profile.settings.theme}</div>;
}
```

### localStorage Persistence (v2.1+) 💾

```typescript
import { createStore } from 'h-state';

interface AppState {
  count: number;
  user: {
    name: string;
  };
}

interface AppMethods {
  increment: () => void;
}

// Persisted store - automatically saved to localStorage!
const { useStore } = createStore<AppState, AppMethods>(
  {
    count: 0,
    user: { name: 'John' },
  },
  {
    increment: (store) => () => {
      store.count++;
    },
  },
  {
    enabled: true,              // Enable persistence
    key: 'my-app-state',        // localStorage key
    debounce: 300,              // Save after 300ms of inactivity
  }
);

function App() {
  const store = useStore();

  return (
    <div>
      <p>Count: {store.count}</p>
      <button onClick={store.increment}>+</button>
      
      <input
        value={store.user.name}
        onChange={(e) => store.user.name = e.target.value}
      />
      
      {/* Manual controls */}
      <button onClick={() => store.$persist()}>Save Now</button>
      <button onClick={() => store.$clearPersist()}>Clear Storage</button>
    </div>
  );
}

// Try it: Make changes, reload the page - your state persists! ✨
```

### Compare: Persisted vs Non-Persisted

```typescript
// Non-persisted (default)
const { useStore: useRegularStore } = createStore(
  { count: 0 },
  {}
);

// Persisted
const { useStore: usePersistedStore } = createStore(
  { count: 0 },
  {},
  { enabled: true, key: 'persisted-count' }
);

function Comparison() {
  const regular = useRegularStore();
  const persisted = usePersistedStore();

  return (
    <div>
      <div>
        <h3>❌ Regular (Lost on reload)</h3>
        <button onClick={() => regular.count++}>
          Count: {regular.count}
        </button>
      </div>

      <div>
        <h3>✅ Persisted (Saved to localStorage)</h3>
        <button onClick={() => persisted.count++}>
          Count: {persisted.count}
        </button>
      </div>
    </div>
  );
}
```

### Batch Updates for Performance

```typescript
import { createStore, batch } from 'h-state';

const { useStore } = createStore(
  {
    items: [] as string[],
    count: 0,
    status: 'idle'
  },
  {
    loadData: (store) => async () => {
      // Multiple updates in single re-render
      batch(() => {
        store.items = ['item1', 'item2', 'item3'];
        store.count = 3;
        store.status = 'loaded';
      }); // Only 1 re-render!
    }
  }
);
```

### Utility Methods

```typescript
const { useStore } = createStore(
  { count: 0, name: '' },
  {}
);

function Component() {
  const store = useStore();
  
  // $merge - batch update multiple properties
  store.$merge({ count: 5, name: 'John' }); // Single re-render
  
  // $update - force manual re-render (rarely needed)
  store.$update();
}
```

## API Reference

### createStore(initialState, methods, persistOptions?)

Creates a new store with reactive state and methods.

```typescript
function createStore<T, M>(
  initialState: T,
  methods: MethodCreators<T, M>,
  persistOptions?: PersistOptions
): { useStore: () => StoreType<T, M> }
```

**Parameters:**

1. **`initialState`**: `T` - Object containing initial state properties
2. **`methods`**: `MethodCreators<T, M>` - Object with method creators that receive store as first parameter
3. **`persistOptions`** (optional): `PersistOptions` - localStorage persistence configuration

**Returns:**
- `{ useStore }`: React hook to access the store

**Example:**
```typescript
const { useStore } = createStore(
  { count: 0 },                           // Initial state
  {
    increment: (store) => () => {         // Method creator
      store.count++;
    }
  },
  {                                       // Persistence options (optional)
    enabled: true,
    key: 'my-app-count'
  }
);
```

### PersistOptions

Configuration for localStorage persistence:

```typescript
interface PersistOptions {
  enabled?: boolean;        // Enable persistence (default: false)
  key?: string;            // localStorage key (auto-generated if not provided)
  debounce?: number;       // Debounce save in ms (default: 0 - immediate)
  serialize?: (state) => string;      // Custom serializer (default: JSON.stringify)
  deserialize?: (data) => object;     // Custom deserializer (default: JSON.parse)
  onError?: (error: Error) => void;   // Error handler (default: console.error)
}
```

**Example with all options:**
```typescript
const { useStore } = createStore(
  { data: [] },
  {},
  {
    enabled: true,
    key: 'my-custom-key',
    debounce: 500,
    serialize: (state) => JSON.stringify(state),
    deserialize: (data) => JSON.parse(data),
    onError: (error) => console.error('Persist error:', error)
  }
);
```

### batch(fn)

Groups multiple state updates into a single re-render.

```typescript
function batch<T>(fn: () => T): T
```

**Parameters:**
- `fn`: Function containing multiple state updates

**Returns:**
- Return value of the function

**Example:**
```typescript
batch(() => {
  store.name = 'John';
  store.age = 25;
  store.email = 'john@example.com';
}); // Only 1 re-render instead of 3!
```

### Store Methods

Every store instance includes:

- **`$merge(partial)`**: Batch update multiple properties
- **`$update()`**: Manually trigger re-render  
- **`$persist()`**: Force immediate save to localStorage (if persistence enabled)
- **`$clearPersist()`**: Clear persisted data from localStorage
- **`$reset()`**: Restore initial state and clear persisted payload
- **`$getState()`**: Plain, non-reactive deep snapshot (state keys only)
- **`$subscribe(listener)`**: Subscribe to any change outside React → unsubscribe fn
- **`$subscribeWithSelector(selector, listener, equalityFn?)`**: Subscribe to a derived slice → unsubscribe fn
- **`$undo()` / `$redo()`**: Time travel (requires `{ history: true }`) → returns `true` if a step was taken
- **`$history()`**: `{ canUndo, canRedo, past, future }`
- **`$clearHistory()`**: Empty the undo/redo stacks
- **`$destroy()`**: Close the cross-tab `BroadcastChannel` (requires `{ syncTabs: true }`)

**Example:**
```typescript
const { useStore } = createStore(
  { count: 0, name: '' },
  {},
  { enabled: true, key: 'my-state' }
);

function Component() {
  const store = useStore();
  
  // Batch update
  store.$merge({ count: 5, name: 'John' });
  
  // Force save immediately (bypasses debounce)
  store.$persist();
  
  // Clear persisted data
  const handleReset = () => {
    store.$clearPersist();
    window.location.reload(); // Reload to show initial state
  };
  
  return <button onClick={handleReset}>Reset & Reload</button>;
}
```

## Reactive Arrays

Array mutations are tracked automatically — no need to clone on every change:

```typescript
const { useStore } = createStore(
  { todos: [] as Todo[] },
  {
    addTodo: (store) => (todo: Todo) => {
      store.todos.push(todo);        // ✅ triggers re-render + persist
    },
    removeAt: (store) => (i: number) => {
      store.todos.splice(i, 1);      // ✅ triggers re-render + persist
    },
    togglePinned: (store) => (i: number) => {
      store.todos[i].pinned = !store.todos[i].pinned; // ✅ nested mutation tracked
    },
  }
);
```

**Tracked mutation methods**: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`.

**Not tracked** (Proxy-free design limitation): direct index assignment `arr[0] = x` and `arr.length = n`. Use `splice` or reassign the array:

```typescript
store.todos[0] = newTodo;                  // ❌ no re-render
store.todos.splice(0, 1, newTodo);         // ✅ use this instead
store.todos = [newTodo, ...store.todos];   // ✅ or reassign
```

## Selector-Based Subscriptions

By default `useStore()` re-renders on any state change. For fine-grained subscriptions pass a selector:

```typescript
// Re-renders only when `count` changes
const count = useStore((s) => s.count);

// Custom equality for derived/object selectors
const visibleTodos = useStore(
  (s) => s.todos.filter((t) => !t.done),
  (a, b) => a.length === b.length && a.every((t, i) => t === b[i])
);
```

Selectors use `useSyncExternalStore` under the hood — safe with React 18 concurrent features.

## Why h-state? (comparison)

| | **h-state** | Zustand | Redux Toolkit | Jotai |
|---|:---:|:---:|:---:|:---:|
| Direct mutation (`store.count++`) | ✅ | ❌ (set) | ❌ (reducers) | ❌ (atoms) |
| Tracked array methods (`push`/`splice`) | ✅ | ❌ | ❌ | ❌ |
| Built-in undo/redo (time travel) | ✅ | ❌ (middleware) | ❌ (middleware) | ❌ |
| Cross-tab sync | ✅ | ❌ (middleware) | ❌ | ❌ |
| localStorage persistence + migrations | ✅ | ⚠️ (middleware) | ⚠️ | ⚠️ |
| Proxy-free | ✅ | ✅ | ✅ | ✅ |
| Dependencies | **0** | 0 | several | 0 |
| Ships `AGENTS.md` for AI agents | ✅ | ❌ | ❌ | ❌ |

> No reducers, no actions, no providers. Mutate state and it just re-renders.

## Time Travel (undo / redo)

Opt in with the 4th `createStore` argument and get undo/redo with no extra libraries:

```typescript
const { useStore, store } = createStore<State, Methods>(
  { text: '', items: [] as string[] },
  {
    setText: (s) => (t: string) => { s.text = t; },
    addItem: (s) => (i: string) => { s.items.push(i); },
  },
  undefined,                 // persistOptions (3rd arg)
  { history: true },         // 👈 enable time travel (or { history: { limit: 50 } })
);

function Editor() {
  const store = useStore();
  const { canUndo, canRedo } = store.$history();
  return (
    <>
      <input value={store.text} onChange={(e) => store.setText(e.target.value)} />
      <button disabled={!canUndo} onClick={store.$undo}>Undo</button>
      <button disabled={!canRedo} onClick={store.$redo}>Redo</button>
    </>
  );
}
```

**Notes**

- Each committed change records a snapshot. Group multiple mutations with `batch(...)` to record one step.
- A new change after an undo clears the redo stack (linear history, like every editor).
- `limit` caps the number of retained past snapshots (default `100`).
- History is **off by default** — zero overhead unless you enable it.

## Cross-Tab Sync

Keep state consistent across every open tab/window with one option — powered by the browser's `BroadcastChannel`, no server required:

```typescript
const { useStore, store } = createStore<State, Methods>(
  { theme: 'dark', cart: [] as string[] },
  {
    setTheme: (s) => (t: string) => { s.theme = t; },
    addToCart: (s) => (id: string) => { s.cart.push(id); },
  },
  undefined,                    // persistOptions (3rd arg)
  { syncTabs: true },           // 👈 sync across tabs (or { syncTabs: { channel: 'my-app' } })
);

// Change in tab A → instantly reflected in tab B, C, …
store.addToCart('sku-1');

// When you're done (e.g. on unmount in a micro-frontend):
store.$destroy();
```

**Notes**

- The channel name defaults to your persistence `key` if set, otherwise `"h-state"`. Pass `{ syncTabs: { channel } }` to namespace multiple stores.
- Remote updates are applied without re-broadcasting (no feedback loops) and don't pollute undo history.
- Combine with `{ enabled: true }` persistence so a brand-new tab loads the last state, then stays live via sync.
- Gracefully no-ops during SSR or in browsers without `BroadcastChannel`.

## Vanilla Subscriptions (outside React)

`createStore` returns the live `store` alongside `useStore`, so you can read and react to state **anywhere** — outside components, in plain modules, loggers, WebSocket/IndexedDB bridges, or tests.

```typescript
const { useStore, store } = createStore<State, Methods>(
  { count: 0, user: { name: 'Ada' }, items: [] as number[] },
  {
    increment: (s) => () => { s.count++; },
    rename: (s) => (name: string) => { s.user.name = name; },
    add: (s) => (n: number) => { s.items.push(n); },
  }
);

// 1. Plain, non-reactive deep snapshot (state keys only — no methods/symbols)
const snapshot = store.$getState();        // { count: 0, user: { name: 'Ada' }, items: [] }

// 2. Subscribe to ANY change — receives next + previous snapshots
const unsubscribe = store.$subscribe((next, prev) => {
  console.log('changed:', prev.count, '→', next.count);
});

// 3. Subscribe to a derived slice — fires only when it actually changes
const stop = store.$subscribeWithSelector(
  (s) => s.user.name,
  (name, prevName) => console.log(`name: ${prevName} → ${name}`),
  // optional equalityFn (defaults to Object.is)
);

store.increment();      // $subscribe fires; selector (name) does NOT
store.rename('Grace');  // both fire

unsubscribe();
stop();
```

**Notes**

- `$getState()` returns a deep clone read through the reactive layer, so nested mutations are always reflected.
- Subscriptions are batch-aware: inside `batch(...)` listeners fire once per flush.
- `$subscribeWithSelector` skips notifications when the selected value is unchanged per `equalityFn`.
- Both subscribe methods return an unsubscribe function.

## Versioned Persistence & Migrations

Schema evolution without losing user data:

```typescript
createStore(
  { user: { name: '', email: '', role: 'guest' } },
  {},
  {
    enabled: true,
    key: 'my-app',
    version: 2,
    migrate: (persisted, fromVersion) => {
      if (fromVersion < 2) {
        // v1 had `user.username`, rename to `user.name`
        const u = (persisted.user ?? {}) as Record<string, unknown>;
        if (u.username && !u.name) u.name = u.username;
        delete u.username;
      }
      return persisted;
    },
  }
);
```

Stored payloads are wrapped in a small envelope `{ __hs_v, __hs_d }`. Payloads without this envelope are treated as legacy `version: 0` and fed through `migrate` on load.

### Deep-Merge Hydration (default: on)

When you add a new nested field to initial state, older persisted payloads no longer erase it — nested plain objects are deep-merged with the initial shape. Disable with `deepMerge: false` for a strict replace.

## `$reset()`

Return the store to its initial state and clear any persisted payload:

```typescript
store.$reset();
```

Handy for logout flows, multi-tenant switches, and test teardown.

## Performance

H-State v2.0 is optimized for production use:

### Automatic Optimizations

- **Shallow Comparison**: Skips updates when values haven't changed
- **WeakMap Caching**: Reactive wrappers cached to avoid recreation
- **Batch-Aware Updates**: All methods automatically batched
- **Signal-Based**: Efficient UID tracking instead of expensive diffing

### Benchmarks

Compared to other state management libraries:

| Operation | H-State v2 | Zustand | Context API |
|-----------|-----------|---------|-------------|
| Small Array Add (1k) | **~2.8ms** | ~2.5ms | ~0.5ms |
| Medium Array Add (5k) | **~16.7ms** | ~16.8ms | ~2.6ms |
| Large Array Add (10k) | **~44.5ms** | ~45.1ms | ~4.9ms |
| Object Shallow (10k) | **~3.7ms** | ~4.2ms | ~5.5ms |
| Deep Nested (10k) | **~4.2ms** | ~6.5ms | ~4.4ms |
| Counter (100k) | **~31.8ms** | ~34.3ms | ~36.3ms |

*Note: Context API is faster for simple operations but doesn't scale well for complex state management.*

### Best Practices

```typescript
// ✅ Good - Use batch for multiple updates
batch(() => {
  store.user.name = 'John';
  store.user.age = 25;
  store.user.email = 'john@example.com';
});

// ✅ Good - Direct nested updates
store.settings.theme = 'dark';

// ✅ Good - Use $merge for multiple properties
store.$merge({ count: 5, status: 'active' });

// ❌ Avoid - Multiple separate updates without batch
store.name = 'John';  // Re-render 1
store.age = 25;       // Re-render 2
store.email = 'x';    // Re-render 3
```

## Migration Guide

### From v1.x to v2.x

V2.x maintains backward compatibility but adds powerful new features:

```typescript
// v1.x - Still works!
store.user = { ...store.user, name: 'John' };

// v2.0+ - Deep reactivity
store.user.name = 'John';  // Just works! ✨

// v2.0+ - Batch updates
batch(() => {
  store.count = 5;
  store.name = 'John';
});

// v2.1+ - Persistence
const { useStore } = createStore(
  { count: 0 },
  {},
  { enabled: true }  // New optional 3rd parameter!
);
```

### Upgrading to v2.1.0

**No breaking changes!** Just install the latest version:

```bash
npm install h-state@latest
```

**New in v2.1:**
- ✅ Optional 3rd parameter for persistence
- ✅ `$persist()` and `$clearPersist()` methods
- ✅ All existing code continues to work

**Example migration:**

```typescript
// Before (v2.0)
const { useStore } = createStore(
  { todos: [] },
  { addTodo: (store) => (todo) => {
    store.todos = [...store.todos, todo];
  }}
);

// After (v2.1) - Add persistence!
const { useStore } = createStore(
  { todos: [] },
  { addTodo: (store) => (todo) => {
    store.todos = [...store.todos, todo];
  }},
  { enabled: true, key: 'my-todos' }  // ← Just add this!
);
```

## Links

- 📦 [NPM Package](https://www.npmjs.com/package/h-state)
- 💻 [GitHub Repository](https://github.com/HidayetCanOzcan/h-state)
- 🎮 [Live Demo](https://hidayetcanozcan.github.io/h-state)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT [Hidayet Can Özcan](https://github.com/HidayetCanOzcan)
