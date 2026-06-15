import React from "react";
import { STATE_ID } from "./types";
import type { HistoryState, Listener, MethodCreators, MigrateFn, PersistOptions, ReactiveState, StoreOptions, StoreType, UseStore } from "./types";

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

// Deep-clone plain data (objects/arrays). Dates are copied; anything else
// (class instances, functions) is kept by reference. Used to detach the
// store's canonical state from caller-owned objects: reactivity writes back
// into the canonical raw graph, which must never alias the `initial` the
// caller passed in (otherwise $reset would compare against mutated data).
function deepClonePlain<T>(value: T): T {
	if (value === null || typeof value !== "object") return value;
	if (value instanceof Date) return new Date(value.getTime()) as unknown as T;
	if (value instanceof RegExp) return value;
	if (Array.isArray(value)) return value.map((el) => deepClonePlain(el)) as unknown as T;
	if (!isPlainObject(value)) return value;
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		out[key] = deepClonePlain((value as Record<string, unknown>)[key]);
	}
	return out as T;
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

// ============================================================================
// Reactivity core — write-back wrappers + fresh container identity
// ============================================================================
//
// The canonical state lives in the raw graph (plain objects holding plain
// values, arrays holding wrapped elements). Object wrappers are pure VIEWS:
// every get/set goes through to the raw object, so any number of coexisting
// wrappers for the same raw stay consistent.
//
// Identity contract (the React Compiler / memoization contract):
// after a mutation, the next read of the mutated container — and of every
// ancestor container up to the store root — returns a NEW reference, while
// untouched containers keep their identity. The React Compiler (and useMemo /
// React.memo / useEffect deps) compare dependency values with Object.is, so
// in-place mutation behind a stable reference is invisible to them. Fresh
// identity per change makes h-state stores safe under `reactCompiler: true`
// without `'use no memo'` directives.
//
// Objects get a freshly built wrapper (cheap: accessors only). Arrays cannot
// be wrapped without Proxy, so each change starts a new "generation": a
// shallow clone that becomes canonical. All generations of an array share an
// ArrayCell; mutation methods always operate on the latest generation, so
// mutating through a captured stale reference still lands canonically.

class ArrayCell {
	current: unknown[];
	dirty = false;
	epoch: number;
	constructor(current: unknown[], epoch: number) {
		this.current = current;
		this.epoch = epoch;
	}
}

type ParentNode = object | ArrayCell | null;

// wrapper-view bookkeeping (raw object → its current wrapper, and back)
const reactiveCache = new WeakMap<object, { wrapper: object; epoch: number }>();
const reactiveObjects = new WeakSet<object>();
const wrapperRaw = new WeakMap<object, object>();
// every generation of a tracked array → its shared cell
const arrayCells = new WeakMap<unknown[], ArrayCell>();
// child container (raw object or ArrayCell) → parent container, for dirty propagation
const parentOf = new WeakMap<object, ParentNode>();
// per-store: epoch (bumped by $update to force-refresh all identities) and identity mode
const rootEpoch = new WeakMap<object, number>();
const rootStable = new WeakSet<object>();

function epochOf(rootState: object): number {
	return rootEpoch.get(rootState) ?? 0;
}

// Replace a wrapper with its raw object before storing it into the canonical
// graph, so raws never nest wrappers (a wrapper assigned from elsewhere in
// the store, e.g. `store.a = store.b.user`, stays a live alias of the raw).
function unwrapValue<V>(value: V): V {
	if (value !== null && typeof value === "object" && reactiveObjects.has(value as object)) {
		return (wrapperRaw.get(value as object) ?? value) as V;
	}
	return value;
}

// Invalidate the identity of a mutated container and every ancestor: deleted
// cache entries rebuild object wrappers on next read; dirty cells clone their
// array on next read. No-op for `identity: 'stable'` stores.
function markDirty(node: object | ArrayCell, rootState: object): void {
	if (rootStable.has(rootState)) return;
	let n: ParentNode = node;
	while (n) {
		if (n instanceof ArrayCell) {
			n.dirty = true;
		} else {
			reactiveCache.delete(n);
		}
		n = parentOf.get(n as object) ?? null;
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

function patchArrayMethods(
	arr: unknown[],
	cell: ArrayCell,
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>,
): void {
	for (const method of ARRAY_MUTATION_METHODS) {
		const original = Array.prototype[method] as (...a: unknown[]) => unknown;
		Object.defineProperty(arr, method, {
			value: function (...args: unknown[]) {
				// Mutate the latest generation, whichever generation was captured —
				// stale references must not fork the canonical state.
				const target = cell.current;
				const result = original.apply(target, args);
				// Wrap any newly inserted (raw) object elements so their nested
				// mutations stay reactive — push/unshift/splice/fill add fresh items.
				wrapArrayElements(target, cell, rootSignal, rootState);
				markDirty(cell, rootState);
				markUpdated(rootState, rootSignal);
				return result;
			},
			enumerable: false,
			writable: true,
			configurable: true,
		});
	}
}

// Wrap raw object elements into reactive views, refresh elements whose own
// identity was invalidated, and surface the latest generation of nested arrays.
function wrapArrayElements(
	arr: unknown[],
	cell: ArrayCell,
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>,
): void {
	for (let i = 0; i < arr.length; i++) {
		const el = arr[i];
		if (el === null || typeof el !== "object") continue;
		if (el instanceof Date || el instanceof RegExp) continue;
		if (!Array.isArray(el) && !isPlainObject(el)) continue;
		if (Array.isArray(el)) {
			arr[i] = resolveArray(el as unknown[], rootSignal, rootState, cell);
		} else if (reactiveObjects.has(el as object)) {
			// Existing wrapper element: rebuild it if its raw was invalidated so the
			// element's identity is fresh inside the fresh generation.
			const raw = wrapperRaw.get(el as object);
			if (raw) {
				const entry = reactiveCache.get(raw);
				if (!entry || entry.wrapper !== el) {
					arr[i] = makeReactive(raw, rootSignal, rootState, cell);
				} else {
					parentOf.set(raw, cell);
				}
			}
		} else {
			// Newly added (raw) element — wrap it so nested mutations propagate.
			arr[i] = makeReactive(el, rootSignal, rootState, cell);
		}
	}
}

function resolveArray(
	arr: unknown[],
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>,
	parent: ParentNode,
): unknown[] {
	let cell = arrayCells.get(arr);
	if (!cell) {
		cell = new ArrayCell(arr, epochOf(rootState));
		arrayCells.set(arr, cell);
		patchArrayMethods(arr, cell, rootSignal, rootState);
		wrapArrayElements(arr, cell, rootSignal, rootState);
	}
	parentOf.set(cell, parent);
	const epoch = epochOf(rootState);
	if (!rootStable.has(rootState) && (cell.dirty || cell.epoch !== epoch)) {
		// Start a new generation: fresh identity for memo/dep comparisons while
		// the cell keeps routing mutations to the latest generation.
		const next = cell.current.slice();
		arrayCells.set(next, cell);
		patchArrayMethods(next, cell, rootSignal, rootState);
		cell.current = next;
		cell.dirty = false;
		cell.epoch = epoch;
		wrapArrayElements(next, cell, rootSignal, rootState);
	}
	return cell.current;
}

function resolveValue(
	value: unknown,
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>,
	parent: ParentNode,
): unknown {
	if (value === null || typeof value !== "object") return value;
	if (value instanceof Date || value instanceof RegExp) return value;
	if (Array.isArray(value)) return resolveArray(value as unknown[], rootSignal, rootState, parent);
	if (!isPlainObject(value)) return value;
	return makeReactive(value, rootSignal, rootState, parent);
}

function makeReactive<T>(
	obj: T,
	rootSignal: Signal<number>,
	rootState: ReactiveState<Record<string, unknown>>,
	parent: ParentNode = null,
): T {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (obj instanceof Date || obj instanceof RegExp) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return resolveArray(obj as unknown[], rootSignal, rootState, parent) as unknown as T;
	}

	if (!isPlainObject(obj)) {
		return obj;
	}

	// A wrapper passed back in (e.g. re-assigned within the store): operate on its raw.
	const raw = (reactiveObjects.has(obj as object) ? wrapperRaw.get(obj as object) ?? obj : obj) as Record<string, unknown>;

	parentOf.set(raw, parent);

	const epoch = epochOf(rootState);
	const cached = reactiveCache.get(raw);
	if (cached && (rootStable.has(rootState) || cached.epoch === epoch)) {
		return cached.wrapper as T;
	}

	const reactiveObj = {} as T;

	for (const key in raw) {
		if (Object.hasOwn(raw, key)) {
			Object.defineProperty(reactiveObj, key, {
				get() {
					return resolveValue(raw[key], rootSignal, rootState, raw);
				},
				set(newValue) {
					const unwrapped = unwrapValue(newValue);
					const oldValue = raw[key];
					if (oldValue === unwrapped) {
						return;
					}
					if (oldValue && typeof oldValue === "object") {
						reactiveCache.delete(oldValue as object);
					}
					raw[key] = unwrapped;
					markDirty(raw, rootState);
					markUpdated(rootState, rootSignal);
				},
				enumerable: true,
				configurable: true,
			});
		}
	}

	reactiveCache.set(raw, { wrapper: reactiveObj as object, epoch });
	wrapperRaw.set(reactiveObj as object, raw);
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
	useStore: UseStore<T, M>;
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

	// Canonical state is detached from caller-owned objects: reactivity writes
	// back into this raw graph, which must never alias `initial`.
	const internalState = { ...deepClonePlain(mergedInitial), [STATE_ID]: 0 } as ReactiveState<T>;
	// Pristine copy for $reset (independent of any later mutations).
	const pristineInitial = deepClonePlain(initial);
	const signal = new Signal<number>(0);

	if (storeOptions?.identity === "stable") {
		rootStable.add(internalState);
	}

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
			// Plain snapshot read THROUGH the reactive layer (state keys only).
			const stateToSave = getPlainState();

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
			Object.defineProperty(store, key, {
				get() {
					return resolveValue(
						(internalState as Record<string, unknown>)[key],
						signal,
						internalState,
						null,
					);
				},
				set(value) {
					const unwrapped = unwrapValue(value);
					const oldValue = (internalState as Record<string, unknown>)[key];
					if (oldValue === unwrapped) {
						return;
					}
					if (oldValue && typeof oldValue === "object") {
						reactiveCache.delete(oldValue as object);
					}
					(internalState as Record<string, unknown>)[key] = unwrapped;
					markUpdated(internalState, signal);
				},
				enumerable: true,
				configurable: true,
			});
		}
	}

	(store as StoreType<T, M>).$update = () => {
		// Manual notification (used after untracked writes like index assignment):
		// we cannot know WHICH container changed, so advance the store epoch to
		// refresh every container identity on next read.
		if (!rootStable.has(internalState)) {
			rootEpoch.set(internalState, epochOf(internalState) + 1);
		}
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

	// Deep-clone a value into plain data, reading THROUGH the reactive layer
	// (wrapper views and array generations).
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
					// Fresh clone per reset: the canonical graph mutates in place, so
					// reusing one shared initial object would corrupt the pristine copy.
					(store as Record<string, unknown>)[key] = deepClonePlain(
						(pristineInitial as Record<string, unknown>)[key],
					);
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

	// No-selector facade: a transparent identity layer over the live store that
	// is replaced on every update. Memoization (React Compiler, useMemo, deps)
	// compares with Object.is, so handing back the same store reference forever
	// would pin every dependent memo — the facade gives each update a fresh
	// root identity while all reads/writes still hit the real store.
	let facade: StoreType<T, M> = store;
	let facadeUid = -1;
	const getFacade = (): StoreType<T, M> => {
		if (rootStable.has(internalState) || typeof Proxy === "undefined") return store;
		const uid = signal.get();
		if (uid !== facadeUid) {
			facadeUid = uid;
			facade = new Proxy(store as object, {}) as StoreType<T, M>;
		}
		return facade;
	};

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
		// value is the store itself, which cannot double as the change signal —
		// useSyncExternalStore bails out on Object.is-equal snapshots, so the
		// component would never re-render. Instead we snapshot the version `uid`
		// (which advances on every update) and hand back the per-update store
		// facade. With a selector we snapshot the memoised selected slice.
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
		return selector ? (snapshot as R) : getFacade();
	}

	return { useStore, store };
}

// Re-export types for convenience
export type { PersistOptions, StoreType, MethodCreators, StoreOptions, HistoryOptions, HistoryState, SyncTabsOptions, UseStore } from "./types";
