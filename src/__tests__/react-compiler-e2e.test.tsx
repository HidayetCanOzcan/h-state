/**
 * End-to-end React Compiler compatibility.
 *
 * THIS FILE IS COMPILED WITH babel-plugin-react-compiler (see jest.config.js),
 * so every component below runs with the exact memoization a production app
 * gets under `reactCompiler: true`. Before the fresh-identity reactivity core,
 * no-selector `useStore()` components rendered stale UI here: the compiler
 * cached JSX against stable store/container references that in-place mutations
 * never changed.
 */
import * as React from "react";
import { act, render } from "@testing-library/react";
import { createStore } from "../index";

type Todo = { id: number; text: string; done: boolean };

const makeStore = () =>
	createStore(
		{
			todos: [{ id: 1, text: "first", done: false }] as Todo[],
			profile: { name: "ada", theme: { mode: "light" } },
			panelOpen: false,
		},
		{},
	);

describe("react compiler e2e (components compiled with babel-plugin-react-compiler)", () => {
	it("sanity: this suite really is compiled (memo cache present in output)", () => {
		function Probe() {
			return <span>probe</span>;
		}
		render(<Probe />);
		// Compiled components read a memo cache from react/compiler-runtime,
		// visible in the emitted source as `$[...]` slot accesses.
		expect(Probe.toString()).toContain("$[");
	});

	it("list updates when an array is mutated in place (push)", () => {
		const { useStore, store } = makeStore();

		function TodoList() {
			const s = useStore();
			return (
				<ul data-testid="list">
					{s.todos.map((t) => (
						<li key={t.id}>{t.text}</li>
					))}
				</ul>
			);
		}

		const { container } = render(<TodoList />);
		expect(container.querySelectorAll("li")).toHaveLength(1);

		act(() => {
			store.todos.push({ id: 2, text: "second", done: false });
		});

		expect(container.querySelectorAll("li")).toHaveLength(2);
		expect(container.textContent).toContain("second");
	});

	it("nested object field mutation reaches memoized JSX", () => {
		const { useStore, store } = makeStore();

		function Header() {
			const s = useStore();
			return (
				<div>
					<h1>{s.profile.name}</h1>
					<p>{s.profile.theme.mode}</p>
				</div>
			);
		}

		const { container } = render(<Header />);
		expect(container.textContent).toContain("light");

		act(() => {
			store.profile.theme.mode = "dark";
		});
		expect(container.textContent).toContain("dark");

		act(() => {
			store.profile.name = "grace";
		});
		expect(container.textContent).toContain("grace");
	});

	it("components mount/unmount on store-driven conditions", () => {
		const { useStore, store } = makeStore();

		function Panel() {
			return <aside data-testid="panel">panel</aside>;
		}
		function Page() {
			const s = useStore();
			return <main>{s.panelOpen ? <Panel /> : null}</main>;
		}

		const { queryByTestId } = render(<Page />);
		expect(queryByTestId("panel")).toBeNull();

		act(() => {
			store.panelOpen = true;
		});
		expect(queryByTestId("panel")).not.toBeNull();

		act(() => {
			store.panelOpen = false;
		});
		expect(queryByTestId("panel")).toBeNull();
	});

	it("memoized child receiving a container prop re-renders on deep mutation", () => {
		const { useStore, store } = makeStore();
		let childRenders = 0;

		const Child = React.memo(function Child({ todo }: { todo: Todo }) {
			childRenders++;
			return <span>{todo.text}</span>;
		});

		function Parent() {
			const s = useStore();
			return <Child todo={s.todos[0]} />;
		}

		const { container } = render(<Parent />);
		expect(container.textContent).toBe("first");
		const rendersBefore = childRenders;

		act(() => {
			store.todos[0].text = "edited";
		});
		expect(container.textContent).toBe("edited");
		expect(childRenders).toBeGreaterThan(rendersBefore);

		// Unrelated update: child keeps its memoized render (identity untouched).
		const rendersAfterEdit = childRenders;
		act(() => {
			store.panelOpen = true;
		});
		expect(childRenders).toBe(rendersAfterEdit);
	});

	it("updates triggered from event handlers inside compiled components", () => {
		const { useStore } = makeStore();

		function Counter() {
			const s = useStore();
			return (
				<button onClick={() => s.todos.push({ id: s.todos.length + 1, text: `t${s.todos.length + 1}`, done: false })}>
					{s.todos.length}
				</button>
			);
		}

		const { getByRole } = render(<Counter />);
		const button = getByRole("button");
		expect(button.textContent).toBe("1");

		act(() => {
			button.click();
		});
		expect(button.textContent).toBe("2");

		act(() => {
			button.click();
		});
		expect(button.textContent).toBe("3");
	});
});
