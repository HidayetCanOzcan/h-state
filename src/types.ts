export const STATE_ID = Symbol("__state_id");
export type Listener = () => void;

export type ReactiveState<T> = T & {
	readonly [STATE_ID]: number;
};

export type StoreType<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
> = T &
	M & {
		$update: () => void; 
		$merge: (partial: Partial<T>) => void;
		$persist: () => void;
		$clearPersist: () => void;
	};

export type MethodCreators<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
> = {
	[K in keyof M]: (store: StoreType<T, M>) => M[K];
};

export interface PersistOptions {
	enabled?: boolean;
	key?: string;
	debounce?: number;
	serialize?: (state: Record<string, unknown>) => string;
	deserialize?: (data: string) => Record<string, unknown>;
	onError?: (error: Error) => void;
}