import { useState } from 'react';
import ArrayReactivityDemo from './ArrayReactivityDemo';
import SubscriptionsDemo from './SubscriptionsDemo';
import TimeTravelDemo from './TimeTravelDemo';
import CrossTabDemo from './CrossTabDemo';
import TransactionsDemo from './TransactionsDemo';
import './playground.css';

type Tab = 'arrays' | 'subscriptions' | 'timetravel' | 'crosstab' | 'transactions';

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
        <button
          type="button"
          onClick={() => setTab('crosstab')}
          className={`pg-tab${tab === 'crosstab' ? ' active' : ''}`}
        >
          📡 Cross-Tab Sync
        </button>
        <button
          type="button"
          onClick={() => setTab('transactions')}
          className={`pg-tab${tab === 'transactions' ? ' active' : ''}`}
        >
          🔒 Transactions
        </button>
      </div>

      {tab === 'arrays' && <ArrayReactivityDemo />}
      {tab === 'subscriptions' && <SubscriptionsDemo />}
      {tab === 'timetravel' && <TimeTravelDemo />}
      {tab === 'crosstab' && <CrossTabDemo />}
      {tab === 'transactions' && <TransactionsDemo />}
    </div>
  );
}

export default DemoRoot;
