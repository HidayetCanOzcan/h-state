import { useSyncExternalStore } from 'react';
import { ReactiveStore } from './ReactiveStore';
import { StoreType, MethodCreators } from './types';

export function createStore<T extends Record<string, unknown>, M extends Record<string, unknown>>(
  initial: T,
  methodCreators: MethodCreators<T, M>
): {
  Store: StoreType<T, M>;
  useStore: () => StoreType<T, M>;
  getStore: () => StoreType<T, M>;
  subscribe: (callback: () => void) => () => void;
} {
  const reactiveStore = new ReactiveStore(initial);
  const store = reactiveStore.getProxy() as StoreType<T, M>;
  let version = 0;

  Object.keys(methodCreators).forEach((methodName) => {
    const creator = methodCreators[methodName];
    const method = creator(store);
    Object.assign(store, { [methodName]: method });
  });

  const subscribe = (callback: () => void) => {
    return reactiveStore.subscribe(callback);
  };

  const getSnapshot = () => {
    return version;
  };

  const getServerSnapshot = () => {
    return version;
  };

  reactiveStore.subscribe(() => {
    version++;
  });

  const getStore = () => store;

  const useStore = () => {
    useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    return store;
  };

  return {
    Store: store,
    useStore,
    getStore,
    subscribe,
  };
}
