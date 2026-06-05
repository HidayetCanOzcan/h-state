import { createStore } from '../../../../src';

interface TTState extends Record<string, unknown> {
  title: string;
  color: string;
  items: string[];
  draft: string;
}

interface TTMethods extends Record<string, unknown> {
  setTitle: (t: string) => void;
  setColor: (c: string) => void;
  setDraft: (d: string) => void;
  addItem: () => void;
  removeAt: (i: number) => void;
}

export const { useStore: useTimeTravelStore, store: timeTravelStore } = createStore<TTState, TTMethods>(
  {
    title: 'My document',
    color: '#6366f1',
    items: ['First note'],
    draft: '',
  },
  {
    setTitle: (s) => (t: string) => { s.title = t; },
    setColor: (s) => (c: string) => { s.color = c; },
    setDraft: (s) => (d: string) => { s.draft = d; },
    addItem: (s) => () => {
      const text = s.draft.trim();
      if (!text) return;
      s.items.push(text);
      s.draft = '';
    },
    removeAt: (s) => (i: number) => { s.items.splice(i, 1); },
  },
  undefined,
  { history: { limit: 50 } },
);
