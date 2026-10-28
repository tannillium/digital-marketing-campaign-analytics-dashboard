import DateRangeFilter from "./DateRangeFilter";
import { useDateRange } from "../context/DateRangeContext";

export default function PageHeader({ title, description = "", data }) {
  const range = useDateRange();
  const source = data?.source || "Loading data source…";
  return <header className="page-header">
    <div><h1>{title}</h1>{description && <div className="page-description">{description}</div>}<p className="period-caption">Period: {range.start} to {range.end} <span>·</span> Source: {source}</p></div>
    <DateRangeFilter />
  </header>;
}
