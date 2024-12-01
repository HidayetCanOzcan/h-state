import { describe, it, expect } from '@jest/globals';
import { ReactiveStore } from '../ReactiveStore';

describe('ReactiveStore', () => {
  let store: ReactiveStore<any>;

  beforeEach(() => {
    store = new ReactiveStore({
      count: 0,
      user: {
        name: 'John',
        age: 25
      }
    });
  });

  it('should create a proxy with initial data', () => {
    const proxy = store.getProxy();
    expect(proxy.count).toBe(0);
    expect(proxy.user.name).toBe('John');
    expect(proxy.user.age).toBe(25);
  });

  it('should notify subscribers when data changes', () => {
    const proxy = store.getProxy();
    const callback = jest.fn();
    store.subscribe(callback);

    proxy.count = 1;
    jest.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle nested property changes', () => {
    const proxy = store.getProxy();
    const callback = jest.fn();
    store.subscribe(callback);

    proxy.user.name = 'Jane';
    jest.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(proxy.user.name).toBe('Jane');
  });

  it('should handle set method', () => {
    const proxy = store.getProxy();
    proxy.user.set({ name: 'Jane', age: 30 });
    jest.runOnlyPendingTimers();

    expect(proxy.user.name).toBe('Jane');
    expect(proxy.user.age).toBe(30);
  });

  it('should handle merge method', () => {
    const proxy = store.getProxy();
    proxy.user.merge({ name: 'Jane' });
    jest.runOnlyPendingTimers();

    expect(proxy.user.name).toBe('Jane');
    expect(proxy.user.age).toBe(25); // Original age should remain unchanged
  });

  it('should handle get method', () => {
    const proxy = store.getProxy();
    const user = proxy.user.get();
    expect(user).toEqual({ name: 'John', age: 25 });
  });

  it('should handle unsubscribe', () => {
    const proxy = store.getProxy();
    const callback = jest.fn();
    const unsubscribe = store.subscribe(callback);

    proxy.count = 1;
    jest.runOnlyPendingTimers();

    unsubscribe();

    proxy.count = 2;
    jest.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should batch updates', () => {
    const proxy = store.getProxy();
    const callback = jest.fn();
    store.subscribe(callback);

    proxy.count = 1;
    proxy.user.name = 'Jane';
    proxy.user.age = 30;
    jest.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
