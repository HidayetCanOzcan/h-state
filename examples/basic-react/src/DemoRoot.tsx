import { useState } from 'react';
import { Boxes, Radio, History, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import ArrayReactivityDemo from './ArrayReactivityDemo';
import SubscriptionsDemo from './SubscriptionsDemo';
import TimeTravelDemo from './TimeTravelDemo';
import CrossTabDemo from './CrossTabDemo';
import TransactionsDemo from './TransactionsDemo';
import './playground.css';

type Tab = 'arrays' | 'subscriptions' | 'timetravel' | 'crosstab' | 'transactions';

const TABS: { id: Tab; label: string; icon: typeof Boxes }[] = [
  { id: 'crosstab', label: 'Cross-Tab Canvas', icon: MonitorSmartphone },
  { id: 'arrays', label: 'Array Reactivity', icon: Boxes },
  { id: 'timetravel', label: 'Time Travel', icon: History },
  { id: 'transactions', label: 'Transactions', icon: ShieldCheck },
  { id: 'subscriptions', label: 'Subscriptions', icon: Radio },
];

function DemoRoot() {
  const [tab, setTab] = useState<Tab>('crosstab');

  return (
    <div className="pg">
      <div className="pg-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => setTab(id)}
            className={`pg-tab${tab === id ? ' active' : ''}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
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
