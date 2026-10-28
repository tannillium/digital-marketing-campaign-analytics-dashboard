import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { ChartCard } from "../components/ChartCard";
import { loadCampaignDetail } from "../api/client";
import { useDateRange } from "../context/DateRangeContext";
import { ComposedChart, Line, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currency, number } from "../utils/metrics";

export default function CampaignDetail() {
  const { id } = useParams(); const range = useDateRange();
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: "" });
    loadCampaignDetail(id, range).then((data) => active && setState({ data, loading: false, error: "" })).catch((error) => active && setState({ data: null, loading: false, error: error.message }));
    return () => { active = false; };
  }, [id, range.start, range.end]);
  const { data, loading, error } = state;
  return <><PageHeader title={data?.campaign?.name || "Campaign details"} description={<Link to="/campaigns">← Back to campaigns</Link>} data={data} />
    <div className="detail-summary"><div><span>Channel</span><strong>{data?.campaign?.channel || "n/a"}</strong></div><div><span>Status</span><strong>{data?.campaign?.status || "n/a"}</strong></div><div><span>Budget</span><strong>{data ? currency(data.campaign.budget) : "n/a"}</strong></div></div>
    <ChartCard title="Daily campaign performance" description="Spend and conversions for this campaign." loading={loading} error={error} empty={!loading && !error && !data?.trends.length}>
      <div className="chart-frame large-chart"><ResponsiveContainer><ComposedChart data={data?.trends || []} margin={{ top: 12, right: 18, bottom: 30, left: 20 }}><CartesianGrid stroke="#e5e7eb" vertical={false} /><XAxis dataKey="date" minTickGap={24} tick={{ fontSize: 11 }} label={{ value: "Date", position: "insideBottom", offset: -20 }} /><YAxis yAxisId="spend" tickFormatter={(value) => currency(value)} label={{ value: "Spend (currency)", angle: -90, position: "insideLeft" }} /><YAxis yAxisId="conversions" orientation="right" allowDecimals={false} tickFormatter={number} label={{ value: "Conversions (leads)", angle: 90, position: "insideRight" }} /><Tooltip /><Legend /><Line yAxisId="spend" dataKey="spend" name="Spend" stroke="#2563eb" dot={false} /><Line yAxisId="conversions" dataKey="conversions" name="Conversions" stroke="#64748b" dot={false} /></ComposedChart></ResponsiveContainer></div>
    </ChartCard>
  </>;
}
