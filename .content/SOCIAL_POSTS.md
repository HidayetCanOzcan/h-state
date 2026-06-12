# h-state — Paylaşım İçerikleri (kopyala-yapıştır)

> Linkler:
> - Demo: https://hidayetcanozcan.github.io/h-state
> - npm: `npm i h-state`
> - Repo: https://github.com/HidayetCanOzcan/h-state

---

## 1) LinkedIn (ana — LLM açısı merkezde)

```
Your AI coding agent writes broken Redux. It writes perfect h-state.

Here's why I think that matters more than benchmarks.

When you ask Cursor or Claude to "add a counter to my store," with most libraries it hallucinates a reducer, forgets the action type, wires the dispatch wrong, and you spend 10 minutes fixing AI-generated boilerplate.

With h-state there's nothing to get wrong:

store.count++
store.user.name = "Ada"
store.todos.push(todo)

You mutate state. React re-renders. That's the whole API.

So I did something I haven't seen many libraries do: I shipped the docs for the AI, inside the package.
→ AGENTS.md, llms.txt, and a ready-to-use Agent Skill.

Point your agent at the repo and it just knows how to use it correctly — first try. Less hallucination, less boilerplate, less you-fixing-the-AI.

Oh, and for humans it's not bad either: proxy-free, ~2KB, zero deps, TypeScript-first, with undo/redo, atomic transactions, and live cross-tab sync built in (one line: { syncTabs: true }).

I built a collaborative pixel canvas to prove the cross-tab part — open it in two tabs and paint. No server.

Links in the comments 👇 What's the worst boilerplate your AI agent has ever generated for you?

#react #typescript #ai #webdev #opensource
```

**İlk yorum:**
```
🎮 Live demo: https://hidayetcanozcan.github.io/h-state
📦 npm i h-state
⭐ https://github.com/HidayetCanOzcan/h-state
```

---

## 2) r/reactjs

**Başlık:**
```
I built a proxy-free React state lib where you just mutate state — and tried making it AI-agent friendly
```

**Gövde:**
```
I've been building h-state, a small (~2KB, zero-dep) state library. The idea is there's basically no API to learn — you mutate state and the component re-renders:

    store.count++
    store.user.name = "Ada"
    store.todos.push(todo)

It's proxy-free (uses getters/setters + structural tracking), so Array.isArray stays true and there are no Proxy gotchas.

Two things I'd genuinely like feedback on:

1. Cross-tab sync. With { syncTabs: true } state stays in sync across browser tabs over BroadcastChannel — no server. I built a little collaborative pixel canvas to test it (open it in two tabs and paint). Demo: https://hidayetcanozcan.github.io/h-state

2. AI-agent docs. I ship an AGENTS.md, llms.txt, and an agent skill inside the npm package, so tools like Cursor/Claude use the API correctly instead of hallucinating reducers. Curious whether others think shipping machine-readable docs is worth it or overkill.

It also has undo/redo ({ history: true }) and atomic transactions ($transaction(fn) with rollback).

Repo: https://github.com/HidayetCanOzcan/h-state — happy to hear what's wrong with the approach. The obvious tradeoff vs Proxy libs is that store.items[0] = x (direct index assignment) isn't tracked; you use splice/methods instead.
```

---

## 3) r/javascript  (Cumartesi "Showoff Saturday" thread'inde)

**Başlık:**
```
[Showoff Saturday] h-state — 2KB proxy-free state with cross-tab sync over BroadcastChannel
```

**Gövde:** r/reactjs gövdesinin aynısını kullan; ilk cümleyi şununla değiştir:
```
h-state has a framework-agnostic core with React bindings included. You mutate state and subscribers re-render — no reducers/actions/dispatch.
```

---

## 4) r/webdev  (Showoff Saturday — "Görseller ve Video" sekmesinden, GIF ile)

**Başlık:**
```
[Showoff Saturday] A collaborative pixel canvas that syncs across browser tabs with no server
```

**Gövde:**
```
Built this to demo the cross-tab sync in my state lib (h-state). Open it in two tabs side by side and paint — every stroke + reaction shows up in the other tab instantly via BroadcastChannel. There's a live presence counter showing how many tabs are connected.

Demo: https://hidayetcanozcan.github.io/h-state
Code: https://github.com/HidayetCanOzcan/h-state

The whole sync is one option ({ syncTabs: true }). Feedback welcome.
```

---

## 5) Hacker News — Show HN

**Başlık:**
```
Show HN: H-state – Proxy-free React state with cross-tab sync and AI-agent docs
```

**URL alanı:** https://github.com/HidayetCanOzcan/h-state

**İlk yorum (kendi postuna — HN geleneği):**
```
Author here. h-state is a ~2KB zero-dependency state library. You mutate state directly (store.count++) and components re-render — no reducers/actions/dispatch.

Two parts I'd like feedback on: (1) cross-tab sync over BroadcastChannel via a single option, demoed with a collaborative pixel canvas; (2) I ship AGENTS.md/llms.txt/an agent skill in the package so AI coding agents use it correctly.

It's proxy-free (getters/setters + structural tracking), so the tradeoff is direct index assignment on arrays isn't tracked — you use array methods/splice. Curious what people think of that tradeoff and of shipping machine-readable docs for LLMs.
```

---

## 6) Dev.to / Hashnode — Yazı #1 (cross-tab, SEO)

**Başlık:** `Adding live cross-tab sync to React state in one line (BroadcastChannel, no server)`

**Yapı:**
- Problem: tablar arası state senkronu genelde server/WebSocket ister.
- BroadcastChannel'a kısa giriş.
- `{ syncTabs: true }` ile tek satır çözüm.
- Pixel canvas örneği (kod).
- Presence (join/here/bye) nasıl çalışır.
- Bonus: "I made it AI-agent friendly" bölümü.
- Repo + demo linkleri.

**Tag:** `react`, `javascript`, `webdev`, `typescript`

---

## 7) Dev.to / Hashnode — Yazı #2 (LLM açısı, az rakip)

**Başlık:** `I shipped docs for AI agents inside my npm package (AGENTS.md + llms.txt). Here's why.`

---

## Yayınlama Kuralları

### Reddit
- Hype kelimeleri YASAK: "revolutionary", "blazing fast", "game-changer" → downvote.
- Tradeoff'u kendin söyle (proxy-free sınırı) → güven kazandırır.
- Showoff Saturday thread'lerini kullan (r/javascript, r/webdev normal günlerde self-promo siler).
- Görsel/GIF >> link.
- İlk 1-2 saatte tüm yorumlara cevap ver.
- Her subreddit kurallarını paylaşmadan önce oku.

### LinkedIn
- Görsel şart: 2 tab yan yana pixel-canvas ekran kaydı (GIF/mp4).
- Linkleri gövdeye koyma → ilk yoruma koy.
- İlk 2 satır merak uyandırmalı (see more'dan önce).
- Salı–Perşembe 09:00–11:00 TR.
- Soruyla bitir.
- 3-5 hashtag.

### Hacker News
- Salı–Perşembe ~16:00–18:00 TR.
- Başlıkta hype yok, düz teknik.
- İlk yorumda kendin açıkla, yorumlara hızlı dön.

### Çekilecek görseller (her platform için tekrar kullan)
1. Pixel canvas: 2 tab yan yana, birinde boya → diğerinde anında belirsin (8-15 sn GIF).
2. Cursor/Claude'un `store.count++` yazdığı ekran görüntüsü (LLM açısı için).
