# H-State

A lightweight and intuitive state management library for React with deep nested reactivity, built on signals and getter/setter patterns for optimal performance.

[![npm version](https://badge.fury.io/js/h-state.svg)](https://badge.fury.io/js/h-state)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🎮 **[Live Demo & Examples](https://hidayetcanozcan.github.io/h-state)**

## What's New in v2.0.0 🎉

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

// Create your store
const store = createStore({
  count: 0,
  increment: (store) => {
    store.count++;
  },
  decrement: (store) => {
    store.count--;
  }
});

// Use in your React components
function Counter() {
  return (
    <div>
      <button onClick={store.decrement}>-</button>
      <span>{store.count}</span>
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

### createStore(initialState, methods)

Creates a new store with reactive state and methods.

```typescript
function createStore<T, M>(
  initialState: T,
  methods: MethodCreators<T, M>
): { useStore: () => StoreType<T, M> }
```

**Parameters:**
- `initialState`: Object containing initial state properties
- `methods`: Object with method creators that receive store as first parameter

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

- `$merge(partial)`: Batch update multiple properties
- `$update()`: Manually trigger re-render

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

## Migration from v1.x

V2.0 maintains backward compatibility but adds new features:

```typescript
// v1.x - Still works!
store.user = { ...store.user, name: 'John' };

// v2.0 - Now also works!
store.user.name = 'John';  // Deep reactivity!

// v2.0 - New batch API
batch(() => {
  store.count = 5;
  store.name = 'John';
});
```

## Links

- 📦 [NPM Package](https://www.npmjs.com/package/h-state)
- 💻 [GitHub Repository](https://github.com/HidayetCanOzcan/h-state)
- 🎮 [Live Demo](https://hidayetcanozcan.github.io/h-state)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT [Hidayet Can Özcan](https://github.com/HidayetCanOzcan)
