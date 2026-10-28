import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { saveRecord, deleteRecord } from "../api/client";
import useDashboardData from "../components/useDashboardData";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { currency, metric } from "../utils/metrics";

const emptyForm = { name: "", channel: "Search", status: "Live", budget: "", start_date: "", end_date: "" };
export default function Campaigns() {
  const { data, loading, error, reload } = useDashboardData();
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("All");
  const [status, setStatus] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const rows = useMemo(() => (data?.campaignAnalytics || []).filter((row) => row.name.toLowerCase().includes(search.toLowerCase()) && (channel === "All" || row.channel === channel) && (status === "All" || row.status === status)).map((row) => ({ ...row, budget_pacing: row.budget ? row.spend_to_date / row.budget * 100 : null })), [data, search, channel, status]);

  async function submit(event) {
    event.preventDefault(); setFormError(""); setSaving(true);
    try {
      await saveRecord("campaign", { ...form, budget: Number(form.budget), start_date: form.start_date || null, end_date: form.end_date || null }, editing);
      setForm(emptyForm); setEditing(null); await reload();
    } catch (saveError) { setFormError([saveError.message, ...(saveError.details || []).map((item) => item.message || item)].join(" ")); }
    finally { setSaving(false); }
  }

  function edit(row) { setEditing(row.id); setForm({ name: row.name, channel: row.channel, status: row.status, budget: String(row.budget), start_date: row.start_date || "", end_date: row.end_date || "" }); setFormError(""); }
  async function remove(row) {
    if (!window.confirm(`Delete “${row.name}” and its associated metrics and keywords?`)) return;
    try { await deleteRecord("campaign", row.id); await reload(); } catch (deleteError) { setFormError(deleteError.message); }
  }

  const columns = [
    { key: "name", label: "Campaign", render: (row) => <Link to={`/campaigns/${row.id}`}>{row.name}</Link> },
    { key: "channel", label: "Channel" }, { key: "status", label: "Status" }, { key: "budget", label: "Budget", render: (row) => currency(row.budget) },
    { key: "spend", label: "Spend", render: (row) => currency(row.spend) }, { key: "budget_pacing", label: "Budget pacing", render: (row) => metric(row.budget_pacing, 1, "%") },
    { key: "conversions", label: "Conversions" }, { key: "actions", label: "Actions", sortable: false, render: (row) => <span className="row-actions"><button type="button" onClick={() => edit(row)}>Edit</button><button type="button" className="text-danger" onClick={() => remove(row)}>Delete</button></span> },
  ];

  return <>
    <PageHeader title="Campaigns" description="Create, filter, and manage campaign budgets and dates." data={data} />
    <section className="plain-card form-card"><h2>{editing ? "Edit campaign" : "Create campaign"}</h2>
      <form className="form-grid" onSubmit={submit}>
        <label>Campaign name<input required minLength="2" maxLength="160" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Channel<select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })}>{["Search", "Social", "Display", "Email"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{["Live", "Paused", "Draft"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Budget<input type="number" required min="0" step="0.01" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} /></label>
        <label>Start date<input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} /></label>
        <label>End date<input type="date" min={form.start_date || undefined} value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} /></label>
        <div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create campaign"}</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyForm); setFormError(""); }}>Cancel edit</button>}</div>
      </form>
      {formError && <p className="error-message" role="alert">{formError}</p>}
    </section>
    <section className="plain-card table-card"><div className="section-tools"><h2>Campaign list</h2><label>Search<input type="search" value={search} placeholder="Campaign name" onChange={(event) => setSearch(event.target.value)} /></label><label>Channel<select value={channel} onChange={(event) => setChannel(event.target.value)}><option>All</option>{["Search", "Social", "Display", "Email"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option>{["Live", "Paused", "Draft"].map((item) => <option key={item}>{item}</option>)}</select></label></div><DataTable columns={columns} rows={rows} loading={loading} error={error} /></section>
  </>;
}
