import { useState } from 'react';
import { create } from 'zustand';
import { hookstate, useHookstate } from '@hookstate/core';
import { createStore } from '../../../../src';

type ComplexState = {
  count: number;
  items: Array<{
    id: number;
    value: number;
    metadata: {
      lastUpdated: number;
      updateCount: number;
    };
  }>;
  stats: {
    min: number;
    max: number;
    avg: number;
    lastUpdate: number;
  };
};

const createInitialState = (): ComplexState => ({
  count: 0,
  items: Array.from({ length: 10 }, (_, i) => ({
    id: i,
    value: 0,
    metadata: {
      lastUpdated: Date.now(),
      updateCount: 0,
    },
  })),
  stats: {
    min: 0,
    max: 0,
    avg: 0,
    lastUpdate: Date.now(),
  },
});

type HStateStore = ComplexState & {
  complexUpdate: (multiplier: number) => void;
};

const { useStore: useHStateStore } = createStore<HStateStore, {}>(
  {
    ...createInitialState(),
    complexUpdate(multiplier: number) {
      const state = this as ComplexState;
      const newItems = state.items.map((item) => ({
        ...item,
        value: item.value * multiplier + Math.random(),
        metadata: {
          updateCount: item.metadata.updateCount + 1,
          lastUpdated: Date.now(),
        },
      }));

      const newCount = newItems.reduce((sum, item) => sum + item.value, 0);
      const values = newItems.map((item) => item.value);

      // Tek seferde güncelle
      Object.assign(this, {
        items: newItems,
        count: newCount,
        stats: {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: newCount / newItems.length,
          lastUpdate: Date.now(),
        },
      });
    },
  },
  {}
);

// Zustand implementation
type ZustandStore = ComplexState & {
  complexUpdate: (multiplier: number) => void;
};

const useZustandStore = create<ZustandStore>()((set) => ({
  ...createInitialState(),
  complexUpdate: (multiplier: number) =>
    set((state) => {
      const newItems = state.items.map((item) => ({
        ...item,
        value: item.value * multiplier + Math.random(),
        metadata: {
          updateCount: item.metadata.updateCount + 1,
          lastUpdated: Date.now(),
        },
      }));

      const newCount = newItems.reduce((sum, item) => sum + item.value, 0);
      const values = newItems.map((item) => item.value);

      return {
        ...state,
        items: newItems,
        count: newCount,
        stats: {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: newCount / newItems.length,
          lastUpdate: Date.now(),
        },
      };
    }),
}));

const hookStateStore = hookstate<ComplexState>(createInitialState());

const ITERATIONS = 50;
const MEASUREMENT_COUNT = 5;

export function PerformanceTest() {
  const hStateStore = useHStateStore();
  const zustandStore = useZustandStore();
  const hookState = useHookstate(hookStateStore);
  const [results, setResults] = useState<{ [key: string]: number }>({});
  const [measuring, setMeasuring] = useState(false);

  const measure = (fn: () => void) => {
    const measurements: number[] = [];
    fn();

    for (let i = 0; i < MEASUREMENT_COUNT; i++) {
      const start = performance.now();
      fn();
      measurements.push(performance.now() - start);
    }

    measurements.sort((a, b) => a - b);
    const trimmedMeasurements = measurements.slice(1, -1);
    return trimmedMeasurements.reduce((a, b) => a + b, 0) / trimmedMeasurements.length;
  };

  const runPerformanceTest = async (type: 'h-state' | 'zustand' | 'hookstate') => {
    setMeasuring(true);

    setTimeout(() => {
      let duration: number;
      const iterations = ITERATIONS;
      const multiplier = 1.1;

      switch (type) {
        case 'h-state':
          duration = measure(() => {
            for (let i = 0; i < iterations; i++) {
              hStateStore.complexUpdate(multiplier);
            }
          });
          break;
        case 'zustand':
          duration = measure(() => {
            for (let i = 0; i < iterations; i++) {
              zustandStore.complexUpdate(multiplier);
            }
          });
          break;
        case 'hookstate':
          duration = measure(() => {
            for (let i = 0; i < iterations; i++) {
              const state = hookState;
              const newItems = state.items.map((item) => ({
                ...item.value,
                value: item.value.value * multiplier + Math.random(),
                metadata: {
                  updateCount: item.metadata.updateCount.value + 1,
                  lastUpdated: Date.now(),
                },
              }));

              const newCount = newItems.reduce((sum, item) => sum + item.value, 0);
              const values = newItems.map((item) => item.value);

              state.set({
                items: newItems,
                count: newCount,
                stats: {
                  min: Math.min(...values),
                  max: Math.max(...values),
                  avg: newCount / values.length,
                  lastUpdate: Date.now(),
                },
              });
            }
          });
          break;
      }

      setResults((prev) => ({ ...prev, [type]: duration / 1000 }));
      setMeasuring(false);
    }, 0);
  };

  const getRankedResults = () => {
    if (Object.keys(results).length === 0) return [];

    return Object.entries(results)
      .map(([name, duration]) => ({ name, duration }))
      .sort((a, b) => a.duration - b.duration)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
        medal: index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉',
      }));
  };

  const formatDuration = (duration: number) => {
    if (duration < 0.001) {
      return `${(duration * 1000000).toFixed(0)}µs`;
    } else if (duration < 1) {
      return `${(duration * 1000).toFixed(2)}ms`;
    }
    return `${duration.toFixed(3)}s`;
  };

  const libraryNames = {
    'h-state': 'H-State',
    zustand: 'Zustand',
    hookstate: 'HookState',
  };

  const rankedResults = getRankedResults();

  return (
    <div className="performance-wrapper">
      <section className="performance-section">
        <h2 className="performance-title">📊 Performance Comparison</h2>
        <p className="performance-description">
          Compare the performance of state management libraries with complex updates:{' '}
          {ITERATIONS.toLocaleString()} iterations, each updating {hStateStore.items.length} items
          with computed stats
        </p>

        <div className="test-buttons">
          <button
            onClick={() => runPerformanceTest('h-state')}
            className="test-button h-state"
            disabled={measuring}
          >
            {measuring ? '⏳ Testing...' : '🚀 Test H-State'}
          </button>
          <button
            onClick={() => runPerformanceTest('zustand')}
            className="test-button zustand"
            disabled={measuring}
          >
            {measuring ? '⏳ Testing...' : '🚀 Test Zustand'}
          </button>
          <button
            onClick={() => runPerformanceTest('hookstate')}
            className="test-button hookstate"
            disabled={measuring}
          >
            {measuring ? '⏳ Testing...' : '🚀 Test HookState'}
          </button>
        </div>

        {rankedResults.length > 0 && (
          <div className="values-container">
            <h3 className="values-title">Test Results:</h3>
            <div className="stats-grid">
              {rankedResults.map(({ name, duration, rank, medal }) => (
                <div key={name} className={`stat-item rank-${rank}`}>
                  <div className="stat-header">
                    <span className="rank-medal">{medal}</span>
                    <span className="library-name">
                      {name === 'h-state' && '🟢'}
                      {name === 'zustand' && '🔵'}
                      {name === 'hookstate' && '🟣'}
                      {libraryNames[name as keyof typeof libraryNames]}
                    </span>
                  </div>
                  <div className="stat-value">{formatDuration(duration)}</div>
                  <div className="rank-label">
                    {rank === 1 ? 'Fastest' : rank === 2 ? 'Second' : 'Third'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
