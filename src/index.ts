import React from "react";

// ============================================================================
// Pure Signal-Based Reactivity (NO PROXY!)
// ============================================================================

type Listener = () => void;

class Signal<T> {
	private value: T;
	private listeners = new Set<Listener>();

	constructor(initialValue: T) {
		this.value = initialValue;
	}

	get(): T {
		return this.value;
	}

	set(newValue: T): void {
		if (this.value !== newValue) {
			this.value = newValue;
			this.notify();
		}
	}

	notify(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
}

// UID Generator - her update'de unique ID
let globalUid = 0;
function nextUid(): number {
	return ++globalUid;
}

// Batch update system for performance
let batchDepth = 0;
const pendingUpdates = new Set<() => void>();

function scheduleUpdate(fn: () => void): void {
	if (batchDepth > 0) {
		pendingUpdates.add(fn);
	} else {
		fn();
	}
}

function flushUpdates(): void {
	if (pendingUpdates.size > 0) {
		const updates = Array.from(pendingUpdates);
		pendingUpdates.clear();
		for (const update of updates) {
			update();
		}
	}
}

// Batch multiple updates into single notification
export function batch<T>(fn: () => T): T {
	batchDepth++;
	try {
		return fn();
	} finally {
		batchDepth--;
		if (batchDepth === 0) {
			flushUpdates();
		}
	}
}

// ============================================================================
// Reactive Store with Hidden UID Tracking (NO PROXY!)
// ============================================================================

// Hidden field for reactivity tracking
const STATE_ID = Symbol("__state_id");

// Reactive wrapper - adds hidden version field
type ReactiveState<T> = T & {
	readonly [STATE_ID]: number;
};

// Update helper - increments version and notifies (batch-aware)
function markUpdated<T extends Record<string, unknown>>(
	state: ReactiveState<T>,
	signal: Signal<number>,
): void {
	scheduleUpdate(() => {
		const newUid = nextUid();
		(state as Record<string | symbol, unknown>)[STATE_ID] = newUid;
		signal.set(newUid);
	});
}

// ============================================================================
// Recursive Reactive Wrapper (NO PROXY, Type-Safe)
// ============================================================================

// Cache for reactive wrappers to avoid recreating
const reactiveCache = new WeakMap<object, object>();

function makeReactive<T>(
	obj: T,
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>
): T {
	// Skip primitives and special objects
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	// Skip Date, RegExp, etc
	if (obj instanceof Date || obj instanceof RegExp || obj instanceof Array) {
		return obj;
	}

	// Check cache first
	const cached = reactiveCache.get(obj as object);
	if (cached) {
		return cached as T;
	}

	// Create reactive wrapper
	const reactiveObj = {} as T;

	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			const value = obj[key];

			// Check if value is an object that needs deep reactivity
			const isNestedObject =
				value !== null &&
				typeof value === "object" &&
				!(value instanceof Date) &&
				!(value instanceof RegExp) &&
				!(value instanceof Array);

			if (isNestedObject) {
				// Store the raw value
				let currentValue = value;

				Object.defineProperty(reactiveObj, key, {
					get() {
						// Return reactive version of nested object
						return makeReactive(currentValue, rootSignal, rootState);
					},
					set(newValue) {
						if (currentValue === newValue) {
							return;
						}
						// Clear cache for old value
						if (currentValue && typeof currentValue === "object") {
							reactiveCache.delete(currentValue as object);
						}
						currentValue = newValue;
						markUpdated(rootState, rootSignal);
					},
					enumerable: true,
					configurable: true,
				});
			} else {
				// Primitive or array - direct reactive property
				let currentValue = value;

				Object.defineProperty(reactiveObj, key, {
					get() {
						return currentValue;
					},
					set(newValue) {
						if (currentValue === newValue) {
							return;
						}
						currentValue = newValue;
						markUpdated(rootState, rootSignal);
					},
					enumerable: true,
					configurable: true,
				});
			}
		}
	}

	// Cache the reactive object
	reactiveCache.set(obj as object, reactiveObj as object);

	return reactiveObj;
}

// ============================================================================
// Store Type
// ============================================================================

// Store type - sadece state + methods
export type StoreType<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
> = T &
	M & {
		$update: () => void; // Manuel update trigger
		$merge: (partial: Partial<T>) => void; // Helper merge method
	};

// Method creators - store'a tam erişim
export type MethodCreators<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
> = {
	[K in keyof M]: (store: StoreType<T, M>) => M[K];
};

// ============================================================================
// Pure UID-Based Store Creator (NO PROXY!)
// ============================================================================

export function createStore<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
>(
	initial: T,
	methodCreators: MethodCreators<T, M>,
): {
	useStore: () => StoreType<T, M>;
} {
	// Internal state with hidden UID
	const internalState = { ...initial, [STATE_ID]: 0 } as ReactiveState<T>;
	const signal = new Signal<number>(0);

	// Store object with getters/setters
	const store = {} as StoreType<T, M>;

	// Setup reactive properties with getter/setter (Recursive for nested objects)
	for (const key in initial) {
		if (Object.hasOwn(initial, key)) {
			const initialValue = initial[key];
			const isObject =
				initialValue !== null &&
				typeof initialValue === "object" &&
				!(initialValue instanceof Date) &&
				!(initialValue instanceof RegExp) &&
				!(initialValue instanceof Array);

			if (isObject) {
				// Nested object - make it recursively reactive
				Object.defineProperty(store, key, {
					get() {
						const value = (internalState as Record<string, unknown>)[key];
						return makeReactive(value, signal, internalState);
					},
					set(value) {
						const oldValue = (internalState as Record<string, unknown>)[key];
						if (oldValue === value) {
							return;
						}
						// Clear cache for old value
						if (oldValue && typeof oldValue === "object") {
							reactiveCache.delete(oldValue as object);
						}
						(internalState as Record<string, unknown>)[key] = value;
						markUpdated(internalState, signal);
					},
					enumerable: true,
					configurable: true,
				});
			} else {
				// Primitive or array - direct reactive property
				Object.defineProperty(store, key, {
					get() {
						return (internalState as Record<string, unknown>)[key];
					},
					set(value) {
						const oldValue = (internalState as Record<string, unknown>)[key];
						if (oldValue === value) {
							return;
						}
						(internalState as Record<string, unknown>)[key] = value;
						markUpdated(internalState, signal);
					},
					enumerable: true,
					configurable: true,
				});
			}
		}
	}

	// Add $update method (optional - setter already triggers)
	(store as StoreType<T, M>).$update = () => {
		markUpdated(internalState, signal);
	};

	// Add $merge helper with batch optimization
	(store as StoreType<T, M>).$merge = (partial: Partial<T>) => {
		batch(() => {
			for (const key in partial) {
				if (Object.hasOwn(partial, key)) {
					// Use setter to trigger proper reactivity and comparison
					(store as Record<string, unknown>)[key] = partial[key];
				}
			}
		});
	};

	// Add custom methods
	for (const methodName of Object.keys(methodCreators)) {
		const creator = methodCreators[methodName];
		if (!creator) {
			console.error(`Method creator for ${methodName} not found`);
			continue;
		}
		const method = creator(store);
		Object.assign(store, { [methodName]: method });
	}

	// React hook - subscribes to UID signal
	function useStore(): StoreType<T, M> {
		const [, setCounter] = React.useState(0);

		React.useEffect(() => {
			return signal.subscribe(() => {
				setCounter((prev: number) => prev + 1);
			});
		}, []);

		return store;
	}

	return { useStore };
}

