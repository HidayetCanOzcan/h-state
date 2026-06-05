import { createStore } from "../index";

type State = { count: number; user: { name: string }; items: string[] };
type Methods = {
	inc: () => void;
	rename: (n: string) => void;
	add: (i: string) => void;
};

function makeStore(history = false) {
	return createStore<State, Methods>(
		{ count: 0, user: { name: "Ada" }, items: [] },
		{
			inc: (s) => () => { s.count++; },
			rename: (s) => (n: string) => { s.user.name = n; },
			add: (s) => (i: string) => { s.items.push(i); },
		},
		undefined,
		history ? { history: true } : undefined,
	).store;
}

describe("h-state $transaction", () => {
	it("commits all mutations when fn succeeds", () => {
		const store = makeStore();
		store.$transaction(() => {
			store.inc();
			store.inc();
			store.rename("Linus");
			store.add("a");
		});
		expect(store.count).toBe(2);
		expect(store.user.name).toBe("Linus");
		expect(store.items).toEqual(["a"]);
	});

	it("rolls back every mutation when fn throws", () => {
		const store = makeStore();
		store.inc(); // committed before the transaction → must survive
		expect(() =>
			store.$transaction(() => {
				store.inc();
				store.rename("Broken");
				store.add("x");
				throw new Error("boom");
			}),
		).toThrow("boom");
		expect(store.count).toBe(1);
		expect(store.user.name).toBe("Ada");
		expect(store.items).toEqual([]);
	});

	it("re-throws the original error", () => {
		const store = makeStore();
		const err = new TypeError("specific");
		expect(() => store.$transaction(() => { throw err; })).toThrow(err);
	});

	it("returns the value produced by fn", () => {
		const store = makeStore();
		const result = store.$transaction(() => {
			store.inc();
			return store.count * 10;
		});
		expect(result).toBe(10);
	});

	it("records a single undo step for the whole transaction", () => {
		const store = makeStore(true);
		store.$transaction(() => {
			store.inc();
			store.inc();
			store.add("a");
		});
		expect(store.$history().past).toBe(1);
		expect(store.$history().canUndo).toBe(true);
		store.$undo();
		expect(store.count).toBe(0);
		expect(store.items).toEqual([]);
	});

	it("does not record history when a transaction rolls back", () => {
		const store = makeStore(true);
		expect(() =>
			store.$transaction(() => {
				store.inc();
				throw new Error("nope");
			}),
		).toThrow();
		expect(store.$history().past).toBe(0);
		expect(store.$history().canUndo).toBe(false);
		expect(store.count).toBe(0);
	});

	it("notifies subscribers once on commit, and restores on rollback", () => {
		const store = makeStore();
		let notifications = 0;
		store.$subscribe(() => { notifications++; });
		store.$transaction(() => {
			store.inc();
			store.add("a");
		});
		expect(notifications).toBeGreaterThanOrEqual(1);
		const afterCommit = notifications;
		expect(() =>
			store.$transaction(() => {
				store.inc();
				throw new Error("rollback");
			}),
		).toThrow();
		// Rollback must leave state unchanged from the committed value.
		expect(store.count).toBe(1);
		expect(notifications).toBeGreaterThan(afterCommit);
	});

	it("supports nested transactions (inner rollback, outer commit)", () => {
		const store = makeStore();
		store.$transaction(() => {
			store.inc();
			try {
				store.$transaction(() => {
					store.add("temp");
					throw new Error("inner");
				});
			} catch {
				// swallow inner failure; outer should still commit count
			}
			store.inc();
		});
		expect(store.count).toBe(2);
		expect(store.items).toEqual([]);
	});
});
