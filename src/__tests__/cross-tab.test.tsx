import { createStore } from "../index";

// jsdom has no BroadcastChannel; provide a minimal in-memory implementation that
// connects instances sharing the same channel name (and does NOT echo to the sender,
// matching the real BroadcastChannel contract).
type Msg = { data: unknown };
class FakeBroadcastChannel {
	static channels = new Map<string, Set<FakeBroadcastChannel>>();
	name: string;
	onmessage: ((ev: Msg) => void) | null = null;
	constructor(name: string) {
		this.name = name;
		const set = FakeBroadcastChannel.channels.get(name) ?? new Set();
		set.add(this);
		FakeBroadcastChannel.channels.set(name, set);
	}
	postMessage(data: unknown) {
		const set = FakeBroadcastChannel.channels.get(this.name);
		if (!set) return;
		for (const peer of set) {
			if (peer !== this && peer.onmessage) peer.onmessage({ data });
		}
	}
	close() {
		FakeBroadcastChannel.channels.get(this.name)?.delete(this);
	}
}

beforeAll(() => {
	(globalThis as unknown as { BroadcastChannel: typeof FakeBroadcastChannel }).BroadcastChannel =
		FakeBroadcastChannel;
});

afterEach(() => {
	FakeBroadcastChannel.channels.clear();
});

type State = { count: number; user: { name: string }; items: string[] };
type Methods = { inc: () => void; rename: (n: string) => void; add: (i: string) => void };

const make = (channel = "test-chan") =>
	createStore<State, Methods>(
		{ count: 0, user: { name: "Ada" }, items: [] },
		{
			inc: (s) => () => { s.count++; },
			rename: (s) => (n: string) => { s.user.name = n; },
			add: (s) => (i: string) => { s.items.push(i); },
		},
		undefined,
		{ syncTabs: { channel } },
	).store;

describe("h-state cross-tab sync", () => {
	it("propagates primitive changes between tabs on the same channel", () => {
		const tabA = make();
		const tabB = make();
		tabA.inc();
		tabA.inc();
		expect(tabB.count).toBe(2);
		tabA.$destroy();
		tabB.$destroy();
	});

	it("propagates nested + array changes", () => {
		const tabA = make();
		const tabB = make();
		tabA.rename("Linus");
		tabA.add("first");
		expect(tabB.user.name).toBe("Linus");
		expect(tabB.items).toEqual(["first"]);
		tabA.$destroy();
		tabB.$destroy();
	});

	it("does not echo back to the originating tab (no feedback loop)", () => {
		const tabA = make();
		const tabB = make();
		let aNotifications = 0;
		tabA.$subscribe(() => { aNotifications++; });
		tabB.inc(); // B → A (one apply on A)
		expect(tabA.count).toBe(1);
		expect(aNotifications).toBe(1); // single apply, no re-broadcast loop
		tabA.$destroy();
		tabB.$destroy();
	});

	it("isolates stores on different channels", () => {
		const tabA = make("chan-a");
		const tabB = make("chan-b");
		tabA.inc();
		expect(tabB.count).toBe(0);
		tabA.$destroy();
		tabB.$destroy();
	});

	it("stops syncing after $destroy", () => {
		const tabA = make();
		const tabB = make();
		tabB.$destroy();
		tabA.inc();
		expect(tabB.count).toBe(0);
		tabA.$destroy();
	});

	it("is a no-op when syncTabs is disabled", () => {
		const a = createStore<State, Methods>(
			{ count: 0, user: { name: "Ada" }, items: [] },
			{ inc: (s) => () => { s.count++; }, rename: (s) => (n: string) => { s.user.name = n; }, add: (s) => (i: string) => { s.items.push(i); } },
		).store;
		expect(() => a.$destroy()).not.toThrow();
	});
});
