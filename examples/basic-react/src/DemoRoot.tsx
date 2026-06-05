import { useState } from 'react';
import ArrayReactivityDemo from './ArrayReactivityDemo';
import SubscriptionsDemo from './SubscriptionsDemo';
import './styles.css';

type Tab = 'arrays' | 'subscriptions';

function DemoRoot() {
  const [tab, setTab] = useState<Tab>('arrays');

  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('arrays')}
          className={`tab-button ${tab === 'arrays' ? 'active' : ''}`}
        >
          🧬 Array Reactivity
        </button>
        <button
          type="button"
          onClick={() => setTab('subscriptions')}
          className={`tab-button ${tab === 'subscriptions' ? 'active' : ''}`}
        >
          🔌 Vanilla Subscriptions
        </button>
      </div>

      {tab === 'arrays' ? <ArrayReactivityDemo /> : <SubscriptionsDemo />}
    </div>
  );
}

export default DemoRoot;
