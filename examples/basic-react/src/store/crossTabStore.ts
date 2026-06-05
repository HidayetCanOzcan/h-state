import { createStore } from '../../../../src';

/** A reaction “ping” — changing `id` triggers a synced burst in every open tab. */
export interface ReactionPing {
  id: number;
  emoji: string;
}

interface CanvasState extends Record<string, unknown> {
  /** Map of "row-col" → hex color. A shared pixel canvas, synced across tabs. */
  pixels: Record<string, string>;
  /** Total brush strokes ever painted (purely for the stat counter). */
  strokes: number;
  /** Last reaction broadcast; bump `id` to fire a burst everywhere. */
  ping: ReactionPing | null;
}

interface CanvasMethods extends Record<string, unknown> {
  paint: (key: string, color: string) => void;
  clear: () => void;
  react: (emoji: string) => void;
}

export const GRID = 12;

export const { useStore: useCrossTabStore, store: crossTabStore } = createStore<
  CanvasState,
  CanvasMethods
>(
  { pixels: {}, strokes: 0, ping: null },
  {
    paint: (s) => (key: string, color: string) => {
      if (s.pixels[key] === color) return;
      s.pixels = { ...s.pixels, [key]: color };
      s.strokes++;
    },
    clear: (s) => () => {
      s.pixels = {};
    },
    react: (s) => (emoji: string) => {
      s.ping = { id: Date.now() + Math.random(), emoji };
    },
  },
  // Persist so a brand-new tab loads the current artwork, then stays live via sync.
  { enabled: true, key: 'hstate-canvas-demo', debounce: 80 },
  { syncTabs: { channel: 'hstate-canvas-demo' } },
);
