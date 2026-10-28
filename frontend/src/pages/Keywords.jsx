import { useMemo, useState } from "react";
import { deleteRecord, saveRecord } from "../api/client";
import useDashboardData from "../components/useDashboardData";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { currency, metric, number } from "../utils/metrics";

export default function Keywords() {
  const { data, loading, error, reload } = useDashboardData();
  const [search, setSearch] = useState(""); const [matchType, setMatchType] = useState("All"); const [campaignId, setCampaignId] = useState("All");
  const [form, setForm] = useState({ text: "", campaign_id: "", match_type: "Exact", max_cpc: "" }); const [formError, setFormError] = useState(""); const [saving, setSaving] = useState(false);
  const campaigns = data?.campaigns || [];
  const rows = useMemo(() => (data?.keywordAnalytics || []).filter((row) => row.text.toLowerCase().includes(search.toLowerCase()) && (matchType === "All" || row.match_type === matchType) && (campaignId === "All" || row.campaign_id === Number(campaignId))), [data, search, matchType, campaignId]);
  async function submit(event) {
    event.preventDefault(); setFormError(""); setSaving(true);
    try { await saveRecord("keyword", { ...form, campaign_id: Number(form.campaign_id), max_cpc: Number(form.max_cpc) }); setForm({ text: "", campaign_id: "", match_type: "Exact", max_cpc: "" }); await reload(); }
    catch (saveError) { setFormError([saveError.message, ...(saveError.details || []).map((item) => item.message || item)].join(" ")); }
    finally { setSaving(false); }
  }
  async function remove(row) { if (!window.confirm(`Delete keyword “${row.text}”?`)) return; try { await deleteRecord("keyword", row.id); await reload(); } catch (deleteError) { setFormError(deleteError.message); } }
  const columns = [
    { key: "text", label: "Keyword" }, { key: "campaign_name", label: "Campaign" }, { key: "match_type", label: "Match type" },
    { key: "impressions", label: "Impressions", render: (row) => number(row.impressions) }, { key: "clicks", label: "Clicks", render: (row) => number(row.clicks) },
    { key: "ctr", label: "CTR", render: (row) => metric(row.ctr, 2, "%") }, { key: "conversions", label: "Conversions", render: (row) => number(row.conversions) },
    { key: "conversion_rate", label: "Conversion rate", render: (row) => metric(row.conversion_rate, 2, "%") },
    { key: "actions", label: "Actions", sortable: false, render: (row) => <button type="button" className="text-danger" onClick={() => remove(row)}>Delete</button> },
  ];
  return <>
    <PageHeader title="Keywords" description="Review search term performance and manage keyword targets." data={data} />
    <section className="plain-card form-card"><h2>Add keyword</h2><form className="form-grid" onSubmit={submit}>
      <label>Keyword text<input required maxLength="200" value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} /></label>
      <label>Campaign<select required value={form.campaign_id} onChange={(event) => setForm({ ...form, campaign_id: event.target.value })}><option value="">Select campaign</option>{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Match type<select value={form.match_type} onChange={(event) => setForm({ ...form, match_type: event.target.value })}>{["Broad", "Phrase", "Exact"].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Maximum CPC<input type="number" required min="0" step="0.01" value={form.max_cpc} onChange={(event) => setForm({ ...form, max_cpc: event.target.value })} /></label>
      <div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Add keyword"}</button></div>
    </form>{formError && <p className="error-message" role="alert">{formError}</p>}</section>
    <section className="plain-card table-card"><div className="section-tools"><h2>Keyword performance</h2><label>Search<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Keyword text" /></label><label>Match type<select value={matchType} onChange={(event) => setMatchType(event.target.value)}><option>All</option>{["Broad", "Phrase", "Exact"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Campaign<select value={campaignId} onChange={(event) => setCampaignId(event.target.value)}><option>All</option>{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><DataTable columns={columns} rows={rows} loading={loading} error={error} /></section>
  </>;
}
