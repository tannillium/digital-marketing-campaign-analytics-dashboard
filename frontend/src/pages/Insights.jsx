import { useMemo, useState } from "react";
import useDashboardData from "../components/useDashboardData";
import PageHeader from "../components/PageHeader";
import { ChartCard } from "../components/ChartCard";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { currency, metric } from "../utils/metrics";

export default function Insights() {
  const [minimumClicks, setMinimumClicks] = useState(50);
  const { data, loading, error } = useDashboardData();
  const keywords = data?.keywordAnalytics || [];
  const topKeywords = useMemo(() => [...keywords].filter((row) => row.clicks >= minimumClicks && row.conversion_rate != null).sort((a, b) => b.conversion_rate - a.conversion_rate).slice(0, 10), [keywords, minimumClicks]);
  const matchTypeRows = useMemo(() => ["Broad", "Phrase", "Exact"].map((match_type) => {
    const group = keywords.filter((row) => row.match_type === match_type);
    const impressions = group.reduce((sum, row) => sum + row.impressions, 0); const clicks = group.reduce((sum, row) => sum + row.clicks, 0);
    return { match_type, ctr: impressions ? clicks / impressions * 100 : null };
  }), [keywords]);
  const campaigns = data?.campaignAnalytics || [];
  const bestRoas = campaigns.filter((row) => row.roas != null).sort((a, b) => b.roas - a.roas)[0];
  const highestCpl = (data?.channels || []).filter((row) => row.cpl != null).sort((a, b) => b.cpl - a.cpl)[0];
  const overBudget = campaigns.filter((row) => row.budget > 0 && row.spend / row.budget >= 0.9);
  const chartProps = { loading, error };
  return <>
    <PageHeader title="Insights" description="Find efficient keywords and review rule-based account highlights." data={data} />
    <label className="threshold-control">Minimum keyword clicks<input type="number" min="0" value={minimumClicks} onChange={(event) => setMinimumClicks(Math.max(0, Number(event.target.value)))} /><span>Default: 50</span></label>
    <div className="chart-grid">
      <ChartCard title="Top keywords by conversion rate" description={`Only keywords with at least ${minimumClicks} clicks are included.`} {...chartProps} empty={!loading && !error && !topKeywords.length}><div className="chart-frame"><ResponsiveContainer><BarChart data={topKeywords} layout="vertical" margin={{ top: 5, right: 20, bottom: 25, left: 150 }}><CartesianGrid stroke="#e5e7eb" horizontal={false} /><XAxis type="number" label={{ value: "Conversion rate (%)", position: "insideBottom", offset: -16 }} /><YAxis type="category" dataKey="text" width={160} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} /><Bar dataKey="conversion_rate" name="Conversion rate" fill="#2563eb" /></BarChart></ResponsiveContainer></div></ChartCard>
      <ChartCard title="Keyword clicks and conversions" description="Each point represents one keyword." {...chartProps} empty={!loading && !error && !keywords.length}><div className="chart-frame"><ResponsiveContainer><ScatterChart margin={{ top: 12, right: 18, bottom: 30, left: 18 }}><CartesianGrid stroke="#e5e7eb" /><XAxis type="number" dataKey="clicks" name="Clicks" label={{ value: "Clicks", position: "insideBottom", offset: -18 }} /><YAxis type="number" dataKey="conversions" name="Conversions" label={{ value: "Conversions (leads)", angle: -90, position: "insideLeft" }} /><Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name, props) => [value, name]} labelFormatter={(_, payload) => payload?.[0]?.payload?.text || "Keyword"} /><Scatter name="Keywords" data={keywords} fill="#2563eb" /></ScatterChart></ResponsiveContainer></div></ChartCard>
      <ChartCard title="CTR by match type" description="Total clicks divided by total impressions for each match type." {...chartProps} empty={!loading && !error && !keywords.length}><div className="chart-frame"><ResponsiveContainer><BarChart data={matchTypeRows} margin={{ top: 8, right: 12, bottom: 28, left: 20 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="match_type" label={{ value: "Match type", position: "insideBottom", offset: -18 }} /><YAxis label={{ value: "CTR (%)", angle: -90, position: "insideLeft" }} /><Tooltip formatter={(value) => metric(value, 2, "%")} /><Bar dataKey="ctr" name="CTR" fill="#2563eb" /></BarChart></ResponsiveContainer></div></ChartCard>
    </div>
    <section className="plain-card"><h2>Highlights</h2>{loading ? <p>Loading account data…</p> : error ? <p className="error-message">{error}</p> : <ul className="highlight-list">
      {bestRoas ? <li>{bestRoas.name} has the highest ROAS at {metric(bestRoas.roas, 2, "×")}.</li> : <li>ROAS is unavailable until campaigns have spend and revenue data.</li>}
      {highestCpl ? <li>{highestCpl.channel} has the highest channel CPL at {currency(highestCpl.cpl)}.</li> : <li>Channel CPL is unavailable until conversions are recorded.</li>}
      {overBudget.length ? overBudget.map((row) => <li key={row.id}>{row.name} has used {metric(row.spend / row.budget * 100, 1, "%")} of its budget in this selected period.</li>) : <li>No campaign has reached 90% of its budget in this selected period.</li>}
    </ul>}</section>
  </>;
}
