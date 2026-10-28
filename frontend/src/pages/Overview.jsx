import useDashboardData from "../components/useDashboardData";
import PageHeader from "../components/PageHeader";
import KpiCard from "../components/KpiCard";
import { ChartCard } from "../components/ChartCard";
import { ComposedChart, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { currency, number } from "../utils/metrics";

export default function Overview() {
  const { data, loading, error } = useDashboardData();
  const summary = data?.summary?.current;
  const spendByCampaign = [...(data?.campaignAnalytics || [])].sort((a, b) => b.spend - a.spend).slice(0, 10);
  const channelRows = data?.channels || [];
  const chartState = { loading, error };
  return <>
    <PageHeader title="Overview" description="Marketing results for the selected reporting period." data={data} />
    <div className="kpi-grid">
      <KpiCard label="Ad spend" value={summary?.spend} format="currency" changeKey="spend" previous={data?.summary?.previous} />
      <KpiCard label="Impressions" value={summary?.impressions} changeKey="impressions" previous={data?.summary?.previous} />
      <KpiCard label="Clicks" value={summary?.clicks} changeKey="clicks" previous={data?.summary?.previous} />
      <KpiCard label="Conversions (leads)" value={summary?.conversions} changeKey="conversions" previous={data?.summary?.previous} />
      <KpiCard label="Cost per lead" value={summary?.cpl} format="currency" changeKey="cpl" previous={data?.summary?.previous} />
    </div>
    <div className="chart-grid">
      <ChartCard title="Daily spend and conversions" description="Spend in account currency; one recorded conversion is counted as one lead." {...chartState} empty={!loading && !error && !data?.trends.length}>
        <div className="chart-frame"><ResponsiveContainer><ComposedChart data={data?.trends || []} margin={{ top: 8, right: 10, bottom: 28, left: 18 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} label={{ value: "Date", position: "insideBottom", offset: -18 }} /><YAxis yAxisId="spend" tickFormatter={(value) => currency(value)} label={{ value: "Spend (currency)", angle: -90, position: "insideLeft" }} /><YAxis yAxisId="conversions" orientation="right" allowDecimals={false} label={{ value: "Conversions (leads)", angle: 90, position: "insideRight" }} /><Tooltip /><Legend verticalAlign="top" /><Line yAxisId="spend" type="monotone" dataKey="spend" name="Spend" stroke="#2563eb" dot={false} /><Line yAxisId="conversions" type="monotone" dataKey="conversions" name="Conversions" stroke="#64748b" dot={false} /></ComposedChart></ResponsiveContainer></div>
      </ChartCard>
      <ChartCard title="Spend by campaign" description="Top 10 campaigns, sorted by spend." {...chartState} empty={!loading && !error && !spendByCampaign.length}>
        <div className="chart-frame"><ResponsiveContainer><BarChart data={spendByCampaign} layout="vertical" margin={{ top: 5, right: 20, bottom: 22, left: 90 }}><CartesianGrid stroke="#e5e7eb" horizontal={false} /><XAxis type="number" tickFormatter={(value) => currency(value)} label={{ value: "Spend (currency)", position: "insideBottom", offset: -14 }} /><YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => currency(value)} /><Bar dataKey="spend" name="Spend" fill="#2563eb" /></BarChart></ResponsiveContainer></div>
      </ChartCard>
      <ChartCard title="Conversions by channel" description="Conversions (leads) in the selected period." {...chartState} empty={!loading && !error && !channelRows.length}>
        <div className="chart-frame"><ResponsiveContainer><BarChart data={channelRows} margin={{ top: 8, right: 10, bottom: 28, left: 16 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="channel" label={{ value: "Channel", position: "insideBottom", offset: -18 }} /><YAxis allowDecimals={false} label={{ value: "Conversions (leads)", angle: -90, position: "insideLeft" }} /><Tooltip formatter={(value) => number(value)} /><Bar dataKey="conversions" name="Conversions" fill="#2563eb" /></BarChart></ResponsiveContainer></div>
      </ChartCard>
    </div>
  </>;
}
