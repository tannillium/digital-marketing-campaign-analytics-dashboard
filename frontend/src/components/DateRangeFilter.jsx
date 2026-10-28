import { useDateRange } from "../context/DateRangeContext";

export default function DateRangeFilter() {
  const range = useDateRange();
  return <div className="global-filters">
    <label>Period<select value={range.preset} onChange={(event) => range.setPreset(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="custom">Custom</option></select></label>
    <label>Start<input type="date" max={range.end} value={range.start} onChange={(event) => range.setCustomStart(event.target.value)} /></label>
    <label>End<input type="date" value={range.end} min={range.start} onChange={(event) => range.setCustomEnd(event.target.value)} /></label>
    <label className="compare-control"><input type="checkbox" checked={range.compare} onChange={(event) => range.setCompare(event.target.checked)} /> Compare previous period</label>
  </div>;
}
