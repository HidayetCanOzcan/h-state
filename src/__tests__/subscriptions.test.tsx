import { createStore } from "../index";

// Proves the vanilla (outside-React) subscription API: $getState / $subscribe / $subscribeWithSelector.

type State = {
	count: number;
	user: { name: string };
	items: number[];
};

type Methods = {
	increment: () => void;
	setName: (n: string) => void;
	addItem: (n: number) => void;
};

function makeStore() {
	// createStore exposes the singleton `store` for use entirely outside React.
	const { store } = createStore<State, Methods>(
		{ count: 0, user: { name: "ada" }, items: [] },
		{
			increment: (s) => () => {
				s.count++;
			},
			setName: (s) => (n: string) => {
				s.user.name = n;
			},
			addItem: (s) => (n: number) => {
				s.items.push(n);
			},
		},
	);
	return store;
}

describe("h-state vanilla subscriptions", () => {
	it("$getState returns a plain non-reactive snapshot (state keys only)", () => {
		const store = makeStore();
		const snap = store.$getState();
		expect(snap).toEqual({ count: 0, user: { name: "ada" }, items: [] });
		expect("increment" in snap).toBe(false);
	});

	it("$subscribe fires with next and previous snapshots", () => {
		const store = makeStore();
		const calls: Array<{ next: number; prev: number }> = [];
		const unsub = store.$subscribe((next, prev) => {
			calls.push({ next: next.count, prev: prev.count });
		});
		store.increment();
		store.increment();
		expect(calls).toEqual([
			{ next: 1, prev: 0 },
			{ next: 2, prev: 1 },
		]);
		unsub();
		store.increment();
		expect(calls).toHaveLength(2); // no more calls after unsubscribe
	});

	it("$subscribe reflects array mutations made via tracked methods", () => {
		const store = makeStore();
		let lastLen = -1;
		store.$subscribe((next) => {
			lastLen = next.items.length;
		});
		store.addItem(10);
		store.addItem(20);
		expect(lastLen).toBe(2);
	});

	it("$subscribeWithSelector fires only when the selected slice changes", () => {
		const store = makeStore();
		const names: string[] = [];
		store.$subscribeWithSelector(
			(s) => s.user.name,
			(name) => names.push(name),
		);
		store.increment(); // unrelated change -> selector unchanged -> no fire
		store.setName("grace");
		store.setName("grace"); // same value -> no fire
		store.setName("hopper");
		expect(names).toEqual(["grace", "hopper"]);
	});

	it("returns an unsubscribe that stops selector notifications", () => {
		const store = makeStore();
		let count = 0;
		const unsub = store.$subscribeWithSelector(
			(s) => s.count,
			() => {
				count++;
			},
		);
		store.increment();
		unsub();
		store.increment();
		expect(count).toBe(1);
	});
});
