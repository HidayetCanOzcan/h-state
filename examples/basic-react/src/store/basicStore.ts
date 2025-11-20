import { createStore } from '../../../../src';

interface AppState extends Record<string, unknown> {
  count: number;
  user: {
    name: string;
    age: number;
  };
  todos: string[];
  newTodo: string;
}

interface AppMethods extends Record<string, unknown> {
  increment: () => void;
  decrement: () => void;
  addNewTodo: () => void;
  removeTodo: (index: number) => void;
  userInfo: string;
  todoCount: number;
}

// Non-persisted store (default behavior)
export const { useStore } = createStore<AppState, AppMethods>(
  {
    count: 0,
    user: {
      name: 'John Doe',
      age: 25,
    },
    todos: ['Learn H-State', 'Build awesome apps'],
    newTodo: '',
  },
  {
    increment: (store) => () => {
      store.count++;
    },
    decrement: (store) => () => {
      store.count--;
    },
    addNewTodo: (store) => () => {
      store.todos = [...store.todos, store.newTodo];
      store.newTodo = '';
    },
    removeTodo: (store) => (index: number) => {
      store.todos = store.todos.filter((_, i) => i !== index);
    },
    userInfo: (store) => `${store.user.name} (${store.user.age} years)`,
    todoCount: (store) => store.todos.length,
  }
);

// Persisted store - automatically saved to localStorage
export const { useStore: usePersistedStore } = createStore<AppState, AppMethods>(
  {
    count: 0,
    user: {
      name: 'Jane Smith',
      age: 30,
    },
    todos: ['Try persistence feature', 'Reload the page!'],
    newTodo: '',
  },
  {
    increment: (store) => () => {
      store.count++;
    },
    decrement: (store) => () => {
      store.count--;
    },
    addNewTodo: (store) => () => {
      store.todos = [...store.todos, store.newTodo];
      store.newTodo = '';
    },
    removeTodo: (store) => (index: number) => {
      store.todos = store.todos.filter((_, i) => i !== index);
    },
    userInfo: (store) => `${store.user.name} (${store.user.age} years)`,
    todoCount: (store) => store.todos.length,
  },
  {
    enabled: true,
    key: 'h-state-demo-persisted',
    debounce: 300, // Save after 300ms of inactivity
  }
);
