import { useEffect, useState } from "react";
import useDashboardData from "../components/useDashboardData";
import { reportText } from "../api/client";
import { getLocalDatabase } from "../utils/seedData";
import { useDateRange } from "../context/DateRangeContext";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { currency } from "../utils/metrics";

const reports = { campaigns: "Campaigns CSV", keywords: "Keywords CSV", "daily-metrics": "Campaign daily metrics CSV" };
function csvValue(value) { const text = value == null ? "" : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function offlineCsv(report, range, filters, bundle) {
  const db = getLocalDatabase();
  const campaignMap = new Map(db.campaigns.map((row) => [row.id, row]));
  const inRange = (rows) => rows.filter((row) => row.date >= range.start && row.date <= range.end);
  let headers; let rows;
  if (report === "campaigns") {
    headers = ["id", "name", "channel", "status", "budget", "spend", "impressions", "clicks", "ctr", "cpc", "conversions", "cpl", "roas"];
    rows = (bundle.campaignAnalytics || []).filter((row) => (filters.channel === "All" || row.channel === filters.channel) && (filters.campaignId === "All" || row.id === Number(filters.campaignId))).map((row) => headers.map((key) => row[key]));
  } else if (report === "keywords") {
    headers = ["id", "campaign_id", "campaign_name", "text", "match_type", "max_cpc", "impressions", "clicks", "ctr", "conversions", "conversion_rate", "spend"];
    rows = db.keywords.filter((keyword) => (filters.channel === "All" || campaignMap.get(keyword.campaign_id)?.channel === filters.channel) && (filters.campaignId === "All" || keyword.campaign_id === Number(filters.campaignId))).map((keyword) => {
      const metrics = inRange(keyword.dailyMetrics).reduce((sum, row) => { ["impressions", "clicks", "conversions", "spend"].forEach((key) => { sum[key] += row[key]; }); return sum; }, { impressions: 0, clicks: 0, conversions: 0, spend: 0 });
      return [keyword.id, keyword.campaign_id, campaignMap.get(keyword.campaign_id)?.name, keyword.text, keyword.match_type, keyword.max_cpc, metrics.impressions, metrics.clicks, metrics.impressions ? metrics.clicks / metrics.impressions * 100 : null, metrics.conversions, metrics.clicks ? metrics.conversions / metrics.clicks * 100 : null, metrics.spend];
    });
  } else {
    headers = ["date", "campaign_id", "campaign", "channel", "impressions", "clicks", "spend", "conversions", "revenue"];
    rows = db.campaigns.filter((campaign) => (filters.channel === "All" || campaign.channel === filters.channel) && (filters.campaignId === "All" || campaign.id === Number(filters.campaignId))).flatMap((campaign) => inRange(campaign.dailyMetrics).map((row) => [row.date, campaign.id, campaign.name, campaign.channel, row.impressions, row.clicks, row.spend, row.conversions, row.revenue]));
  }
  return [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
}

function previewRows(text) {
  const lines = text.trim().split(/\r?\n/);
  const parse = (line) => line.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)?.map((cell) => cell.replace(/,$/, "").replace(/^"|"$/g, "").replaceAll('""', '"')) || [];
  const headers = parse(lines[0] || "");
  return lines.slice(1, 11).map((line, index) => Object.fromEntries(headers.map((header, cell) => [header || `Column ${cell + 1}`, parse(line)[cell] || ""])));
}

export default function Reports() {
  const { data, loading, error } = useDashboardData(); const range = useDateRange();
  const [channel, setChannel] = useState("All"); const [campaignId, setCampaignId] = useState("All");
  const [report, setReport] = useState("campaigns"); const [preview, setPreview] = useState([]); const [hasPreview, setHasPreview] = useState(false); const [previewError, setPreviewError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { setPreview([]); setHasPreview(false); }, [range.start, range.end, channel, campaignId, report]);
  const params = { start: range.start, end: range.end, channel: channel === "All" ? "" : channel, campaign_id: campaignId === "All" ? "" : campaignId };
  async function loadPreview() {
    setBusy(true); setPreviewError("");
    try {
      let text;
      try { text = await reportText(report, params); }
      catch (requestError) { if (requestError.status && requestError.status < 500) throw requestError; text = offlineCsv(report, range, { channel, campaignId }, data); }
      setPreview(previewRows(text)); setHasPreview(true);
    } catch (previewLoadError) { setPreviewError(previewLoadError.message || "Could not build the report preview."); setPreview([]); setHasPreview(false); }
    finally { setBusy(false); }
  }
  async function download() {
    setBusy(true); setPreviewError("");
    try {
      let text;
      try { text = await reportText(report, params); }
      catch (requestError) { if (requestError.status && requestError.status < 500) throw requestError; text = offlineCsv(report, range, { channel, campaignId }, data); }
      const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${report}.csv`; anchor.click(); URL.revokeObjectURL(url);
    } catch (downloadError) { setPreviewError(downloadError.message || "Could not export this report."); }
    finally { setBusy(false); }
  }
  const columns = Object.keys(preview[0] || {}).map((key) => ({ key, label: key }));
  return <>
    <PageHeader title="Reports" description="Preview filtered CSV reports before downloading." data={data} />
    <section className="plain-card form-card"><h2>Report options</h2><div className="form-grid report-controls">
      <label>Report<select value={report} onChange={(event) => { setReport(event.target.value); setPreview([]); setHasPreview(false); }}>{Object.entries(reports).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Channel<select value={channel} onChange={(event) => { setChannel(event.target.value); setPreview([]); setHasPreview(false); }}><option>All</option>{["Search", "Social", "Display", "Email"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Campaign<select value={campaignId} onChange={(event) => { setCampaignId(event.target.value); setPreview([]); setHasPreview(false); }}><option>All</option>{(data?.campaigns || []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      <div className="form-actions"><button className="secondary-button" disabled={busy || loading || !!error} onClick={loadPreview}>Preview first 10 rows</button><button className="primary-button" disabled={busy || loading || !!error || !hasPreview} onClick={download}>Download CSV</button></div>
    </div>{previewError && <p className="error-message" role="alert">{previewError}</p>}</section>
    <section className="plain-card table-card"><h2>Preview</h2>{preview.length ? <DataTable columns={columns} rows={preview.map((row, index) => ({ ...row, _row: index }))} rowKey="_row" /> : <p className="muted">{hasPreview ? "The selected report has no data rows; the CSV still contains its column header." : "Choose Preview to show up to 10 report rows for the selected period and filters."}</p>}</section>
  </>;
}
