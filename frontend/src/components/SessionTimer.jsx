import { useEffect, useState } from "react";
import { TimerIcon } from "lucide-react";

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Live elapsed-time counter for an interview session.
 * Ticks every second from `startedAt` (session.createdAt).
 */
function SessionTimer({ startedAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;

  return (
    <span
      className="badge badge-ghost badge-lg gap-2 font-mono"
      title="Elapsed session time"
    >
      <TimerIcon className="size-4" />
      {formatElapsed(now - new Date(startedAt).getTime())}
    </span>
  );
}

export default SessionTimer;
