import { createStore } from '../../../../src';

interface LogEntry {
  label: string;
  delta: number;
  balance: number;
}

interface TransactionState extends Record<string, unknown> {
  balance: number;
  log: LogEntry[];
  amount: number;
}

interface TransactionMethods extends Record<string, unknown> {
  setAmount: (a: number) => void;
  deposit: () => void;
  withdraw: () => void;
  reset: () => void;
}

export const { useStore: useTransactionStore, store: transactionStore } = createStore<
  TransactionState,
  TransactionMethods
>(
  { balance: 100, log: [], amount: 40 },
  {
    setAmount: (s) => (a: number) => { s.amount = a; },
    deposit: (s) => () => {
      s.balance += s.amount;
      s.log.push({ label: 'deposit', delta: s.amount, balance: s.balance });
    },
    // Withdraw runs inside an atomic transaction: the log entry is written
    // BEFORE the validation. If the balance would go negative we throw, and
    // $transaction rolls the log entry + balance change back automatically.
    withdraw: (s) => () => {
      s.$transaction(() => {
        s.balance -= s.amount;
        s.log.push({ label: 'withdraw', delta: -s.amount, balance: s.balance });
        if (s.balance < 0) {
          throw new Error('Insufficient funds');
        }
      });
    },
    reset: (s) => () => {
      s.balance = 100;
      s.log = [];
    },
  },
);
