import { createStore } from '../../../../src';

interface SubState extends Record<string, unknown> {
  count: number;
  user: { name: string };
}

interface SubMethods extends Record<string, unknown> {
  increment: () => void;
  decrement: () => void;
  setName: (name: string) => void;
}

// `store` is returned alongside `useStore` for vanilla (outside-React) usage.
export const { useStore: useSubStore, store: subStore } = createStore<SubState, SubMethods>(
  {
    count: 0,
    user: { name: 'Ada' },
  },
  {
    increment: (s) => () => {
      s.count++;
    },
    decrement: (s) => () => {
      s.count--;
    },
    setName: (s) => (name: string) => {
      s.user.name = name;
    },
  },
);
