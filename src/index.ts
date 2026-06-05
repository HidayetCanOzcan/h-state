import React from "react";
import { STATE_ID } from "./types";
import type { HistoryState, Listener, MethodCreators, MigrateFn, PersistOptions, ReactiveState, StoreOptions, StoreType } from "./types";

const VERSION_KEY = "__hs_v";
const DATA_KEY = "__hs_d";

function isPlainObject(v: unknown): v is Record<string, unknown> {
	if (v === null || typeof v !== "object") return false;
	if (Array.isArray(v)) return false;
	if (v instanceof Date || v instanceof RegExp) return false;
	const proto = Object.getPrototypeOf(v);
	return proto === Object.prototype || proto === null;
}

// Structural equality for plain (already-serialized) snapshot values.
function plainEquals(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
	const aArr = Array.isArray(a);
	const bArr = Array.isArray(b);
	if (aArr !== bArr) return false;
	if (aArr && bArr) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (!plainEquals(a[i], b[i])) return false;
		}
		return true;
	}
	const aObj = a as Record<string, unknown>;
	const bObj = b as Record<string, unknown>;
	const aKeys = Object.keys(aObj);
	const bKeys = Object.keys(bObj);
	if (aKeys.length !== bKeys.length) return false;
	for (const key of aKeys) {
		if (!Object.hasOwn(bObj, key) || !plainEquals(aObj[key], bObj[key])) return false;
	}
	return true;
}

function deepMerge<T extends Record<string, unknown>>(
	base: T,
	override: Partial<T>,
): T {
	const result: Record<string, unknown> = { ...base };
	for (const key of Object.keys(override)) {
		const baseVal = (base as Record<string, unknown>)[key];
		const overrideVal = (override as Record<string, unknown>)[key];
		if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
			result[key] = deepMerge(baseVal, overrideVal as Partial<typeof baseVal>);
		} else {
			result[key] = overrideVal;
		}
	}
	return result as T;
}

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
const pendingFlushes = new Set<() => void>();

export function batch<T>(fn: () => T): T {
	batchDepth++;
	try {
		return fn();
	} finally {
		batchDepth--;
		if (batchDepth === 0 && pendingFlushes.size > 0) {
			const flushes = Array.from(pendingFlushes);
			pendingFlushes.clear();
			for (const flush of flushes) flush();
		}
	}
}

function markUpdated<T extends Record<string, unknown>>(
	state: ReactiveState<T>,
	signal: Signal<number>,
): void {
	const flush = () => {
		const newUid = nextUid();
		(state as Record<string | symbol, unknown>)[STATE_ID] = newUid;
		signal.set(newUid);
	};
	if (batchDepth > 0) {
		// Coalesce: only one flush per (state,signal) pair is needed within a batch.
		pendingFlushes.add(flush);
	} else {
		flush();
	}
}

const reactiveCache = new WeakMap<object, object>();
const reactiveObjects = new WeakSet<object>();
const trackedArrays = new WeakSet<unknown[]>();

function wrapArrayElements(
	arr: unknown[],
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>,
): void {
	for (let i = 0; i < arr.length; i++) {
		const el = arr[i];
		if (el === null || typeof el !== "object") continue;
		if (el instanceof Date || el instanceof RegExp) continue;
		if (Array.isArray(el)) {
			trackArray(el as unknown[], rootSignal, rootState);
		} else if (!reactiveObjects.has(el as object)) {
			// Newly added (raw) element — wrap it so nested mutations propagate.
			arr[i] = makeReactive(el, rootSignal, rootState);
		}
	}
}

const ARRAY_MUTATION_METHODS = [
	"push",
	"pop",
	"shift",
	"unshift",
	"splice",
	"sort",
	"reverse",
	"fill",
	"copyWithin",
] as const;

function trackArray(
	arr: unknown[],
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>,
): unknown[] {
	if (trackedArrays.has(arr)) return arr;
	trackedArrays.add(arr);

	for (const method of ARRAY_MUTATION_METHODS) {
		const original = Array.prototype[method] as (...a: unknown[]) => unknown;
		Object.defineProperty(arr, method, {
			value: function (this: unknown[], ...args: unknown[]) {
				const result = original.apply(this, args);
				// Wrap any newly inserted (raw) object elements so their nested
				// mutations stay reactive — push/unshift/splice/fill add fresh items.
				wrapArrayElements(this, rootSignal, rootState);
				markUpdated(rootState, rootSignal);
				return result;
			},
			enumerable: false,
			writable: true,
			configurable: true,
		});
	}

	// Eagerly wrap object/array elements so nested mutations propagate.
	wrapArrayElements(arr, rootSignal, rootState);

	return arr;
}

function makeReactive<T>(
	obj: T,
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>
): T {

	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (obj instanceof Date || obj instanceof RegExp) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return trackArray(obj as unknown[], rootSignal, rootState) as unknown as T;
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
				!(value instanceof RegExp);

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
	reactiveObjects.add(reactiveObj as object);

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

function hydrate<T extends Record<string, unknown>>(
	raw: unknown,
	initial: T,
	version: number,
	migrate: MigrateFn | undefined,
	onError: (e: Error) => void,
	useDeepMerge: boolean,
): T {
	if (!isPlainObject(raw)) return initial;

	let payload: Record<string, unknown>;
	let persistedVersion = 0;

	// Envelope format: { __hs_v: N, __hs_d: {...} }
	if (VERSION_KEY in raw && DATA_KEY in raw) {
		const v = raw[VERSION_KEY];
		persistedVersion = typeof v === "number" ? v : 0;
		const d = raw[DATA_KEY];
		payload = isPlainObject(d) ? d : {};
	} else {
		// Legacy: raw object is the state itself at version 0.
		payload = raw;
		persistedVersion = 0;
	}

	if (persistedVersion !== version) {
		if (!migrate) {
			// No migration provided: discard.
			return initial;
		}
		try {
			payload = migrate(payload, persistedVersion);
			if (!isPlainObject(payload)) return initial;
		} catch (e) {
			onError(e as Error);
			return initial;
		}
	}

	return useDeepMerge
		? deepMerge(initial, payload as Partial<T>)
		: ({ ...initial, ...(payload as Partial<T>) } as T);
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
	storeOptions?: StoreOptions,
): {
	useStore: () => StoreType<T, M>;
	store: StoreType<T, M>;
} {
	// Parse persistence options with defaults
	const persist = {
		enabled: persistOptions?.enabled ?? false,
		key: persistOptions?.key ?? generateStorageKey(),
		debounce: persistOptions?.debounce ?? 0,
		serialize: persistOptions?.serialize ?? defaultSerialize,
		deserialize: persistOptions?.deserialize ?? defaultDeserialize,
		onError:
			persistOptions?.onError ?? ((error: Error) => console.error("H-State Persist Error:", error)),
		version: persistOptions?.version ?? 0,
		migrate: persistOptions?.migrate,
		deepMerge: persistOptions?.deepMerge ?? true,
	};

	// Try to restore from localStorage (with version / migrate / deep-merge handling)
	let mergedInitial: T = initial;
	if (persist.enabled && isLocalStorageAvailable()) {
		try {
			const stored = localStorage.getItem(persist.key);
			if (stored) {
				const parsed = persist.deserialize(stored);
				mergedInitial = hydrate(
					parsed,
					initial,
					persist.version,
					persist.migrate,
					persist.onError,
					persist.deepMerge,
				);
			}
		} catch (error) {
			persist.onError(error as Error);
		}
	}

	const internalState = { ...mergedInitial, [STATE_ID]: 0 } as ReactiveState<T>;
	const signal = new Signal<number>(0);

	const store = {} as StoreType<T, M>;

	// Subscribe to signal for automatic persistence
	if (persist.enabled) {
		signal.subscribe(() => {
			dirtySinceLastSave = true;
			schedulePersist();
		});
	}

	// Debounce / microtask scheduling for persistence
	let persistTimer: ReturnType<typeof setTimeout> | null = null;
	let persistMicrotaskScheduled = false;
	let dirtySinceLastSave = false;

	// Save state to localStorage
	const saveToStorage = () => {
		if (!persist.enabled || !isLocalStorageAvailable()) {
			return;
		}
		if (!dirtySinceLastSave) {
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

			const envelope: Record<string, unknown> = {
				[VERSION_KEY]: persist.version,
				[DATA_KEY]: stateToSave,
			};
			const serialized = persist.serialize(envelope);
			localStorage.setItem(persist.key, serialized);
			dirtySinceLastSave = false;
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
		} else if (!persistMicrotaskScheduled) {
			// Coalesce many synchronous updates into a single microtask write.
			persistMicrotaskScheduled = true;
			queueMicrotask(() => {
				persistMicrotaskScheduled = false;
				saveToStorage();
			});
		}
	};

	for (const key in initial) {
		if (Object.hasOwn(initial, key)) {
			const initialValue = (internalState as Record<string, unknown>)[key];
			const isObject =
				initialValue !== null &&
				typeof initialValue === "object" &&
				!(initialValue instanceof Date) &&
				!(initialValue instanceof RegExp);

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

	// Deep-clone a value into plain data, reading THROUGH the reactive layer.
	// Nested mutations live in the reactive wrappers (closures), not on the raw
	// internalState, so we must traverse via the reactive accessors.
	const toPlain = (value: unknown): unknown => {
		if (value === null || typeof value !== "object") return value;
		if (value instanceof Date || value instanceof RegExp) return value;
		if (Array.isArray(value)) return value.map((el) => toPlain(el));
		const out: Record<string, unknown> = {};
		for (const k in value as Record<string, unknown>) {
			out[k] = toPlain((value as Record<string, unknown>)[k]);
		}
		return out;
	};

	// Build a plain, non-reactive snapshot containing only state keys.
	const getPlainState = (): T => {
		const snapshot: Record<string, unknown> = {};
		for (const key in initial) {
			if (Object.hasOwn(initial, key)) {
				snapshot[key] = toPlain((store as Record<string, unknown>)[key]);
			}
		}
		return snapshot as T;
	};

	(store as StoreType<T, M>).$getState = getPlainState;

	(store as StoreType<T, M>).$subscribe = (listener) => {
		let prev = getPlainState();
		return signal.subscribe(() => {
			const next = getPlainState();
			const previous = prev;
			prev = next;
			listener(next, previous);
		});
	};

	(store as StoreType<T, M>).$subscribeWithSelector = (
		selector,
		listener,
		equalityFn = Object.is,
	) => {
		let prevSelected = selector(getPlainState());
		return signal.subscribe(() => {
			const nextSelected = selector(getPlainState());
			if (equalityFn(prevSelected, nextSelected)) return;
			const previous = prevSelected;
			prevSelected = nextSelected;
			listener(nextSelected, previous);
		});
	};

	// ----------------------------------------------------------------------
	// Time travel (undo / redo) — opt-in via storeOptions.history
	// ----------------------------------------------------------------------
	const historyOpt = storeOptions?.history;
	const historyEnabled = historyOpt === true || (typeof historyOpt === "object" && (historyOpt.enabled ?? true));
	const historyLimit =
		typeof historyOpt === "object" && typeof historyOpt.limit === "number" ? historyOpt.limit : 100;

	const past: T[] = [];
	const future: T[] = [];
	let lastSnapshot: T = getPlainState();
	// Guards: skip history-recording / cross-tab broadcast while applying internal state writes.
	let isInternalApply = false;

	const applySnapshot = (snapshot: T) => {
		isInternalApply = true;
		batch(() => {
			const current = store as Record<string, unknown>;
			const next = snapshot as Record<string, unknown>;
			for (const key in initial) {
				if (!Object.hasOwn(initial, key)) continue;
				// Only write keys that actually changed: avoids replacing untouched
				// subtrees and keeps notifications minimal (one per changed key).
				if (!plainEquals(toPlain(current[key]), next[key])) {
					current[key] = next[key];
				}
			}
		});
		isInternalApply = false;
		lastSnapshot = getPlainState();
	};
	const restoreSnapshot = applySnapshot;

	if (historyEnabled) {
		signal.subscribe(() => {
			if (isInternalApply) return;
			past.push(lastSnapshot);
			if (past.length > historyLimit) past.shift();
			future.length = 0;
			lastSnapshot = getPlainState();
		});
	}

	// ----------------------------------------------------------------------
	// Cross-tab sync — opt-in via storeOptions.syncTabs (BroadcastChannel)
	// ----------------------------------------------------------------------
	const syncOpt = storeOptions?.syncTabs;
	const syncEnabled = syncOpt === true || (typeof syncOpt === "object" && (syncOpt.enabled ?? true));
	const syncChannelName =
		(typeof syncOpt === "object" && syncOpt.channel) ||
		(persist.enabled ? persist.key : undefined) ||
		"h-state";
	let broadcastChannel: BroadcastChannel | null = null;

	if (syncEnabled && typeof BroadcastChannel !== "undefined") {
		broadcastChannel = new BroadcastChannel(syncChannelName);
		broadcastChannel.onmessage = (event: MessageEvent) => {
			const data = event.data as { __hs_sync?: boolean; state?: T } | null;
			if (!data || data.__hs_sync !== true || !data.state) return;
			applySnapshot(data.state);
		};
		signal.subscribe(() => {
			if (isInternalApply || !broadcastChannel) return;
			broadcastChannel.postMessage({ __hs_sync: true, state: getPlainState() });
		});
	}

	(store as StoreType<T, M>).$destroy = () => {
		if (broadcastChannel) {
			broadcastChannel.onmessage = null;
			broadcastChannel.close();
			broadcastChannel = null;
		}
	};

	(store as StoreType<T, M>).$transaction = <R>(fn: () => R): R => {
		// Capture the committed state, then suppress history/broadcast for every
		// intermediate write so the whole block lands as one atomic step.
		const snapshot = getPlainState();
		const prevInternal = isInternalApply;
		isInternalApply = true;
		let result: R;
		try {
			result = batch(fn);
		} catch (error) {
			isInternalApply = prevInternal;
			// Roll back any partial mutations to the pre-transaction state.
			applySnapshot(snapshot);
			throw error;
		}
		isInternalApply = prevInternal;
		// Commit: record a single history entry + broadcast once (only if changed).
		const nextSnapshot = getPlainState();
		if (!plainEquals(snapshot, nextSnapshot)) {
			if (historyEnabled) {
				past.push(snapshot);
				if (past.length > historyLimit) past.shift();
				future.length = 0;
				lastSnapshot = nextSnapshot;
			}
			if (broadcastChannel && !prevInternal) {
				broadcastChannel.postMessage({ __hs_sync: true, state: nextSnapshot });
			}
		}
		return result;
	};

	(store as StoreType<T, M>).$undo = () => {
		if (!historyEnabled || past.length === 0) return false;
		const previous = past.pop() as T;
		future.push(lastSnapshot);
		restoreSnapshot(previous);
		return true;
	};

	(store as StoreType<T, M>).$redo = () => {
		if (!historyEnabled || future.length === 0) return false;
		const next = future.pop() as T;
		past.push(lastSnapshot);
		restoreSnapshot(next);
		return true;
	};

	(store as StoreType<T, M>).$clearHistory = () => {
		past.length = 0;
		future.length = 0;
	};

	(store as StoreType<T, M>).$history = (): HistoryState => ({
		canUndo: historyEnabled && past.length > 0,
		canRedo: historyEnabled && future.length > 0,
		past: past.length,
		future: future.length,
	});

	(store as StoreType<T, M>).$reset = () => {
		batch(() => {
			for (const key in initial) {
				if (Object.hasOwn(initial, key)) {
					(store as Record<string, unknown>)[key] = (initial as Record<string, unknown>)[key];
				}
			}
		});
		if (persist.enabled && isLocalStorageAvailable()) {
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

	const subscribeToSignal = (cb: () => void): (() => void) => signal.subscribe(cb);

	function useStore(): StoreType<T, M>;
	function useStore<R>(
		selector: (s: StoreType<T, M>) => R,
		equalityFn?: (a: R, b: R) => boolean,
	): R;
	function useStore<R>(
		selector?: (s: StoreType<T, M>) => R,
		equalityFn: (a: R, b: R) => boolean = Object.is,
	): R | StoreType<T, M> {
		const cacheRef = React.useRef<{ uid: number; value: R } | null>(null);

		// A single subscription drives re-renders. With NO selector the reactive
		// value is the stable `store` reference itself, which cannot double as the
		// change signal — useSyncExternalStore bails out on Object.is-equal
		// snapshots, so the component would never re-render. Instead we snapshot
		// the version `uid` (which advances on every update) and hand back the
		// live `store`. With a selector we snapshot the memoised selected slice.
		const getSnapshot = (): R | number => {
			const uid = signal.get();
			if (!selector) return uid;
			const cached = cacheRef.current;
			if (cached && cached.uid === uid) return cached.value;
			const next = selector(store);
			if (cached && equalityFn(cached.value, next)) {
				cacheRef.current = { uid, value: cached.value };
				return cached.value;
			}
			cacheRef.current = { uid, value: next };
			return next;
		};

		const snapshot = React.useSyncExternalStore(subscribeToSignal, getSnapshot, getSnapshot);
		return selector ? (snapshot as R) : store;
	}

	return { useStore, store };
}

// Re-export types for convenience
export type { PersistOptions, StoreType, MethodCreators, StoreOptions, HistoryOptions, HistoryState, SyncTabsOptions } from "./types";

