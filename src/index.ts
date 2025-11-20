import React from "react";
import { Listener, MethodCreators, PersistOptions, ReactiveState, STATE_ID, StoreType } from "./types";

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

let globalUid = 0;
function nextUid(): number {
	return ++globalUid;
}

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

const reactiveCache = new WeakMap<object, object>();

function makeReactive<T>(
	obj: T,
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>
): T {
	
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (obj instanceof Date || obj instanceof RegExp || obj instanceof Array) {
		return obj;
	}
	
	const cached = reactiveCache.get(obj as object);
	if (cached) {
		return cached as T;
	}
	
	const reactiveObj = {} as T;

	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			const value = obj[key];
			
			const isNestedObject =
				value !== null &&
				typeof value === "object" &&
				!(value instanceof Date) &&
				!(value instanceof RegExp) &&
				!(value instanceof Array);

			if (isNestedObject) {
				
				let currentValue = value;

				Object.defineProperty(reactiveObj, key, {
					get() {
						
						return makeReactive(currentValue, rootSignal, rootState);
					},
					set(newValue) {
						if (currentValue === newValue) {
							return;
						}
						
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
	
	reactiveCache.set(obj as object, reactiveObj as object);

	return reactiveObj;
}

// ============================================================================
// Persistence Utilities
// ============================================================================

// Check if localStorage is available (SSR guard)
function isLocalStorageAvailable(): boolean {
	try {
		return typeof window !== "undefined" && window.localStorage !== null;
	} catch {
		return false;
	}
}

// Generate storage key from state object
let storeCounter = 0;
function generateStorageKey(prefix = "h-state"): string {
	return `${prefix}-store-${++storeCounter}`;
}

// Default serializer
function defaultSerialize(state: Record<string, unknown>): string {
	return JSON.stringify(state);
}

// Default deserializer
function defaultDeserialize(data: string): Record<string, unknown> {
	return JSON.parse(data) as Record<string, unknown>;
}

// ============================================================================
// Store Creator with Persistence
// ============================================================================

export function createStore<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
>(
	initial: T,
	methodCreators: MethodCreators<T, M>,
	persistOptions?: PersistOptions,
): {
	useStore: () => StoreType<T, M>;
} {
	// Parse persistence options with defaults
	const persist = {
		enabled: persistOptions?.enabled ?? false,
		key: persistOptions?.key ?? generateStorageKey(),
		debounce: persistOptions?.debounce ?? 0,
		serialize: persistOptions?.serialize ?? defaultSerialize,
		deserialize: persistOptions?.deserialize ?? defaultDeserialize,
		onError: persistOptions?.onError ?? ((error: Error) => console.error("H-State Persist Error:", error)),
	};

	// Try to restore from localStorage
	let restoredState: Partial<T> | null = null;
	if (persist.enabled && isLocalStorageAvailable()) {
		try {
			const stored = localStorage.getItem(persist.key);
			if (stored) {
				restoredState = persist.deserialize(stored) as Partial<T>;
			}
		} catch (error) {
			persist.onError(error as Error);
		}
	}

	// Merge initial state with restored state
	const mergedInitial = restoredState ? { ...initial, ...restoredState } : initial;
	
	const internalState = { ...mergedInitial, [STATE_ID]: 0 } as ReactiveState<T>;
	const signal = new Signal<number>(0);
	
	const store = {} as StoreType<T, M>;

	// Subscribe to signal for automatic persistence
	if (persist.enabled) {
		signal.subscribe(() => {
			schedulePersist();
		});
	}

	// Debounce timer for persistence
	let persistTimer: ReturnType<typeof setTimeout> | null = null;

	// Save state to localStorage
	const saveToStorage = () => {
		if (!persist.enabled || !isLocalStorageAvailable()) {
			return;
		}

		try {
			// Extract only state properties (exclude methods and symbols)
			const stateToSave: Record<string, unknown> = {};
			for (const key in initial) {
				if (Object.hasOwn(initial, key)) {
					stateToSave[key] = (internalState as Record<string, unknown>)[key];
				}
			}

			const serialized = persist.serialize(stateToSave);
			localStorage.setItem(persist.key, serialized);
		} catch (error) {
			persist.onError(error as Error);
		}
	};

	// Debounced save
	const schedulePersist = () => {
		if (!persist.enabled) {
			return;
		}

		if (persistTimer) {
			clearTimeout(persistTimer);
		}

		if (persist.debounce > 0) {
			persistTimer = setTimeout(saveToStorage, persist.debounce);
		} else {
			saveToStorage();
		}
	};

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
	
	(store as StoreType<T, M>).$update = () => {
		markUpdated(internalState, signal);
	};
	
	(store as StoreType<T, M>).$merge = (partial: Partial<T>) => {
		batch(() => {
			for (const key in partial) {
				if (Object.hasOwn(partial, key)) {
					
					(store as Record<string, unknown>)[key] = partial[key];
				}
			}
		});
	};

	// Persistence methods
	(store as StoreType<T, M>).$persist = () => {
		saveToStorage();
	};

	(store as StoreType<T, M>).$clearPersist = () => {
		if (isLocalStorageAvailable()) {
			try {
				localStorage.removeItem(persist.key);
			} catch (error) {
				persist.onError(error as Error);
			}
		}
	};
	
	for (const methodName of Object.keys(methodCreators)) {
		const creator = methodCreators[methodName];
		if (!creator) {
			console.error(`Method creator for ${methodName} not found`);
			continue;
		}
		const method = creator(store);
		Object.assign(store, { [methodName]: method });
	}
	
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

// Re-export types for convenience
export type { PersistOptions, StoreType, MethodCreators } from "./types";

