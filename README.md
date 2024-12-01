# H-State

A lightweight and intuitive state management library for React, leveraging the power of JavaScript Proxies for seamless reactivity.

[![npm version](https://badge.fury.io/js/h-state.svg)](https://badge.fury.io/js/h-state)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🎮 **[Live Demo & Examples](https://hidayetcanozcan.github.io/h-state)**

## Features

- 🪶 **Lightweight**: Tiny bundle size, zero dependencies
- ⚡ **Simple API**: Intuitive state management with minimal boilerplate
- 🔄 **Reactive**: Automatic updates with direct property access
- 🎯 **Type-Safe**: Built with TypeScript for excellent type inference
- 🛠️ **Flexible**: Works with any React project

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

### Direct Property Updates

```typescript
const store = createStore({
  user: {
    name: '',
    age: 0
  }
});

// Direct property updates work!
store.user.name = 'John';  // Triggers re-render
store.user.age = 25;       // Triggers re-render
```

### Array Operations

```typescript
const store = createStore({
  todos: [] as string[],
  addTodo: (store, todo: string) => {
    store.todos.push(todo);  // Arrays are reactive too!
  }
});
```

## API Reference

### createStore(initialState)

Creates a new store with the given initial state and methods.

- **Parameters**
  - `initialState`: An object containing your state and methods
- **Returns**
  - A proxy object that triggers React re-renders on changes

## Links

- 📦 [NPM Package](https://www.npmjs.com/package/h-state)
- 💻 [GitHub Repository](https://github.com/HidayetCanOzcan/h-state)
- 🎮 [Live Demo](https://hidayetcanozcan.github.io/h-state)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT [Hidayet Can Özcan](https://github.com/HidayetCanOzcan)
