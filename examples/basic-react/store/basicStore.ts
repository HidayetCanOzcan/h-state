import { createStore } from '../../../src';

interface AppState extends Record<string, unknown> {
  count: number;
  user: {
    name: string;
    age: number;
  };
  todos: string[];
}

interface AppMethods extends Record<string, unknown> {
  increment: () => void;
  decrement: () => void;
  addTodo: (todo: string) => void;
  removeTodo: (index: number) => void;
  userInfo: string;
  todoCount: number;
}

export const { useStore } = createStore<AppState, AppMethods>(
  // Initial state
  {
    count: 0,
    user: {
      name: 'John Doe',
      age: 25
    },
    todos: ['Learn H-State', 'Build awesome apps']
  },
  // Methods
  {
    increment: (store) => () => {
      store.count++;
    },
    decrement: (store) => () => {
      store.count--;
    },
    addTodo: (store) => (todo: string) => {
      store.todos = [...store.todos, todo];
    },
    removeTodo: (store) => (index: number) => {
      store.todos = store.todos.filter((_, i) => i !== index);
    },
    userInfo: (store) => `${store.user.name} (${store.user.age} years)`,
    todoCount: (store) => store.todos.length
  }
);
