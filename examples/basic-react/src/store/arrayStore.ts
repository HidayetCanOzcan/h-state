import { createStore } from '../../../../src';

export interface ArrayItem extends Record<string, unknown> {
  id: number;
  text: string;
  done: boolean;
}

interface ArrayState extends Record<string, unknown> {
  items: ArrayItem[];
  draft: string;
  nextId: number;
}

interface ArrayMethods extends Record<string, unknown> {
  setDraft: (value: string) => void;
  add: () => void;
  pushTwoBatched: () => void;
  pop: () => void;
  shift: () => void;
  unshiftSample: () => void;
  removeAt: (index: number) => void;
  sortAsc: () => void;
  reverse: () => void;
  toggleAt: (index: number) => void;
  editAt: (index: number, text: string) => void;
  untrackedIndexSet: () => void;
  reset: () => void;
}

const seed = (): ArrayItem[] => [
  { id: 1, text: 'Learn h-state', done: true },
  { id: 2, text: 'Mutate arrays directly', done: false },
  { id: 3, text: 'Ship without a Proxy', done: false },
];

export const { useStore: useArrayStore } = createStore<ArrayState, ArrayMethods>(
  {
    items: seed(),
    draft: '',
    nextId: 4,
  },
  {
    setDraft: (store) => (value: string) => {
      store.draft = value;
    },
    add: (store) => () => {
      const text = store.draft.trim();
      if (!text) return;
      // .push() mutates in place — tracked automatically.
      store.items.push({ id: store.nextId, text, done: false });
      store.nextId++;
      store.draft = '';
    },
    pushTwoBatched: (store) => () => {
      // Two synchronous mutations coalesce into a single re-render.
      store.items.push({ id: store.nextId, text: `Batched #${store.nextId}`, done: false });
      store.nextId++;
      store.items.push({ id: store.nextId, text: `Batched #${store.nextId}`, done: false });
      store.nextId++;
    },
    pop: (store) => () => {
      store.items.pop();
    },
    shift: (store) => () => {
      store.items.shift();
    },
    unshiftSample: (store) => () => {
      store.items.unshift({ id: store.nextId, text: `Unshifted #${store.nextId}`, done: false });
      store.nextId++;
    },
    removeAt: (store) => (index: number) => {
      store.items.splice(index, 1);
    },
    sortAsc: (store) => () => {
      store.items.sort((a, b) => a.text.localeCompare(b.text));
    },
    reverse: (store) => () => {
      store.items.reverse();
    },
    toggleAt: (store) => (index: number) => {
      // Nested element property mutation — eagerly wrapped, so this re-renders.
      store.items[index].done = !store.items[index].done;
    },
    editAt: (store) => (index: number, text: string) => {
      store.items[index].text = text;
    },
    untrackedIndexSet: (store) => () => {
      // Documented Proxy-free limitation: direct index assignment is NOT tracked.
      if (store.items.length > 0) {
        store.items[0] = { id: 999, text: 'Index-set (no re-render)', done: false };
      }
    },
    reset: (store) => () => {
      store.items = seed();
      store.nextId = 4;
      store.draft = '';
    },
  },
);
