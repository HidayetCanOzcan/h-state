import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createStore } from "../index";

// Mirrors the REAL demo usage: a list is mapped to rows and the user mutates a
// specific element (checkbox / text) by index — including elements that were
// just inserted via push/unshift/splice. The original suite only asserted
// `.length`, so it never exercised nested mutation on a freshly inserted
// element and therefore MISSED the bug. These tests interact with the actual
// rendered controls of each row, which is what a user does.

type Meta = { pinned: boolean };
type Todo = { id: number; text: string; done: boolean; meta: Meta };

type State = { todos: Todo[]; nextId: number };

type Methods = {
	pushItem: () => void;
	unshiftItem: () => void;
	spliceInsertMiddle: () => void;
	toggleAt: (index: number) => void;
	editAt: (index: number, text: string) => void;
	togglePinnedAt: (index: number) => void;
};

const seed = (): Todo[] => [
	{ id: 1, text: "alpha", done: false, meta: { pinned: false } },
	{ id: 2, text: "beta", done: false, meta: { pinned: false } },
];

function makeStore() {
	return createStore<State, Methods>(
		{ todos: seed(), nextId: 3 },
		{
			pushItem: (store) => () => {
				store.todos.push({ id: store.nextId, text: `new-${store.nextId}`, done: false, meta: { pinned: false } });
				store.nextId++;
			},
			unshiftItem: (store) => () => {
				store.todos.unshift({ id: store.nextId, text: `new-${store.nextId}`, done: false, meta: { pinned: false } });
				store.nextId++;
			},
			spliceInsertMiddle: (store) => () => {
				store.todos.splice(1, 0, { id: store.nextId, text: `new-${store.nextId}`, done: false, meta: { pinned: false } });
				store.nextId++;
			},
			toggleAt: (store) => (index: number) => {
				store.todos[index].done = !store.todos[index].done;
			},
			editAt: (store) => (index: number, text: string) => {
				store.todos[index].text = text;
			},
			togglePinnedAt: (store) => (index: number) => {
				// Deep nested mutation: element.meta.pinned
				store.todos[index].meta.pinned = !store.todos[index].meta.pinned;
			},
		},
	);
}

function List({ useStore }: { useStore: ReturnType<typeof makeStore>["useStore"] }) {
	const store = useStore();
	return (
		<div>
			<button type="button" onClick={store.pushItem}>push</button>
			<button type="button" onClick={store.unshiftItem}>unshift</button>
			<button type="button" onClick={store.spliceInsertMiddle}>splice-insert</button>
			<ul>
				{store.todos.map((todo, index) => (
					<li key={todo.id} data-testid={`row-${todo.id}`}>
						<input
							type="checkbox"
							aria-label="done"
							checked={todo.done}
							onChange={() => store.toggleAt(index)}
						/>
						<input
							aria-label="text"
							value={todo.text}
							onChange={(e) => store.editAt(index, e.target.value)}
						/>
						<span data-testid="done">{String(todo.done)}</span>
						<span data-testid="pinned">{String(todo.meta.pinned)}</span>
						<button type="button" aria-label="pin" onClick={() => store.togglePinnedAt(index)}>
							pin
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

function row(id: number) {
	return within(screen.getByTestId(`row-${id}`));
}

describe("array element regression: nested mutation on freshly inserted elements", () => {
	it("toggles done on an element added via push()", () => {
		const { useStore } = makeStore();
		render(<List useStore={useStore} />);
		fireEvent.click(screen.getByText("push")); // adds id=3 at end
		expect(row(3).getByTestId("done")).toHaveTextContent("false");
		fireEvent.click(row(3).getByLabelText("done"));
		expect(row(3).getByTestId("done")).toHaveTextContent("true");
	});

	it("toggles done on an element added via unshift()", () => {
		const { useStore } = makeStore();
		render(<List useStore={useStore} />);
		fireEvent.click(screen.getByText("unshift")); // adds id=3 at front
		fireEvent.click(row(3).getByLabelText("done"));
		expect(row(3).getByTestId("done")).toHaveTextContent("true");
	});

	it("toggles done on an element inserted via splice()", () => {
		const { useStore } = makeStore();
		render(<List useStore={useStore} />);
		fireEvent.click(screen.getByText("splice-insert")); // adds id=3 at index 1
		fireEvent.click(row(3).getByLabelText("done"));
		expect(row(3).getByTestId("done")).toHaveTextContent("true");
	});

	it("edits text on a freshly pushed element", () => {
		const { useStore } = makeStore();
		render(<List useStore={useStore} />);
		fireEvent.click(screen.getByText("push"));
		fireEvent.change(row(3).getByLabelText("text"), { target: { value: "edited" } });
		expect(row(3).getByLabelText("text")).toHaveValue("edited");
	});

	it("mutates a DEEPLY nested property (element.meta.pinned) on a pushed element", () => {
		const { useStore } = makeStore();
		render(<List useStore={useStore} />);
		fireEvent.click(screen.getByText("push"));
		expect(row(3).getByTestId("pinned")).toHaveTextContent("false");
		fireEvent.click(row(3).getByLabelText("pin"));
		expect(row(3).getByTestId("pinned")).toHaveTextContent("true");
	});

	it("still tracks the ORIGINAL seeded elements after inserts", () => {
		const { useStore } = makeStore();
		render(<List useStore={useStore} />);
		fireEvent.click(screen.getByText("push"));
		fireEvent.click(row(1).getByLabelText("done"));
		expect(row(1).getByTestId("done")).toHaveTextContent("true");
	});
});
