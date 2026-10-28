import { useMemo, useState } from "react";
import { EmptyState, LoadingState } from "./States";

export default function DataTable({ columns, rows, loading = false, error = "", emptyMessage, rowKey = "id" }) {
  const [sort, setSort] = useState({ key: "", direction: 1 });
  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    return [...rows].sort((a, b) => {
      const left = a[sort.key]; const right = b[sort.key];
      if (left == null) return 1;
      if (right == null) return -1;
      return (typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true })) * sort.direction;
    });
  }, [rows, sort]);
  if (loading) return <LoadingState />;
  if (error) return <div className="state-message error-message">{error}</div>;
  if (!rows.length) return <EmptyState>{emptyMessage || "No rows match the selected filters."}</EmptyState>;
  return <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column.key} aria-sort={sort.key === column.key ? sort.direction === 1 ? "ascending" : "descending" : "none"}>{column.sortable === false ? column.label : <button className="sort-button" onClick={() => setSort((current) => ({ key: column.key, direction: current.key === column.key ? -current.direction : 1 }))}>{column.label}{sort.key === column.key ? sort.direction === 1 ? " ↑" : " ↓" : ""}</button>}</th>)}</tr></thead><tbody>{sorted.map((row, index) => <tr key={row[rowKey] ?? index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? "n/a"}</td>)}</tr>)}</tbody></table></div>;
}
