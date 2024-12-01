import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { createStore } from '../createStore';
import type { StoreType, MethodCreators } from '../types';
import '@testing-library/jest-dom';

interface TestState extends Record<string, unknown> {
  count: number;
  user: {
    name: string;
    age: number;
  };
}

interface TestMethods extends Record<string, unknown> {
  increment: () => void;
  updateUser: (name: string, age: number) => void;
}

type TestMethodCreators = MethodCreators<TestState, TestMethods>;

interface TestStore {
  Store: StoreType<TestState, TestMethods>;
  useStore: () => StoreType<TestState, TestMethods>;
  subscribe: (callback: () => void) => () => void;
}

describe('createStore', () => {
  let testStore: TestStore;

  beforeEach(() => {
    const methodCreators: TestMethodCreators = {
      increment: (store: StoreType<TestState, TestMethods>) => () => {
        store.count++;
      },
      updateUser: (store: StoreType<TestState, TestMethods>) => (name: string, age: number) => {
        store.user.name = name;
        store.user.age = age;
      }
    };

    testStore = createStore<TestState, TestMethods>(
      {
        count: 0,
        user: {
          name: 'John',
          age: 25,
        },
      },
      methodCreators
    );
  });

  it('should create store with initial state', () => {
    expect(testStore.Store.count).toBe(0);
    expect(testStore.Store.user.name).toBe('John');
    expect(testStore.Store.user.age).toBe(25);
  });

  it('should handle method calls', () => {
    testStore.Store.increment();
    expect(testStore.Store.count).toBe(1);

    testStore.Store.updateUser('Jane', 30);
    expect(testStore.Store.user.name).toBe('Jane');
    expect(testStore.Store.user.age).toBe(30);
  });

  it('should handle subscriptions', () => {
    const callback = jest.fn();
    const unsubscribe = testStore.subscribe(callback);

    testStore.Store.increment();
    jest.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
    testStore.Store.increment();
    jest.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should work with React components', async () => {
    function TestComponent() {
      const store = testStore.useStore();
      return (
        <div>
          <span data-testid="count">{store.count}</span>
          <button onClick={() => store.increment()}>Increment</button>
        </div>
      );
    }

    const { getByTestId, getByText } = render(<TestComponent />);
    expect(getByTestId('count')).toHaveTextContent('0');

    await act(async () => {
      fireEvent.click(getByText('Increment'));
      jest.runOnlyPendingTimers();
    });

    expect(getByTestId('count')).toHaveTextContent('1');
  });

  it('should handle multiple components', async () => {
    function CountDisplay() {
      const store = testStore.useStore();
      return <span data-testid="count">{store.count}</span>;
    }

    function IncrementButton() {
      const store = testStore.useStore();
      return <button onClick={() => store.increment()}>Increment</button>;
    }

    const { getByTestId, getByText } = render(
      <>
        <CountDisplay />
        <IncrementButton />
      </>
    );

    expect(getByTestId('count')).toHaveTextContent('0');

    await act(async () => {
      fireEvent.click(getByText('Increment'));
      jest.runOnlyPendingTimers();
    });

    expect(getByTestId('count')).toHaveTextContent('1');
  });

  it('should handle component unmounting', () => {
    function TestComponent() {
      const store = testStore.useStore();
      return <span data-testid="count">{store.count}</span>;
    }

    const { getByTestId, unmount } = render(<TestComponent />);
    expect(getByTestId('count')).toHaveTextContent('0');

    unmount();

    testStore.Store.increment();
    jest.runOnlyPendingTimers();

    // Component should be unmounted without errors
  });
});
