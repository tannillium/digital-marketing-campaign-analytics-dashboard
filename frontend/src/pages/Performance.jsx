import { useState } from "react";
import useDashboardData from "../components/useDashboardData";
import PageHeader from "../components/PageHeader";
import { ChartCard } from "../components/ChartCard";
import DataTable from "../components/DataTable";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currency, metric, number } from "../utils/metrics";

export default function Performance() {
  const { data, loading, error } = useDashboardData();
  const [trendMetric, setTrendMetric] = useState("spend");
  const rows = data?.campaignAnalytics || [];
  const columns = [
    { key: "name", label: "Campaign" }, { key: "spend", label: "Spend", render: (row) => currency(row.spend) },
    { key: "impressions", label: "Impressions", render: (row) => number(row.impressions) }, { key: "clicks", label: "Clicks", render: (row) => number(row.clicks) },
    { key: "ctr", label: "CTR", render: (row) => metric(row.ctr, 2, "%") }, { key: "cpc", label: "CPC", render: (row) => currency(row.cpc) },
    { key: "conversions", label: "Conversions", render: (row) => number(row.conversions) }, { key: "cpl", label: "CPL", render: (row) => currency(row.cpl) }, { key: "roas", label: "ROAS", render: (row) => metric(row.roas, 2, "×") },
  ];
  const chartProps = { loading, error };
  return <>
    <PageHeader title="Performance" description="Compare campaign efficiency and daily results." data={data} />
    <div className="chart-grid">
      <ChartCard title="Daily performance" description="Choose a metric to plot over time." {...chartProps} empty={!loading && !error && !data?.trends.length}>
        <label className="inline-control">Metric<select value={trendMetric} onChange={(event) => setTrendMetric(event.target.value)}><option value="spend">Spend</option><option value="impressions">Impressions</option><option value="conversions">Conversions</option></select></label>
        <div className="chart-frame"><ResponsiveContainer><ComposedChart data={data?.trends || []} margin={{ top: 10, right: 16, bottom: 28, left: 22 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} label={{ value: "Date", position: "insideBottom", offset: -18 }} /><YAxis label={{ value: trendMetric === "spend" ? "Spend (currency)" : trendMetric === "impressions" ? "Impressions" : "Conversions (leads)", angle: -90, position: "insideLeft" }} /><Tooltip /><Legend /><Line type="monotone" dataKey={trendMetric} name={trendMetric} stroke="#2563eb" dot={false} /></ComposedChart></ResponsiveContainer></div>
      </ChartCard>
      <ChartCard title="Spend and conversions by campaign" description="Two series with separate units." {...chartProps} empty={!loading && !error && !rows.length}>
        <div className="chart-frame"><ResponsiveContainer><ComposedChart data={rows} margin={{ top: 10, right: 15, bottom: 30, left: 15 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={55} /><YAxis yAxisId="spend" label={{ value: "Spend (currency)", angle: -90, position: "insideLeft" }} /><YAxis yAxisId="conv" orientation="right" allowDecimals={false} label={{ value: "Conversions (leads)", angle: 90, position: "insideRight" }} /><Tooltip /><Legend /><Bar yAxisId="spend" dataKey="spend" name="Spend" fill="#2563eb" /><Bar yAxisId="conv" dataKey="conversions" name="Conversions" fill="#64748b" /></ComposedChart></ResponsiveContainer></div>
      </ChartCard>
      <ChartCard title="Cost per lead by campaign" description="Spend divided by conversions; unavailable when there are no conversions." {...chartProps} empty={!loading && !error && !rows.some((row) => row.cpl != null)}>
        <div className="chart-frame"><ResponsiveContainer><BarChart data={rows.filter((row) => row.cpl != null)} layout="vertical" margin={{ top: 5, right: 18, bottom: 22, left: 95 }}><CartesianGrid stroke="#e5e7eb" horizontal={false} /><XAxis type="number" label={{ value: "CPL (currency per conversion)", position: "insideBottom", offset: -14 }} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => currency(value)} /><Bar dataKey="cpl" name="CPL" fill="#2563eb" /></BarChart></ResponsiveContainer></div>
      </ChartCard>
      <ChartCard title="Return on ad spend by campaign" description="Revenue divided by spend." {...chartProps} empty={!loading && !error && !rows.some((row) => row.roas != null)}>
        <div className="chart-frame"><ResponsiveContainer><BarChart data={rows.filter((row) => row.roas != null)} layout="vertical" margin={{ top: 5, right: 18, bottom: 22, left: 95 }}><CartesianGrid stroke="#e5e7eb" horizontal={false} /><XAxis type="number" label={{ value: "ROAS (×)", position: "insideBottom", offset: -14 }} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => `${Number(value).toFixed(2)}×`} /><Bar dataKey="roas" name="ROAS" fill="#2563eb" /></BarChart></ResponsiveContainer></div>
      </ChartCard>
    </div>
    <section className="plain-card table-card"><h2>Campaign metrics</h2><DataTable columns={columns} rows={rows} loading={loading} error={error} /></section>
  </>;
}
