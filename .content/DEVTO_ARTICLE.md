---
title: "Adding live cross-tab sync to React state in one line (BroadcastChannel, no server)"
published: false
description: "How I synced React state across browser tabs with a single option — no server, no WebSocket, no Redis. Plus a collaborative pixel canvas demo and why I shipped docs for AI agents."
tags: react, javascript, webdev, typescript
cover_image: ""
canonical_url: ""
---

> **How to publish:** paste everything below into the Dev.to editor (Markdown mode).
> - **Title:** `Adding live cross-tab sync to React state in one line (BroadcastChannel, no server)`
> - **Tags (exactly 4):** `react`, `javascript`, `webdev`, `typescript`
> - **Cover image:** a GIF/PNG of the pixel canvas synced across two tabs (1000×420px works best).
> - Leave `canonical_url` empty unless you post it on your own blog first.
> - Delete this quote block before publishing.

---

Most "real-time" features start with the same assumption: you need a server. A WebSocket, a Redis pub/sub, a hosted service.

But a huge category of real-time UX never leaves the user's own machine: **keeping multiple browser tabs of your app in sync.** Log out in one tab, all tabs log out. Add an item to the cart in one tab, it shows up in the other. Change a theme, every tab follows.

For that, you don't need a server at all. You need the **BroadcastChannel API** — and ideally, a state layer that wires it up for you.

In this post I'll show:

1. What BroadcastChannel is, in 60 seconds.
2. How to make React state sync across tabs in **one line**.
3. A fun demo: a **collaborative pixel canvas** that syncs live across tabs.
4. How to show **live presence** ("3 tabs connected") without timers.
5. A bonus on something I rarely see libraries do: shipping docs **for AI agents**.

I'll use [h-state](https://github.com/HidayetCanOzcan/h-state), a tiny (~2KB, zero-dep) state library I built, because it makes the wiring a single option. The concepts apply to any setup, though.

---

## 1. BroadcastChannel in 60 seconds

`BroadcastChannel` lets same-origin browsing contexts (tabs, windows, iframes, workers) send messages to each other. No server involved.

```js
// Tab A and Tab B both run this:
const channel = new BroadcastChannel("my-app");

// Tab A sends:
channel.postMessage({ type: "ping", value: 42 });

// Tab B receives:
channel.onmessage = (event) => {
  console.log(event.data); // { type: "ping", value: 42 }
};
```

That's the entire API surface you need. The sender does **not** receive its own messages, which is exactly what you want for sync.

The catch: doing this *robustly* for application state means handling serialization, avoiding feedback loops (Tab B applying a change shouldn't re-broadcast it back to Tab A forever), and not polluting things like undo history. That boilerplate is what a state layer should own.

---

## 2. Cross-tab state in one line

Here's a normal store. You mutate state directly and React re-renders — no reducers, no actions, no dispatch:

```ts
import { createStore } from "h-state";

const { useStore, store } = createStore({
  count: 0,
  theme: "dark",
});

// anywhere:
store.count++;
store.theme = "light";
```

To make that state live across **every open tab**, you add one option:

```ts
const { useStore, store } = createStore(
  { count: 0, theme: "dark" },
  {},                          // methods (optional)
  { enabled: true, key: "app" }, // persistence (optional)
  { syncTabs: true },          // 👈 sync across tabs
);
```

Now `store.count++` in one tab updates the count in all the others instantly. Internally it's a `BroadcastChannel`: on every mutation the new state is posted to the channel; receiving tabs apply it **without re-broadcasting** (no feedback loop) and **without touching undo history**.

Pair it with persistence (`{ enabled: true }`) and a brand-new tab loads the last known state from `localStorage`, then stays live via the channel. When you're done (e.g. on unmount), `store.$destroy()` closes the channel.

---

## 3. The demo: a collaborative pixel canvas

A counter is boring. Let's sync something you can *see*.

The state is a map of `"row-col" → color` plus a counter:

```ts
import { createStore } from "h-state";

export const GRID = 12;

export const { useStore, store } = createStore(
  { pixels: {} as Record<string, string>, strokes: 0 },
  {
    paint: (s) => (key: string, color: string) => {
      if (s.pixels[key] === color) return;
      s.pixels = { ...s.pixels, [key]: color };
      s.strokes++;
    },
    clear: (s) => () => {
      s.pixels = {};
    },
  },
  { enabled: true, key: "canvas" }, // persist the artwork
  { syncTabs: true },               // 👈 live in every tab
);
```

And the component just renders a grid of buttons. Painting a cell calls `paint(key, color)` — which syncs everywhere:

```tsx
function Canvas() {
  const store = useStore();
  const [color, setColor] = useState("#6366f1");
  const [drawing, setDrawing] = useState(false);

  const paint = (key: string) => store.paint(key, color);

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, 1fr)`, gap: 3 }}
      onPointerUp={() => setDrawing(false)}
      onPointerLeave={() => setDrawing(false)}
    >
      {Array.from({ length: GRID * GRID }).map((_, i) => {
        const key = `${Math.floor(i / GRID)}-${i % GRID}`;
        const fill = store.pixels[key];
        return (
          <button
            key={key}
            type="button"
            aria-label={`pixel ${key}`}
            style={{ aspectRatio: "1", background: fill ?? "rgba(255,255,255,.05)" }}
            onPointerDown={() => { setDrawing(true); paint(key); }}
            onPointerEnter={() => { if (drawing) paint(key); }}
          />
        );
      })}
    </div>
  );
}
```

Open it in two tabs side by side and paint — every stroke appears in both, instantly, with no server.

👉 **Live demo:** https://hidayetcanozcan.github.io/h-state (open the Cross-Tab Canvas in two tabs)

---

## 4. Live presence without timers

A nice touch is showing how many tabs are currently connected ("3 tabs live"). The naive approach uses heartbeats on `setInterval`. You don't need timers — a small **join / here / bye** protocol is enough:

- On mount, a tab broadcasts `hello`.
- Existing tabs reply `here`, so the new tab learns about them.
- On close (`beforeunload` / `pagehide`), a tab broadcasts `bye`.
- Each tab keeps a `Set` of peer ids (itself included) and reports its size.

```ts
import { useEffect, useState } from "react";

type Msg =
  | { type: "hello"; id: string }
  | { type: "here"; id: string }
  | { type: "bye"; id: string };

export function usePresence(channelName: string): number {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const selfId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const peers = new Set<string>([selfId]);
    const channel = new BroadcastChannel(channelName);
    const sync = () => setCount(peers.size);

    channel.onmessage = (e: MessageEvent<Msg>) => {
      const msg = e.data;
      if (!msg || msg.id === selfId) return;
      if (msg.type === "hello") {
        peers.add(msg.id);
        channel.postMessage({ type: "here", id: selfId });
      } else if (msg.type === "here") {
        peers.add(msg.id);
      } else if (msg.type === "bye") {
        peers.delete(msg.id);
      }
      sync();
    };

    const leave = () => channel.postMessage({ type: "bye", id: selfId });
    channel.postMessage({ type: "hello", id: selfId });
    window.addEventListener("beforeunload", leave);
    window.addEventListener("pagehide", leave);

    return () => {
      leave();
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("pagehide", leave);
      channel.onmessage = null;
      channel.close();
    };
  }, [channelName]);

  return count;
}
```

Now `const tabs = usePresence("my-app-presence")` gives you a live count you can render as glowing dots. Close a tab and the count drops in the others.

---

## 5. Bonus: I shipped docs *for the AI*

Here's a decision I made that I rarely see: the package ships machine-readable docs for AI coding agents — an `AGENTS.md`, an `llms.txt`, and an agent **Skill**.

Why? Because the way most of us write React now involves an agent (Cursor, Claude, Copilot). When you ask one to "add cross-tab sync," it tends to hallucinate the API of whatever library you use. With h-state there's very little surface to get wrong (you just mutate state), and with the docs *in the package*, the agent reads them and uses the real API on the first try — fewer hallucinated reducers, less boilerplate to clean up.

It's a small thing, but "AI-native" shouldn't just be a landing-page word. It can be docs you write for the model, not only the human.

---

## The honest tradeoff

h-state is **proxy-free** (it uses getters/setters + structural tracking instead of `Proxy`). The upside: `Array.isArray` stays `true`, no Proxy edge cases, tiny bundle. The tradeoff: **direct index assignment isn't tracked.**

```ts
store.items.push(item);     // ✅ tracked → re-render
store.items.splice(i, 1);   // ✅
store.items[i].done = true; // ✅ nested element is wrapped
store.items[0] = item;      // ❌ not tracked — use splice/reassign
```

For 99% of state updates you use methods or reassign, so it rarely bites — but it's worth knowing up front.

---

## Wrap-up

Cross-tab sync is one of those features that *looks* like it needs a backend and doesn't. `BroadcastChannel` + a state layer that owns the wiring gets you there in one line:

```ts
{ syncTabs: true }
```

- 🎮 **Live demo:** https://hidayetcanozcan.github.io/h-state
- 📦 `npm i h-state`
- ⭐ **Repo:** https://github.com/HidayetCanOzcan/h-state

If you try the pixel canvas in two tabs, I'd love to hear what you'd build with it. And I'm genuinely curious what people think about shipping docs for AI agents inside packages — useful, or overkill?
