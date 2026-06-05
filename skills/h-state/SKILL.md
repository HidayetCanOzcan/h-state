---
name: h-state
description: >-
  Use when writing or editing React code that uses the `h-state` state
  management library (imports from 'h-state', calls createStore/useStore/batch,
  or uses store.$subscribe/$getState). Provides the exact API, idiomatic
  patterns, and the Proxy-free reactivity rules (tracked array methods, the
  index-assignment limitation, method-creator shape, selectors, persistence).
license: MIT
---

# h-state skill

`h-state` is a lightweight, **Proxy-free** React state library: mutate state directly and
components re-render automatically. Apply the rules below whenever generating h-state code.

## Setup

```ts
import { createStore, batch } from 'h-state';

type State = { count: number; todos: { id: number; text: string; done: boolean }[] };
type Methods = { increment: () => void; addTodo: (text: string) => void };

export const { useStore, store } = createStore<State, Methods>(
  { count: 0, todos: [] },
  {
    // Methods are CREATORS: (store) => realFunction
    increment: (s) => () => { s.count++; },
    addTodo: (s) => (text: string) => {
      s.todos.push({ id: Date.now(), text, done: false });
    },
  },
);
```

## Core rules (must follow)

1. **Method shape is `(store) => (args) => void`.** Never `(store) => { ... }` directly.
2. **Mutate directly.** `s.count++`, `s.user.name = 'x'`, `s.items.push(x)`. No setState, no spreads required.
3. **Array mutation methods are tracked**: push, pop, shift, unshift, splice, sort, reverse, fill, copyWithin — including nested mutation of freshly inserted elements (`s.items[i].done = true`).
4. **NOT tracked** (Proxy-free): `arr[0] = x` and `arr.length = n`. Use `splice` or reassign (`s.items = [...]`).
5. **Root state is an object map** (`Record<string, unknown>`), never a primitive/array.
6. **Don't reassign the whole store**; mutate fields or use `$merge` / `$reset`.

## In components

```tsx
function View() {
  const store = useStore();                    // re-renders on ANY change
  const count = useStore((s) => s.count);      // selector: re-render only on count change
  return <button onClick={store.increment}>{count}</button>;
}
```

For derived/object selectors pass an equality fn:
`useStore((s) => s.todos.filter(t => !t.done), (a, b) => a.length === b.length && a.every((t,i)=>t===b[i]))`.
Avoid selecting a whole array that is mutated in place — read it without a selector instead.

## Outside React

```ts
const unsub = store.$subscribe((next, prev) => {/* any change */});
store.$subscribeWithSelector((s) => s.user.name, (name) => {/* only on change */});
const snapshot = store.$getState(); // plain deep snapshot; re-call after changes
unsub();
```

## Time travel (undo / redo)

Opt in with the **4th** `createStore` arg. History is OFF by default.

```ts
const { useStore, store } = createStore(initial, methods,
  undefined,            // persistOptions (pass undefined if unused)
  { history: true },    // or { history: { limit: 50 } }
);

store.$undo();  // → boolean
store.$redo();  // → boolean
const { canUndo, canRedo, past, future } = store.$history();
store.$clearHistory();
```

Each committed change records one snapshot. Wrap multi-mutation actions in `batch(...)` so they
become a single undo step. A new change after undo clears the redo stack.

## Built-in store methods

`$getState`, `$subscribe`, `$subscribeWithSelector`, `$merge(partial)`, `$update`,
`$persist`, `$clearPersist`, `$reset`, `$undo`, `$redo`, `$history`, `$clearHistory`.

## Batch & persistence

```ts
batch(() => { s.a = 1; s.b = 2; });            // single re-render

createStore(initial, methods, {               // 3rd arg = persistence
  enabled: true, key: 'app', debounce: 300,
  version: 2, migrate: (p, from) => from < 2 ? upgrade(p) : p,
});
```

See `node_modules/h-state/AGENTS.md` for the full contract and the ❌/✅ mistake list.
