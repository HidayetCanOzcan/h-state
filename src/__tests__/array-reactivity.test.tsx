import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore } from "../index";

// Proves the Proxy-free array reactivity contract end-to-end.

type Todo = { id: number; text: string; done: boolean };

type State = {
	todos: Todo[];
};

type Methods = {
	push: (t: Todo) => void;
	pop: () => void;
	spliceFirst: () => void;
	sortByText: () => void;
	toggleFirst: () => void;
	toggleLast: () => void;
	editFirstText: (text: string) => void;
	indexSet: (t: Todo) => void;
};

function makeStore() {
	return createStore<State, Methods>(
		{
			todos: [
				{ id: 1, text: "beta", done: false },
				{ id: 2, text: "alpha", done: false },
			],
		},
		{
			push: (store) => (t: Todo) => {
				store.todos.push(t);
			},
			pop: (store) => () => {
				store.todos.pop();
			},
			spliceFirst: (store) => () => {
				store.todos.splice(0, 1);
			},
			sortByText: (store) => () => {
				store.todos.sort((a, b) => a.text.localeCompare(b.text));
			},
			toggleFirst: (store) => () => {
				store.todos[0].done = !store.todos[0].done;
			},
			toggleLast: (store) => () => {
				const last = store.todos[store.todos.length - 1];
				if (last) last.done = !last.done;
			},
			editFirstText: (store) => (text: string) => {
				store.todos[0].text = text;
			},
			indexSet: (store) => (t: Todo) => {
				// Documented limitation: direct index assignment is NOT tracked.
				store.todos[0] = t;
			},
		},
	);
}

function View({ useStore }: { useStore: ReturnType<typeof makeStore>["useStore"] }) {
	const store = useStore();
	return (
		<div>
			<span data-testid="len">{store.todos.length}</span>
			<span data-testid="first">{store.todos[0]?.text ?? "-"}</span>
			<span data-testid="first-done">{String(store.todos[0]?.done)}</span>
			<span data-testid="last-done">{String(store.todos[store.todos.length - 1]?.done)}</span>
			<button type="button" onClick={() => store.push({ id: 3, text: "gamma", done: false })}>push</button>
			<button type="button" onClick={store.toggleLast}>toggle-last</button>
			<button type="button" onClick={store.pop}>pop</button>
			<button type="button" onClick={store.spliceFirst}>splice</button>
			<button type="button" onClick={store.sortByText}>sort</button>
			<button type="button" onClick={store.toggleFirst}>toggle</button>
			<button type="button" onClick={() => store.editFirstText("renamed")}>edit</button>
			<button type="button" onClick={() => store.indexSet({ id: 9, text: "untracked", done: false })}>indexset</button>
		</div>
	);
}

describe("h-state array reactivity (Proxy-free)", () => {
	it(".push() grows the list and re-renders", () => {
		const { useStore } = makeStore();
		render(<View useStore={useStore} />);
		expect(screen.getByTestId("len")).toHaveTextContent("2");
		fireEvent.click(screen.getByText("push"));
		expect(screen.getByTestId("len")).toHaveTextContent("3");
	});

	it(".pop() / .splice() shrink the list and re-render", () => {
		const { useStore } = makeStore();
		render(<View useStore={useStore} />);
		fireEvent.click(screen.getByText("pop"));
		expect(screen.getByTestId("len")).toHaveTextContent("1");
		fireEvent.click(screen.getByText("splice"));
		expect(screen.getByTestId("len")).toHaveTextContent("0");
	});

	it(".sort() reorders in place and re-renders", () => {
		const { useStore } = makeStore();
		render(<View useStore={useStore} />);
		expect(screen.getByTestId("first")).toHaveTextContent("beta");
		fireEvent.click(screen.getByText("sort"));
		expect(screen.getByTestId("first")).toHaveTextContent("alpha");
	});

	it("mutating a nested element property re-renders (eager element wrapping)", () => {
		const { useStore } = makeStore();
		render(<View useStore={useStore} />);
		expect(screen.getByTestId("first-done")).toHaveTextContent("false");
		fireEvent.click(screen.getByText("toggle"));
		expect(screen.getByTestId("first-done")).toHaveTextContent("true");
		fireEvent.click(screen.getByText("edit"));
		expect(screen.getByTestId("first")).toHaveTextContent("renamed");
	});

	it("toggling a NEWLY pushed element re-renders (regression: raw element wrapping)", () => {
		const { useStore } = makeStore();
		render(<View useStore={useStore} />);
		// Push a fresh raw item, then mutate its nested `done` flag.
		fireEvent.click(screen.getByText("push"));
		expect(screen.getByTestId("last-done")).toHaveTextContent("false");
		fireEvent.click(screen.getByText("toggle-last"));
		expect(screen.getByTestId("last-done")).toHaveTextContent("true");
	});

	it("keeps Array.isArray true (no wrapper type)", () => {
		const { useStore } = makeStore();
		let isArr = false;
		function Probe() {
			const store = useStore();
			isArr = Array.isArray(store.todos);
			return null;
		}
		render(<Probe />);
		expect(isArr).toBe(true);
	});

	it("direct index assignment is NOT tracked (documented limitation)", () => {
		const { useStore } = makeStore();
		render(<View useStore={useStore} />);
		expect(screen.getByTestId("first")).toHaveTextContent("beta");
		fireEvent.click(screen.getByText("indexset"));
		// The underlying data changed but no re-render fired.
		expect(screen.getByTestId("first")).toHaveTextContent("beta");
	});
});
