import { useCallback, useEffect, useState } from "react";
import { loadBundle } from "../api/client";
import { useDateRange } from "../context/DateRangeContext";

export default function useDashboardData(minClicks = 0) {
  const range = useDateRange();
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const reload = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const data = await loadBundle(range, minClicks);
      setState({ data, loading: false, error: "" });
    } catch (error) {
      setState((previous) => ({ ...previous, loading: false, error: error.message || "Could not load dashboard data." }));
    }
  }, [range.start, range.end, range.compare, minClicks]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}
