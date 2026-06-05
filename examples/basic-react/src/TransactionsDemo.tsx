import { useState } from 'react';
import { Landmark, ArrowDownToLine, ArrowUpFromLine, RotateCcw, CheckCircle2, Undo2 } from 'lucide-react';
import { useTransactionStore } from './store/transactionStore';
import './playground.css';

function TransactionsDemo() {
  const store = useTransactionStore();
  const [flash, setFlash] = useState<{ kind: 'ok' | 'rollback'; text: string } | null>(null);
  const [shake, setShake] = useState(false);

  const withdraw = () => {
    try {
      store.withdraw();
      setFlash({ kind: 'ok', text: `Withdrew $${store.amount}. New balance $${store.balance}.` });
    } catch (err) {
      // $transaction already rolled back balance + log; nothing partial remains.
      setShake(true);
      setFlash({ kind: 'rollback', text: `Rolled back: ${(err as Error).message}. Balance untouched ($${store.balance}).` });
    }
  };

  const deposit = () => {
    store.deposit();
    setFlash({ kind: 'ok', text: `Deposited $${store.amount}. New balance $${store.balance}.` });
  };

  return (
    <div className="pg-shell">
      <div className="pg-head">
        <h1>
          <span className="grad">Atomic Transactions</span>
        </h1>
        <p>
          <code>$transaction(fn)</code> commits all mutations together, or rolls back every change
          if the callback throws — no half-applied state.
        </p>
      </div>

      <div className="pg-grid two">
        <div
          className={`pg-card${shake ? ' shake' : ''}`}
          onAnimationEnd={() => setShake(false)}
        >
          <div className="pg-card-head">
            <h2 className="pg-icon-head"><Landmark size={18} /> Account</h2>
            <span className="pg-badge" style={{ background: store.balance < 50 ? '#f59e0b' : '#22c55e', color: '#0a0a0f' }}>
              balance ${store.balance}
            </span>
          </div>

          <div className="pg-field">
            <label htmlFor="tx-amount">Amount</label>
            <input
              id="tx-amount"
              className="pg-input"
              type="number"
              min={0}
              value={store.amount}
              onChange={(e) => store.setAmount(Number(e.target.value) || 0)}
            />
          </div>

          <div className="pg-btns">
            <button type="button" className="pg-btn primary" onClick={deposit}><ArrowDownToLine size={15} /> deposit</button>
            <button type="button" className="pg-btn" onClick={withdraw}><ArrowUpFromLine size={15} /> withdraw</button>
            <button type="button" className="pg-btn danger" onClick={store.reset}><RotateCcw size={15} /> reset</button>
          </div>

          {flash && (
            <div
              className="pg-callout"
              style={{
                marginTop: '0.5rem',
                background: flash.kind === 'rollback' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                borderColor: flash.kind === 'rollback' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)',
              }}
            >
              {flash.kind === 'rollback' ? <Undo2 size={16} style={{ flexShrink: 0 }} /> : <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
              <span>{flash.text}</span>
            </div>
          )}

          <p className="pg-empty" style={{ textAlign: 'left', padding: '0.5rem 0 0' }}>
            Try withdrawing more than the balance — the log entry is written first, then validation
            throws, and the transaction undoes both the balance change and the log entry.
          </p>

          <div className="pg-list" style={{ marginTop: '0.75rem' }}>
            {store.log.map((entry, index) => (
              <div key={`${entry.label}-${index}`} className="pg-item">
                <span className="pg-text">
                  {entry.label} {entry.delta >= 0 ? '+' : ''}{entry.delta} → ${entry.balance}
                </span>
              </div>
            ))}
            {store.log.length === 0 && <p className="pg-empty">No committed transactions yet.</p>}
          </div>
        </div>

        <div className="pg-card pg-code">
          <pre>
            {`// Method runs mutations atomically
withdraw: (s) => () => {
  s.$transaction(() => {
    s.balance -= s.amount;            // 1) debit
    s.log.push({ ... });              // 2) log
    if (s.balance < 0) {
      throw new Error('Insufficient'); // 👈 rolls back 1 + 2
    }
  });
}

// In the component
try {
  store.withdraw();
} catch (err) {
  // balance & log are exactly as before
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default TransactionsDemo;
