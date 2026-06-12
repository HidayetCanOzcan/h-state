export const STATE_ID = Symbol("__state_id");
export type Listener = () => void;

export type ReactiveState<T> = T & {
	readonly [STATE_ID]: number;
};

export type StoreListener<T> = (state: T, prevState: T) => void;
export type SelectorListener<R> = (selected: R, prevSelected: R) => void;

export type HistoryState = {
	canUndo: boolean;
	canRedo: boolean;
	past: number;
	future: number;
};

export type HistoryOptions = {
	enabled?: boolean;
	/** Max number of past snapshots to retain. Default 100. */
	limit?: number;
};

export type SyncTabsOptions = {
	enabled?: boolean;
	/**
	 * BroadcastChannel name. Tabs sharing the same name stay in sync.
	 * Defaults to the persistence `key` if set, otherwise "h-state".
	 */
	channel?: string;
};

export interface StoreOptions {
	/** Enable time-travel (undo/redo). Pass `true` or `{ limit }`. */
	history?: boolean | HistoryOptions;
	/**
	 * Sync state across browser tabs/windows via BroadcastChannel.
	 * Pass `true` or `{ channel }`. No-op where BroadcastChannel is unavailable (SSR/old browsers).
	 */
	syncTabs?: boolean | SyncTabsOptions;
	/**
	 * Container identity semantics. Default `'fresh'`: after a mutation, the next
	 * read of the mutated container (and its ancestors, plus the no-selector
	 * `useStore()` result) returns a NEW reference, so Object.is-based memoization
	 * (React Compiler, useMemo, React.memo, effect deps) sees every change.
	 * `'stable'` restores the pre-2.11 behavior of permanently stable references — only use
	 * it when `reactCompiler` is off and you rely on reference stability.
	 */
	identity?: "fresh" | "stable";
}

export type StoreType<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
> = T &
	M & {
		$update: () => void;
		$merge: (partial: Partial<T>) => void;
		$persist: () => void;
		$clearPersist: () => void;
		$reset: () => void;
		/**
		 * Returns a plain, non-reactive snapshot of the current state (state keys only,
		 * methods and internal symbols excluded). Safe to use anywhere, including outside React.
		 */
		$getState: () => T;
		/**
		 * Subscribe to any state change from outside React. The listener receives the new and
		 * previous plain snapshots. Returns an unsubscribe function.
		 */
		$subscribe: (listener: StoreListener<T>) => () => void;
		/**
		 * Subscribe to a derived slice. The listener fires only when the selected value changes
		 * according to `equalityFn` (defaults to Object.is). Returns an unsubscribe function.
		 */
		$subscribeWithSelector: <R>(
			selector: (state: T) => R,
			listener: SelectorListener<R>,
			equalityFn?: (a: R, b: R) => boolean,
		) => () => void;
		/**
		 * Time-travel: step back to the previous recorded state. No-op when history is
		 * disabled or there is nothing to undo. Returns true if a step was taken.
		 * Enable via the 4th `createStore` arg: `{ history: true }`.
		 */
		$undo: () => boolean;
		/** Time-travel: re-apply the next state after an undo. Returns true if a step was taken. */
		$redo: () => boolean;
		/** Clear the undo/redo history without changing current state. */
		$clearHistory: () => void;
		/** Snapshot of history availability (canUndo/canRedo + stack sizes). */
		$history: () => HistoryState;
		/** Close the cross-tab BroadcastChannel (if any). Safe to call multiple times. */
		$destroy: () => void;
		/**
		 * Run a set of mutations atomically. All writes are coalesced into a single
		 * re-render and recorded as one undo step (when history is enabled). If `fn`
		 * throws, every mutation it made is rolled back to the pre-transaction state
		 * and the error is re-thrown. Returns whatever `fn` returns on success.
		 */
		$transaction: <R>(fn: () => R) => R;
	};

/**
 * React hook returned by `createStore`. Two call signatures:
 * - no args → the live store object, re-rendering on ANY change;
 * - selector (+ optional equality) → the derived slice, re-rendering only when
 *   that slice changes. The selector form returns the value itself (not the
 *   stable store), which is required for correctness under the React Compiler:
 *   the compiler memoises property reads against the stable store reference, so
 *   in-place mutations are invisible to it unless surfaced through a selector.
 */
export type UseStore<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
> = {
	<R>(selector: (state: StoreType<T, M>) => R, equalityFn?: (a: R, b: R) => boolean): R;
	// No-arg overload kept LAST so `ReturnType<typeof useStore>` resolves to the
	// store (TS picks the final overload for ReturnType), preserving the common
	// `type Store = ReturnType<typeof useXStore>` pattern. Call resolution is
	// unaffected: a zero-arg call can't match the selector overload (its selector
	// is required) and falls through to this one.
	(): StoreType<T, M>;
};

export type MethodCreators<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
> = {
		[K in keyof M]: (store: StoreType<T, M>) => M[K];
	};

export type MigrateFn = (
	persisted: Record<string, unknown>,
	persistedVersion: number,
) => Record<string, unknown>;

export interface PersistOptions {
	enabled?: boolean;
	key?: string;
	debounce?: number;
	serialize?: (state: Record<string, unknown>) => string;
	deserialize?: (data: string) => Record<string, unknown>;
	onError?: (error: Error) => void;
	/**
	 * Current schema version. When the stored payload's version differs, `migrate` is called.
	 * Defaults to 0.
	 */
	version?: number;
	/**
	 * Migration function invoked when persisted version !== current version.
	 * Must return the upgraded state shape. If omitted and versions mismatch, the stored
	 * payload is discarded.
	 */
	migrate?: MigrateFn;
	/**
	 * When true (default), restored nested objects are deep-merged into initial state so that
	 * newly added fields keep their default values instead of being lost to older persisted payloads.
	 * Arrays and primitives are still replaced wholesale.
	 */
	deepMerge?: boolean;
}