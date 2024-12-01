export type StoreType<T extends Record<string, unknown>, M extends Record<string, unknown>> = T & M;

export type PropertyType<T> = T extends object
  ? { [K in keyof T]: PropertyType<T[K]> }
  : T;

export type ProxyMethods<T> = {
  set: (value: T) => void;
  get: () => T;
  merge: (value: Partial<T>) => void;
};

export type DeepProxy<T> = T extends object
  ? { [K in keyof T]: DeepProxy<T[K]> } & ProxyMethods<T>
  : T;

export type MethodCreators<
  T extends Record<string, unknown>,
  M extends Record<string, unknown>
> = {
  [K in keyof M]: (store: StoreType<T, M>) => M[K] extends (...args: infer P) => any 
    ? (...args: P) => void 
    : M[K];
};

export interface ReactiveStoreInterface<T extends Record<string, unknown>> {
  subscribe(callback: () => void): () => void;
  notifySubscribers(): void;
  getProxy(): T;
}
