import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore } from "../index";

// Mirrors how VVS consumes the store: `const store = useStore()` with NO selector,
// reading nested state directly in render and mutating via methods.

type State = {
	count: number;
	user: { name: string };
	todos: string[];
};

type Methods = {
	increment: () => void;
	setName: (n: string) => void;
	addTodoImmutable: (t: string) => void;
	addTodoPush: (t: string) => void;
	replaceTodos: (t: string[]) => void;
};

function makeStore() {
	return createStore<State, Methods>(
		{ count: 0, user: { name: "" }, todos: [] },
		{
			increment: (store) => () => {
				store.count++;
			},
			setName: (store) => (n: string) => {
				store.user.name = n;
			},
			addTodoImmutable: (store) => (t: string) => {
				store.todos = [...store.todos, t];
			},
			addTodoPush: (store) => (t: string) => {
				store.todos.push(t);
			},
			replaceTodos: (store) => (t: string[]) => {
				store.todos = t;
			},
		},
	);
}

describe("h-state no-selector reactivity (VVS consumption pattern)", () => {
	it("re-renders when a top-level primitive changes", () => {
		const { useStore } = makeStore();
		function View() {
			const store = useStore();
			return (
				<button type="button" onClick={store.increment} data-testid="count">
					{store.count}
				</button>
			);
		}
		render(<View />);
		expect(screen.getByTestId("count")).toHaveTextContent("0");
		fireEvent.click(screen.getByTestId("count"));
		expect(screen.getByTestId("count")).toHaveTextContent("1");
	});

	it("re-renders when a nested object property changes", () => {
		const { useStore } = makeStore();
		function View() {
			const store = useStore();
			return (
				<div>
					<span data-testid="name">{store.user.name}</span>
					<button type="button" onClick={() => store.setName("Gloria")}>
						set
					</button>
				</div>
			);
		}
		render(<View />);
		expect(screen.getByTestId("name")).toHaveTextContent("");
		fireEvent.click(screen.getByText("set"));
		expect(screen.getByTestId("name")).toHaveTextContent("Gloria");
	});

	it("re-renders when an array grows via immutable reassignment", () => {
		const { useStore } = makeStore();
		function View() {
			const store = useStore();
			return (
				<div>
					<span data-testid="len">{store.todos.length}</span>
					<button type="button" onClick={() => store.addTodoImmutable("a")}>
						add
					</button>
				</div>
			);
		}
		render(<View />);
		expect(screen.getByTestId("len")).toHaveTextContent("0");
		fireEvent.click(screen.getByText("add"));
		expect(screen.getByTestId("len")).toHaveTextContent("1");
	});

	it("re-renders when an array grows via .push()", () => {
		const { useStore } = makeStore();
		function View() {
			const store = useStore();
			return (
				<div>
					<span data-testid="len">{store.todos.length}</span>
					<button type="button" onClick={() => store.addTodoPush("a")}>
						add
					</button>
				</div>
			);
		}
		render(<View />);
		expect(screen.getByTestId("len")).toHaveTextContent("0");
		fireEvent.click(screen.getByText("add"));
		expect(screen.getByTestId("len")).toHaveTextContent("1");
	});

	it("re-renders a no-selector component when state changes from OUTSIDE it", () => {
		// Simulates VVS: one component edits state, a sibling reading the same
		// store must reflect it. No shared parent re-render is triggered.
		const { useStore } = makeStore();
		function Display() {
			const store = useStore();
			return <span data-testid="display">{store.count}</span>;
		}
		function Controls() {
			const store = useStore();
			return (
				<button type="button" onClick={store.increment}>
					inc
				</button>
			);
		}
		function App() {
			return (
				<>
					<Display />
					<Controls />
				</>
			);
		}
		render(<App />);
		expect(screen.getByTestId("display")).toHaveTextContent("0");
		fireEvent.click(screen.getByText("inc"));
		expect(screen.getByTestId("display")).toHaveTextContent("1");
	});
});
