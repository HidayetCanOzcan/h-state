import { useState } from 'react';
import ArrayReactivityDemo from './ArrayReactivityDemo';
import SubscriptionsDemo from './SubscriptionsDemo';
import TimeTravelDemo from './TimeTravelDemo';
import './playground.css';

type Tab = 'arrays' | 'subscriptions' | 'timetravel';

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
        <button
          type="button"
          onClick={() => setTab('timetravel')}
          className={`pg-tab${tab === 'timetravel' ? ' active' : ''}`}
        >
          ⏳ Time Travel
        </button>
      </div>

      {tab === 'arrays' && <ArrayReactivityDemo />}
      {tab === 'subscriptions' && <SubscriptionsDemo />}
      {tab === 'timetravel' && <TimeTravelDemo />}
    </div>
  );
}

export default DemoRoot;
