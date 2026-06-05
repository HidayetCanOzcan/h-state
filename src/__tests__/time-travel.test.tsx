import { createStore } from "../index";

// Proves opt-in time travel: $undo / $redo / $history / $clearHistory.

type State = { count: number; todos: string[] };
type Methods = { inc: () => void; addTodo: (t: string) => void };

function makeStore(history: boolean | { limit?: number } = true) {
	const { store } = createStore<State, Methods>(
		{ count: 0, todos: [] },
		{
			inc: (s) => () => {
				s.count++;
			},
			addTodo: (s) => (t: string) => {
				s.todos.push(t);
			},
		},
		undefined,
		{ history },
	);
	return store;
}

describe("h-state time travel", () => {
	it("undo / redo restore primitive state", () => {
		const store = makeStore();
		store.inc();
		store.inc();
		expect(store.count).toBe(2);

		expect(store.$undo()).toBe(true);
		expect(store.count).toBe(1);
		expect(store.$undo()).toBe(true);
		expect(store.count).toBe(0);

		expect(store.$redo()).toBe(true);
		expect(store.count).toBe(1);
	});

	it("undo restores array mutations", () => {
		const store = makeStore();
		store.addTodo("a");
		store.addTodo("b");
		expect(store.todos).toEqual(["a", "b"]);
		store.$undo();
		expect(store.todos).toEqual(["a"]);
		store.$undo();
		expect(store.todos).toEqual([]);
	});

	it("a new change after undo clears the redo stack", () => {
		const store = makeStore();
		store.inc(); // 1
		store.inc(); // 2
		store.$undo(); // 1
		expect(store.$history().canRedo).toBe(true);
		store.inc(); // 2 (new branch)
		expect(store.$history().canRedo).toBe(false);
		expect(store.$redo()).toBe(false);
		expect(store.count).toBe(2);
	});

	it("$history reports stack sizes and availability", () => {
		const store = makeStore();
		expect(store.$history()).toEqual({ canUndo: false, canRedo: false, past: 0, future: 0 });
		store.inc();
		store.inc();
		expect(store.$history()).toMatchObject({ canUndo: true, past: 2 });
		store.$undo();
		expect(store.$history()).toMatchObject({ canRedo: true, future: 1 });
	});

	it("$clearHistory empties the stacks without touching state", () => {
		const store = makeStore();
		store.inc();
		store.$clearHistory();
		expect(store.count).toBe(1);
		expect(store.$undo()).toBe(false);
		expect(store.$history()).toMatchObject({ canUndo: false, canRedo: false });
	});

	it("respects the history limit", () => {
		const store = makeStore({ limit: 2 });
		store.inc();
		store.inc();
		store.inc(); // past should cap at 2
		expect(store.$history().past).toBe(2);
		// Can only undo twice back to count=1 (oldest snapshot dropped)
		store.$undo();
		store.$undo();
		expect(store.$undo()).toBe(false);
		expect(store.count).toBe(1);
	});

	it("is a no-op when history is disabled (default)", () => {
		const { store } = createStore<State, Methods>(
			{ count: 0, todos: [] },
			{ inc: (s) => () => { s.count++; }, addTodo: (s) => (t: string) => { s.todos.push(t); } },
		);
		store.inc();
		expect(store.$undo()).toBe(false);
		expect(store.$history()).toEqual({ canUndo: false, canRedo: false, past: 0, future: 0 });
	});
});
