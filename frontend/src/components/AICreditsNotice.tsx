import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { api } from '../lib/api';

const POLL_MS = 5 * 60 * 1000;
const DISMISS_KEY = 'nasaalaga_ai_credits_dismissed_since';

/**
 * Warns CVO staff/admins when the Anthropic account behind the AI features is out of credits.
 * The backend only learns this when a Claude call is rejected, so the banner appears after the first
 * failed request and clears itself once a later call succeeds (e.g. after a top-up).
 * Dismissing hides it for the current problem only; a new outage shows it again.
 */
export function AICreditsNotice() {
  const [since, setSince] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      try {
        const r = await api.aiCreditsStatus();
        if (!alive) return;
        if (r?.low) {
          setSince(r.since || 'unknown');
          setMessage(r.message || '');
          setDismissed(sessionStorage.getItem(DISMISS_KEY) === (r.since || 'unknown'));
        } else {
          setSince(null);
        }
      } catch { /* status is best-effort — never block the dashboard */ }
    };
    check();
    const t = setInterval(check, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!since || dismissed) return null;

  return (
    <div role="alert" className="sticky top-0 z-40 bg-amber-50 border-b border-amber-300 text-amber-900">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-bold">AI credits are low</p>
          <p className="text-amber-800">{message}</p>
        </div>
        <button
          onClick={() => { try { sessionStorage.setItem(DISMISS_KEY, since); } catch { /* ignore */ } setDismissed(true); }}
          aria-label="Dismiss AI credits notice"
          className="p-1 rounded hover:bg-amber-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
