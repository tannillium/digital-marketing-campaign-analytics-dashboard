import useDashboardData from "../components/useDashboardData";
import PageHeader from "../components/PageHeader";
import { ChartCard } from "../components/ChartCard";
import DataTable from "../components/DataTable";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currency, metric, number } from "../utils/metrics";

export default function Channels() {
  const { data, loading, error } = useDashboardData();
  const rows = data?.channels || [];
  const chartProps = { loading, error };
  const columns = [
    { key: "channel", label: "Channel" }, { key: "campaign_count", label: "Campaigns" },
    { key: "spend", label: "Spend", render: (row) => currency(row.spend) }, { key: "conversions", label: "Conversions", render: (row) => number(row.conversions) },
    { key: "cpl", label: "CPL", render: (row) => currency(row.cpl) }, { key: "roas", label: "ROAS", render: (row) => metric(row.roas, 2, "×") },
  ];
  return <>
    <PageHeader title="Channels" description="Compare cost and outcomes across marketing channels." data={data} />
    <div className="chart-grid three-charts">
      <ChartCard title="Spend by channel" description="Spend in account currency." {...chartProps} empty={!loading && !error && !rows.length}><div className="chart-frame"><ResponsiveContainer><BarChart data={rows} margin={{ top: 8, right: 12, bottom: 28, left: 18 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="channel" label={{ value: "Channel", position: "insideBottom", offset: -18 }} /><YAxis tickFormatter={(value) => currency(value)} label={{ value: "Spend (currency)", angle: -90, position: "insideLeft" }} /><Tooltip formatter={(value) => currency(value)} /><Bar dataKey="spend" name="Spend" fill="#2563eb" /></BarChart></ResponsiveContainer></div></ChartCard>
      <ChartCard title="Conversions by channel" description="One recorded conversion is counted as one lead." {...chartProps} empty={!loading && !error && !rows.length}><div className="chart-frame"><ResponsiveContainer><BarChart data={rows} margin={{ top: 8, right: 12, bottom: 28, left: 18 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="channel" label={{ value: "Channel", position: "insideBottom", offset: -18 }} /><YAxis allowDecimals={false} label={{ value: "Conversions (leads)", angle: -90, position: "insideLeft" }} /><Tooltip /><Bar dataKey="conversions" name="Conversions" fill="#2563eb" /></BarChart></ResponsiveContainer></div></ChartCard>
      <ChartCard title="CPL by channel" description="Spend divided by conversions." {...chartProps} empty={!loading && !error && !rows.some((row) => row.cpl != null)}><div className="chart-frame"><ResponsiveContainer><BarChart data={rows.filter((row) => row.cpl != null)} margin={{ top: 8, right: 12, bottom: 28, left: 18 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="channel" label={{ value: "Channel", position: "insideBottom", offset: -18 }} /><YAxis tickFormatter={(value) => currency(value)} label={{ value: "CPL (currency / conversion)", angle: -90, position: "insideLeft" }} /><Tooltip formatter={(value) => currency(value)} /><Bar dataKey="cpl" name="CPL" fill="#2563eb" /></BarChart></ResponsiveContainer></div></ChartCard>
    </div>
    <section className="plain-card table-card"><h2>Channel metrics</h2><DataTable columns={columns} rows={rows} loading={loading} error={error} /></section>
  </>;
}
