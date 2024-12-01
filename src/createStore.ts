import React from 'react';
import { ReactiveStore } from './ReactiveStore';
import { StoreType, MethodCreators } from './types';

export function createStore<
  T extends Record<string, unknown>,
  M extends Record<string, unknown>
>(
  initial: T,
  methodCreators: MethodCreators<T, M>
): {
  Store: StoreType<T, M>;
  useStore: () => StoreType<T, M>;
  subscribe: (callback: () => void) => () => void;
} {
  const reactiveStore = new ReactiveStore(initial);
  const store = reactiveStore.getProxy() as StoreType<T, M>;

  (store as StoreType<T, M> & { merge: (partial: Partial<T>) => void }).merge = (
    partial: Partial<T>
  ) => {
    reactiveStore.mergeDeep(store, partial);
    reactiveStore.notifySubscribers();
  };

  Object.keys(methodCreators).forEach((methodName) => {
    const creator = methodCreators[methodName];
    const method = creator(store);
    Object.assign(store, { [methodName]: method });
  });

  function useStore() {
    const [, setCounter] = React.useState(0);

    React.useEffect(() => {
      return reactiveStore.subscribe(() => {
        setCounter((counter: number) => counter + 1);
      });
    }, []);

    return store;
  }

  const subscribe = (callback: () => void) => {
    return reactiveStore.subscribe(callback);
  };

  return { Store: store, useStore, subscribe };
}
