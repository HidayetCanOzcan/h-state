import { createStore } from '../../../../src';

interface CrossTabState extends Record<string, unknown> {
  count: number;
  color: string;
  messages: string[];
  draft: string;
}

interface CrossTabMethods extends Record<string, unknown> {
  increment: () => void;
  decrement: () => void;
  setColor: (c: string) => void;
  setDraft: (d: string) => void;
  send: () => void;
  reset: () => void;
}

export const { useStore: useCrossTabStore, store: crossTabStore } = createStore<
  CrossTabState,
  CrossTabMethods
>(
  {
    count: 0,
    color: '#6366f1',
    messages: [],
    draft: '',
  },
  {
    increment: (s) => () => { s.count++; },
    decrement: (s) => () => { s.count--; },
    setColor: (s) => (c: string) => { s.color = c; },
    setDraft: (s) => (d: string) => { s.draft = d; },
    send: (s) => () => {
      const text = s.draft.trim();
      if (!text) return;
      s.messages.push(text);
      s.draft = '';
    },
    reset: (s) => () => {
      s.count = 0;
      s.messages = [];
    },
  },
  // Persist so a brand-new tab loads the latest state, then stays live via sync.
  { enabled: true, key: 'hstate-crosstab-demo', debounce: 100 },
  { syncTabs: { channel: 'hstate-crosstab-demo' } },
);
