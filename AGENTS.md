# AGENTS.md — h-state

> Reference for AI coding agents (Cursor, Claude Code, Copilot, Codex, Windsurf, …).
> This file ships inside the npm tarball; read it from `node_modules/h-state/AGENTS.md`.
> Human-oriented docs live in `README.md`. This file is the strict API contract.

## 1. Summary

`h-state` is a lightweight, **Proxy-free** state management library for React. State is mutated
**directly** (`store.count++`, `store.user.name = 'x'`, `store.items.push(x)`) and components
re-render automatically. Zero dependencies. React is a peer dependency (`>=16.8`).

## 2. Public exports

```ts
import { createStore, batch } from 'h-state';
import type { PersistOptions, StoreType, MethodCreators } from 'h-state';
```

- `createStore(initial, methodCreators, persistOptions?)` → `{ useStore, store }`
- `batch(fn)` → runs `fn` and coalesces all mutations into a single re-render/flush.
- Types: `PersistOptions`, `StoreType`, `MethodCreators`.

`createStore` returns:
- `useStore()` — React hook. With no args returns the live store (re-renders on any change).
  With a selector `useStore(s => s.x, equalityFn?)` re-renders only when the slice changes.
- `store` — the same live store instance, usable **outside React** (subscriptions, tests, bridges).

## 3. Types

```ts
function createStore<
  T extends Record<string, unknown>,
  M extends Record<string, unknown>,
>(
  initial: T,
  methodCreators: MethodCreators<T, M>,
  persistOptions?: PersistOptions,
): { useStore: UseStore<T, M>; store: StoreType<T, M> };

// Each method is a creator: (store) => actualFn
type MethodCreators<T, M> = { [K in keyof M]: (store: StoreType<T, M>) => M[K] };

type PersistOptions = {
  enabled?: boolean;          // default false
  key?: string;               // localStorage key
  debounce?: number;          // ms; 0 = microtask-coalesced write
  serialize?: (state) => string;
  deserialize?: (data: string) => object;
  onError?: (error: Error) => void;
  version?: number;           // default 0
  migrate?: (persisted, fromVersion) => object;
  deepMerge?: boolean;        // default true
};
```

Built-in store methods (always present on `store`):

- `$getState(): T` — plain, non-reactive **deep** snapshot (state keys only, no methods/symbols).
- `$subscribe((next, prev) => void): () => void` — fires on any change; returns unsubscribe.
- `$subscribeWithSelector(selector, (sel, prevSel) => void, equalityFn?): () => void` — fires only when the selected slice changes.
- `$merge(partial)` — batch-update several top-level keys in one re-render.
- `$update()` — force a re-render (rarely needed).
- `$persist()` — force immediate localStorage write (if persistence enabled).
- `$clearPersist()` — remove persisted payload.
- `$reset()` — restore initial state and clear persisted payload.

## 4. Patterns

**Pattern 1 — Define a store**

```ts
type State = { count: number; user: { name: string }; todos: string[] };
type Methods = { increment: () => void; addTodo: (t: string) => void };

export const { useStore } = createStore<State, Methods>(
  { count: 0, user: { name: '' }, todos: [] },
  {
    increment: (store) => () => { store.count++; },
    addTodo: (store) => (t: string) => { store.todos.push(t); },
  },
);
```

**Pattern 2 — Consume in a component (no selector)**

```tsx
function View() {
  const store = useStore();           // re-renders on ANY change
  return <button onClick={store.increment}>{store.count}</button>;
}
```

**Pattern 3 — Selector subscription (fine-grained)**

```tsx
const count = useStore((s) => s.count);                 // re-renders only on count change
const names = useStore((s) => s.users.map(u => u.name), // custom equality for derived arrays
  (a, b) => a.length === b.length && a.every((x, i) => x === b[i]));
```

**Pattern 4 — Arrays (mutation methods are tracked)**

```ts
store.todos.push(item);     // ✅ re-render
store.todos.splice(i, 1);   // ✅
store.todos.sort(cmp);      // ✅
store.todos[i].done = true; // ✅ nested element (even freshly inserted ones)
```

**Pattern 5 — Outside React (subscriptions / snapshot)**

```ts
const { store } = createStore(/* … */);
const unsub = store.$subscribe((next, prev) => log(prev.count, '→', next.count));
const snap = store.$getState();
unsub();
```

**Pattern 6 — Batch multiple mutations**

```ts
import { batch } from 'h-state';
batch(() => { store.a = 1; store.b = 2; store.c = 3; }); // single re-render
```

**Pattern 7 — Persistence + migration**

```ts
createStore(initial, methods, {
  enabled: true, key: 'app', version: 2,
  migrate: (p, from) => from < 2 ? upgrade(p) : p,
});
```

## 5. Decision tree

- Need component reactivity, simplest case → `const store = useStore()` and read fields directly.
- Need to avoid re-renders on unrelated changes → `useStore(selector, equalityFn?)`.
- Need to react/read **outside React** (logger, websocket, test) → use returned `store` +
  `$subscribe` / `$subscribeWithSelector` / `$getState`.
- Adding/removing array items → use mutation methods (`push`/`splice`/…), NOT index assignment.
- Several writes that should be one render → wrap in `batch(...)`.
- Persist to localStorage → pass `persistOptions` (3rd arg); evolve schema with `version` + `migrate`.

## 6. Common mistakes (❌ → ✅)

**Method shape** — methods are creators returning the real function.

```ts
// ❌ Wrong
{ increment: (store) => { store.count++; } }
// ✅ Correct
{ increment: (store) => () => { store.count++; } }
```

**Direct index assignment is NOT tracked** (Proxy-free limitation).

```ts
// ❌ Wrong — no re-render
store.todos[0] = newTodo;
store.todos.length = 0;
// ✅ Correct
store.todos.splice(0, 1, newTodo);
store.todos = [];
```

**Selector returning the same array reference won't re-render** — read the array in render
(no selector) or return a derived value with a custom `equalityFn`.

```ts
// ❌ Risky: same array ref after push → may not re-render
const todos = useStore((s) => s.todos);
// ✅ Either read without a selector, or select a derived value
const store = useStore();           // store.todos in render
const count = useStore((s) => s.todos.length);
```

**`$getState()` is a snapshot, not live** — call it again after changes; do not cache and expect it to mutate.

**State must be an object map** — `createStore`'s first arg is `Record<string, unknown>`. Don't pass a primitive or array as the root.

**Don't reassign the whole `store`** — mutate fields (`store.x = …`) or use `$merge` / `$reset`.

**Hooks rules** — `useStore()` is a hook; call it at the top level of a component. The returned
`store` (from `createStore`) is what you use outside React, not `useStore()`.
