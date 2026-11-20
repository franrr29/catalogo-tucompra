import { useState, useEffect } from "react";
import { getTimeLeft } from "./countdown";

// devuelve el tiempo restante hasta endTime, recalculado cada segundo contra Date.now()
export function useCountdown(endTime) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return getTimeLeft(endTime, now);
}
