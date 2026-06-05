export const STATE_ID = Symbol("__state_id");
export type Listener = () => void;

export type ReactiveState<T> = T & {
	readonly [STATE_ID]: number;
};

export type StoreListener<T> = (state: T, prevState: T) => void;
export type SelectorListener<R> = (selected: R, prevSelected: R) => void;

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