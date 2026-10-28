import { queryString } from "../utils/metrics";
import { localBundle, getLocalDatabase } from "../utils/seedData";

let dataMode = "loading";
const modeListeners = new Set();
const updateMode = (mode) => { dataMode = mode; modeListeners.forEach((listener) => listener(mode)); };
export const getDataMode = () => dataMode;
export const subscribeDataMode = (listener) => { modeListeners.add(listener); return () => modeListeners.delete(listener); };

export class ApiError extends Error {
  constructor(message, status, details = []) { super(message); this.status = status; this.details = details; }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { ...options, headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options.headers } });
  } catch (error) {
    updateMode("offline");
    throw error;
  }
  if (!response.ok) {
    if (response.status >= 500) updateMode("offline");
    const payload = await response.json().catch(() => ({}));
    const message = payload.detail?.message || payload.error || payload.detail || response.statusText;
    throw new ApiError(typeof message === "string" ? message : "The request failed.", response.status, payload.details || payload.detail?.errors || []);
  }
  updateMode("online");
  if (response.status === 204) return null;
  return response.headers.get("content-type")?.includes("application/json") ? response.json() : response.text();
}

export async function loadBundle(range, minClicks = 0) {
  const params = { start: range.start, end: range.end };
  try {
    const health = await request("/api/health");
    const results = await Promise.allSettled([
      request(`/api/analytics/summary?${queryString({ ...params, compare: range.compare })}`),
      request(`/api/analytics/trends?${queryString(params)}`), request("/api/campaigns"),
      request(`/api/analytics/campaigns?${queryString(params)}`), request(`/api/analytics/channels?${queryString(params)}`),
      request("/api/keywords"), request(`/api/analytics/keywords?${queryString({ ...params, min_clicks: minClicks })}`),
    ]);
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
    const [summary, trends, campaigns, campaignAnalytics, channels, keywords, keywordAnalytics] = results.map((result) => result.value);
    return { campaigns, campaignAnalytics, keywords, keywordAnalytics, channels, trends, summary, source: health.source || "Local database" };
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error;
    updateMode("offline");
    return localBundle({ ...range, minClicks });
  }
}

export async function loadCampaignDetail(id, range) {
  try {
    const [campaign, trends] = await Promise.all([request(`/api/campaigns/${id}`), request(`/api/analytics/trends?${queryString({ start: range.start, end: range.end, campaign_id: id })}`)]);
    return { campaign, trends, source: "Local database" };
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error;
    const db = getLocalDatabase();
    const campaign = db.campaigns.find((row) => String(row.id) === String(id));
    if (!campaign) throw new ApiError("Campaign not found", 404);
    return { campaign, trends: campaign.dailyMetrics.filter((row) => row.date >= range.start && row.date <= range.end), source: "Sample data, local browser storage" };
  }
}

export async function saveRecord(kind, record, id = null) {
  const base = kind === "campaign" ? "/api/campaigns" : "/api/keywords";
  try { return await request(id ? `${base}/${id}` : base, { method: id ? "PUT" : "POST", body: JSON.stringify(record) }); }
  catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error;
    const db = getLocalDatabase();
    const collection = kind === "campaign" ? db.campaigns : db.keywords;
    const saved = id ? { ...collection.find((row) => row.id === Number(id)), ...record, id: Number(id) } : { ...record, id: Math.max(0, ...collection.map((row) => row.id)) + 1, dailyMetrics: [] };
    const index = collection.findIndex((row) => row.id === Number(id));
    if (index >= 0) collection[index] = saved; else collection.push(saved);
    localStorage.setItem("marketing_dashboard_local_db", JSON.stringify(db));
    updateMode("offline");
    return saved;
  }
}

export async function deleteRecord(kind, id) {
  const base = kind === "campaign" ? "/api/campaigns" : "/api/keywords";
  try { await request(`${base}/${id}`, { method: "DELETE" }); }
  catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error;
    const db = getLocalDatabase();
    if (kind === "campaign") {
      db.campaigns = db.campaigns.filter((row) => row.id !== Number(id));
      db.keywords = db.keywords.filter((row) => row.campaign_id !== Number(id));
    } else db.keywords = db.keywords.filter((row) => row.id !== Number(id));
    localStorage.setItem("marketing_dashboard_local_db", JSON.stringify(db));
    updateMode("offline");
  }
}

export async function reportText(report, params) {
  return request(`/api/reports/${report}.csv?${queryString(params)}`);
}
