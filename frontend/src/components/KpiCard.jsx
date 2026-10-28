import { currency, metric, number, percentChange } from "../utils/metrics";
import { useDateRange } from "../context/DateRangeContext";

export default function KpiCard({ label, value, format = "number", changeKey, previous }) {
  const compare = useDateRange().compare;
  const change = compare && changeKey ? percentChange(value, previous?.[changeKey]) : null;
  const formatted = value == null ? "n/a" : format === "currency" ? currency(value) : format === "percent" ? metric(value, 2, "%") : number(value);
  return <section className="plain-card kpi-card"><h2>{label}</h2><strong>{formatted}</strong>{compare && changeKey && <p className={change == null ? "muted" : change >= 0 ? "change-up" : "change-down"}>{change == null ? "No comparison data" : `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs previous period`}</p>}</section>;
}
