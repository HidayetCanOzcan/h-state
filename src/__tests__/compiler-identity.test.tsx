/**
 * React Compiler compatibility: the "fresh identity" contract.
 *
 * The React Compiler memoizes JSX/expressions keyed on the values they read,
 * compared with Object.is. A store that mutates containers in place behind
 * stable references makes every change invisible to those comparisons,
 * producing silently stale UI. These tests pin the contract that fixes it:
 * after a mutation, the next read of the mutated container — and of every
 * ancestor up to the no-selector useStore() result — returns a NEW reference,
 * while untouched containers keep their identity.
 */
import React from "react";
import { act, render, renderHook } from "@testing-library/react";
import { createStore } from "../index";

type State = {
	items: { id: number; label: string }[];
	user: { name: string; address: { city: string } };
	count: number;
	matrix: number[][];
};

const makeState = (): State => ({
	items: [
		{ id: 1, label: "one" },
		{ id: 2, label: "two" },
	],
	user: { name: "ada", address: { city: "london" } },
	count: 0,
	matrix: [[1, 2], [3, 4]],
});

describe("fresh container identity (React Compiler contract)", () => {
	it("array identity changes after an in-place mutation, stays stable otherwise", () => {
		const { store } = createStore(makeState(), {});
		const before = store.items;
		expect(store.items).toBe(before); // no mutation → stable

		store.items.push({ id: 3, label: "three" });

		const after = store.items;
		expect(after).not.toBe(before);
		expect(after).toHaveLength(3);
		expect(store.items).toBe(after); // stable again until next mutation
	});

	it("nested object mutation refreshes the identity of the whole ancestor path", () => {
		const { store } = createStore(makeState(), {});
		const userBefore = store.user;
		const addressBefore = store.user.address;
		const itemsBefore = store.items;

		store.user.address.city = "paris";

		expect(store.user).not.toBe(userBefore);
		expect(store.user.address).not.toBe(addressBefore);
		expect(store.user.address.city).toBe("paris");
		// untouched sibling keeps identity
		expect(store.items).toBe(itemsBefore);
	});

	it("mutating an object inside an array refreshes element, array and reads stay consistent", () => {
		const { store } = createStore(makeState(), {});
		const itemsBefore = store.items;
		const firstBefore = store.items[0];

		store.items[0].label = "uno";

		expect(store.items).not.toBe(itemsBefore);
		expect(store.items[0]).not.toBe(firstBefore);
		expect(store.items[0].label).toBe("uno");
		expect(store.items[1].label).toBe("two");
	});

	it("nested arrays get fresh identity through the chain", () => {
		const { store } = createStore(makeState(), {});
		const matrixBefore = store.matrix;
		const rowBefore = store.matrix[0];

		store.matrix[0].push(99);

		expect(store.matrix).not.toBe(matrixBefore);
		expect(store.matrix[0]).not.toBe(rowBefore);
		expect(store.matrix[0]).toEqual([1, 2, 99]);
		expect(store.matrix[1]).toEqual([3, 4]);
	});

	it("mutations through a captured stale array reference land on the canonical state", () => {
		const { store } = createStore(makeState(), {});
		const captured = store.items;

		store.items.push({ id: 3, label: "three" }); // next read starts a new generation
		void store.items; // forces the clone

		captured.push({ id: 4, label: "four" }); // stale reference

		expect(store.items.map((i) => i.id)).toEqual([1, 2, 3, 4]);
	});

	it("$update() refreshes every container identity (untracked index writes)", () => {
		const { store } = createStore(makeState(), {});
		const itemsBefore = store.items;
		const userBefore = store.user;

		store.items[0] = { id: 9, label: "nine" }; // untracked write
		store.$update();

		expect(store.items).not.toBe(itemsBefore);
		expect(store.user).not.toBe(userBefore);
		expect(store.items[0].label).toBe("nine");
	});

	it("identity: 'stable' opt-out preserves pre-2.11 reference stability", () => {
		const { store } = createStore(makeState(), {}, undefined, { identity: "stable" });
		const itemsBefore = store.items;
		const userBefore = store.user;

		store.items.push({ id: 3, label: "three" });
		store.user.name = "grace";

		expect(store.items).toBe(itemsBefore);
		expect(store.user).toBe(userBefore);
		expect(store.items).toHaveLength(3);
		expect(store.user.name).toBe("grace");
	});
});

describe("no-selector useStore() under memoization", () => {
	it("returns a new facade reference after every update, stable between updates", () => {
		const { useStore, store } = createStore(makeState(), {});
		const { result, rerender } = renderHook(() => useStore());

		const first = result.current;
		rerender();
		expect(result.current).toBe(first); // no update → same facade

		act(() => {
			store.count = 1;
		});
		expect(result.current).not.toBe(first);
		expect(result.current.count).toBe(1);
	});

	it("Object.is-keyed memoization (the compiler's caching model) never serves stale lists", () => {
		const { useStore, store } = createStore(makeState(), {});

		// Simulate what the React Compiler emits: JSX cached against the values
		// it reads, recomputed only when an Object.is comparison fails.
		function List() {
			const s = useStore();
			const rendered = React.useMemo(
				() => s.items.map((i) => <li key={i.id}>{i.label}</li>),
				[s.items],
			);
			return <ul>{rendered}</ul>;
		}

		const { container } = render(<List />);
		expect(container.querySelectorAll("li")).toHaveLength(2);

		act(() => {
			store.items.push({ id: 3, label: "three" });
		});
		expect(container.querySelectorAll("li")).toHaveLength(3);
		expect(container.textContent).toContain("three");

		act(() => {
			store.items[0].label = "uno";
		});
		expect(container.textContent).toContain("uno");
	});

	it("selector returning an array re-renders after in-place mutation", () => {
		const { useStore, store } = createStore(makeState(), {});
		const { result } = renderHook(() => useStore((s) => s.items));

		const before = result.current;
		act(() => {
			store.items.push({ id: 3, label: "three" });
		});
		expect(result.current).not.toBe(before);
		expect(result.current).toHaveLength(3);
	});
});

describe("write-back regressions fixed by the canonical raw graph", () => {
	it("$reset restores initial values even after nested mutations", () => {
		const { store } = createStore(makeState(), {});
		store.user.address.city = "paris";
		store.items.push({ id: 3, label: "three" });

		store.$reset();

		expect(store.user.address.city).toBe("london");
		expect(store.items).toHaveLength(2);
	});

	it("store creation does not alias the caller's initial object", () => {
		const initial = makeState();
		const { store } = createStore(initial, {});

		store.user.name = "grace";
		store.items.push({ id: 3, label: "three" });

		expect(initial.user.name).toBe("ada");
		expect(initial.items).toHaveLength(2);
	});

	it("persists nested mutations (not just top-level replacements)", async () => {
		localStorage.clear();
		const { store } = createStore(
			makeState(),
			{},
			{ enabled: true, key: "compiler-identity-persist" },
		);

		store.user.address.city = "paris";
		store.items[0].label = "uno";
		await act(async () => {
			await Promise.resolve(); // flush the persistence microtask
		});

		const raw = localStorage.getItem("compiler-identity-persist");
		expect(raw).toBeTruthy();
		const saved = JSON.parse(raw as string).__hs_d;
		expect(saved.user.address.city).toBe("paris");
		expect(saved.items[0].label).toBe("uno");
	});
});
