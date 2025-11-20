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
	};
export type MethodCreators<
	T extends Record<string, unknown>,
	M extends Record<string, unknown>,
> = {
	[K in keyof M]: (store: StoreType<T, M>) => M[K];
};