import { useEffect, useState } from 'react';

type PresenceMsg =
  | { type: 'hello'; id: string }
  | { type: 'here'; id: string }
  | { type: 'bye'; id: string };

/**
 * Timer-free cross-tab presence over BroadcastChannel.
 * A new tab broadcasts `hello`; existing tabs reply `here`; on close a tab
 * broadcasts `bye`. Each tab tracks the set of live peer ids (itself included).
 * Returns the number of currently connected tabs (>= 1).
 */
export function usePresence(channelName: string): number {
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const selfId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const peers = new Set<string>([selfId]);
    const channel = new BroadcastChannel(channelName);

    const sync = () => setCount(peers.size);

    channel.onmessage = (event: MessageEvent<PresenceMsg>) => {
      const msg = event.data;
      if (!msg || msg.id === selfId) return;
      if (msg.type === 'hello') {
        peers.add(msg.id);
        channel.postMessage({ type: 'here', id: selfId } satisfies PresenceMsg);
      } else if (msg.type === 'here') {
        peers.add(msg.id);
      } else if (msg.type === 'bye') {
        peers.delete(msg.id);
      }
      sync();
    };

    const leave = () => {
      channel.postMessage({ type: 'bye', id: selfId } satisfies PresenceMsg);
    };

    channel.postMessage({ type: 'hello', id: selfId } satisfies PresenceMsg);
    window.addEventListener('beforeunload', leave);
    window.addEventListener('pagehide', leave);

    return () => {
      leave();
      window.removeEventListener('beforeunload', leave);
      window.removeEventListener('pagehide', leave);
      channel.onmessage = null;
      channel.close();
    };
  }, [channelName]);

  return count;
}
