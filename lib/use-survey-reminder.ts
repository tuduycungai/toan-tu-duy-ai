import {useEffect, useRef, useState} from 'react';

export const SURVEY_INTERVAL_MS = 13 * 60_000;

/** Remind on a fixed cadence; never submit or reset a survey draft. */
export function useSurveyReminder({enabled, open, blocked, onRemind}: {
  enabled: boolean;
  open: boolean;
  blocked: boolean;
  onRemind: () => void;
}) {
  const [due, setDue] = useState(false);
  const [visible, setVisible] = useState(() => typeof document !== 'undefined' && !document.hidden);
  const callback = useRef(onRemind);
  useEffect(() => { callback.current = onRemind; }, [onRemind]);

  useEffect(() => {
    if (!enabled) { setDue(false); return; }
    const timer = setInterval(() => setDue(true), SURVEY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled]);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!enabled || !due) return;
    // An already open survey counts as this reminder; closing it must not
    // immediately open another one. Multiple overdue ticks merge into one.
    if (open) { setDue(false); return; }
    if (!visible || blocked) return;
    setDue(false);
    callback.current();
  }, [enabled, due, visible, open, blocked]);
}
