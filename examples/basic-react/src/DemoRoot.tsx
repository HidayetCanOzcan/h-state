import { useState } from 'react';
import ArrayReactivityDemo from './ArrayReactivityDemo';
import SubscriptionsDemo from './SubscriptionsDemo';
import './playground.css';

type Tab = 'arrays' | 'subscriptions';

function DemoRoot() {
  const [tab, setTab] = useState<Tab>('arrays');

  return (
    <div className="pg">
      <div className="pg-tabs">
        <button
          type="button"
          onClick={() => setTab('arrays')}
          className={`pg-tab${tab === 'arrays' ? ' active' : ''}`}
        >
          🧬 Array Reactivity
        </button>
        <button
          type="button"
          onClick={() => setTab('subscriptions')}
          className={`pg-tab${tab === 'subscriptions' ? ' active' : ''}`}
        >
          🔌 Vanilla Subscriptions
        </button>
      </div>

      {tab === 'arrays' ? <ArrayReactivityDemo /> : <SubscriptionsDemo />}
    </div>
  );
}

export default DemoRoot;
