import { useSyncExternalStore } from 'react';
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
  let version = 0;
  let stableSubscribers = new Set<() => void>();

  // Store metodlarını oluştur
  Object.keys(methodCreators).forEach((methodName) => {
    const creator = methodCreators[methodName];
    const method = creator(store);
    Object.assign(store, { [methodName]: method });
  });

  // Stable subscription
  const stableSubscribe = (callback: () => void) => {
    stableSubscribers.add(callback);
    return () => {
      stableSubscribers.delete(callback);
    };
  };

  // Store snapshot
  const getSnapshot = () => {
    return version;
  };

  // Server snapshot for SSR
  const getServerSnapshot = () => {
    return version;
  };

  // Subscribe to store updates
  reactiveStore.subscribe(() => {
    version++;
    stableSubscribers.forEach(callback => callback());
  });

  const stableUseStore = () => {
    useSyncExternalStore(stableSubscribe, getSnapshot, getServerSnapshot);
    return store;
  };

  return { 
    Store: store, 
    useStore: stableUseStore, 
    subscribe: stableSubscribe 
  };
}
