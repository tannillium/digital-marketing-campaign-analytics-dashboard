import { safeDivide } from "./metrics";

const campaignNames = ["Northstar Search", "Summer Social Launch", "Retargeting Core", "Weekly Product Digest", "Brand Search Always On", "B2B Pipeline Builder", "Display Prospecting", "Customer Winback", "Mobile App Acquisition", "Seasonal Offers", "Partner Lead Program", "Product Education"];
const channels = ["Search", "Social", "Display", "Email"];
const topics = ["digital marketing", "campaign analytics", "growth strategy", "lead generation", "marketing agency", "customer acquisition", "online advertising", "conversion optimization", "brand awareness", "marketing automation"];
const dayString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function getLocalDatabase() {
  try {
    const saved = JSON.parse(localStorage.getItem("marketing_dashboard_local_db") || "null");
    if (saved?.campaigns?.length && saved?.keywords?.length) return saved;
  } catch { /* Replace invalid browser data with the bundled sample dataset. */ }
  const today = new Date();
  const campaigns = campaignNames.map((name, index) => ({ id: index + 1, name, channel: channels[index % channels.length], status: [3, 8].includes(index) ? "Paused" : "Live", budget: 18000 + index * 3200, start_date: dayString(new Date(today.getTime() - 120 * 86400000)), end_date: dayString(new Date(today.getTime() + 35 * 86400000)), dailyMetrics: [] }));
  const keywords = [];
  campaigns.forEach((campaign, campaignIndex) => {
    for (let topicIndex = 0; topicIndex < 5; topicIndex += 1) {
      const id = campaignIndex * 5 + topicIndex + 1;
      keywords.push({ id, campaign_id: campaign.id, text: `${topics[(campaignIndex + topicIndex * 2) % topics.length]} ${["services", "software", "company", "solutions", "near me"][(campaignIndex + topicIndex) % 5]}`, match_type: ["Exact", "Phrase", "Broad"][(campaignIndex + topicIndex) % 3], max_cpc: 18 + ((id * 31) % 68), dailyMetrics: [] });
    }
  });
  for (let offset = 89; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const iso = dayString(date);
    const weekday = date.getUTCDay() === 0 || date.getUTCDay() === 6 ? 0.68 : 1;
    campaigns.forEach((campaign, index) => {
      const variation = 0.78 + ((offset * 7 + index * 11) % 43) / 100;
      const impressions = Math.round((950 + index * 125) * weekday * variation);
      const clicks = Math.round(impressions * (0.025 + (index % 4) * 0.004));
      const spend = Math.round(clicks * (16 + index * 1.7) * (0.9 + variation / 5) * 100) / 100;
      const conversions = Math.max(0, Math.round(clicks * (0.035 + (index % 3) * 0.012)));
      campaign.dailyMetrics.push({ date: iso, impressions, clicks, spend, conversions, revenue: conversions * (245 + index * 24) });
    });
    keywords.forEach((keyword, index) => {
      const weekdayFactor = weekday === 1 ? 1 : 0.62;
      const impressions = Math.round((35 + (index % 5) * 14 + (Math.floor(index / 5) % 4) * 9) * weekdayFactor * (0.75 + ((index * 17 + offset * 13) % 50) / 100));
      const clicks = Math.min(impressions, Math.round(impressions * (0.025 + (index % 5) * 0.008)));
      const spend = Math.round(clicks * keyword.max_cpc * 0.68 * 100) / 100;
      const conversions = Math.round(clicks * (0.03 + (index % 5) * 0.018));
      keyword.dailyMetrics.push({ date: iso, impressions, clicks, spend, conversions });
    });
  }
  const database = { campaigns, keywords };
  localStorage.setItem("marketing_dashboard_local_db", JSON.stringify(database));
  return database;
}

function aggregate(rows, start, end) {
  const chosen = rows.filter((row) => row.date >= start && row.date <= end);
  return chosen.reduce((totals, row) => ({ impressions: totals.impressions + row.impressions, clicks: totals.clicks + row.clicks, spend: totals.spend + row.spend, conversions: totals.conversions + row.conversions, revenue: totals.revenue + (row.revenue || 0) }), { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 });
}
function withDerived(totals) {
  return { ...totals, ctr: safeDivide(totals.clicks * 100, totals.impressions), cpc: safeDivide(totals.spend, totals.clicks), conversion_rate: safeDivide(totals.conversions * 100, totals.clicks), cpl: safeDivide(totals.spend, totals.conversions), roas: safeDivide(totals.revenue, totals.spend) };
}

export function localBundle({ start, end, compare, minClicks = 0 }) {
  const db = getLocalDatabase();
  const campaigns = db.campaigns.map(({ dailyMetrics, ...row }) => ({ ...row, spend_to_date: dailyMetrics.filter((item) => item.date <= dayString(new Date())).reduce((sum, item) => sum + item.spend, 0), ...withDerived(aggregate(dailyMetrics, start, end)) }));
  const keywords = db.keywords.map(({ dailyMetrics, ...row }) => {
    const campaign = campaigns.find((item) => item.id === row.campaign_id);
    return { ...row, campaign_name: campaign?.name, ...withDerived(aggregate(dailyMetrics, start, end)) };
  }).filter((row) => row.clicks >= minClicks);
  const allDays = new Set(db.campaigns.flatMap((campaign) => campaign.dailyMetrics.filter((row) => row.date >= start && row.date <= end).map((row) => row.date)));
  const trends = [...allDays].sort().map((date) => {
    const totals = db.campaigns.reduce((sum, campaign) => {
      const item = campaign.dailyMetrics.find((row) => row.date === date);
      if (item) Object.keys(sum).forEach((key) => { sum[key] += item[key] || 0; });
      return sum;
    }, { spend: 0, impressions: 0, clicks: 0, conversions: 0 });
    return { date, ...totals };
  });
  const channels = ["Search", "Social", "Display", "Email"].map((channel) => {
    const group = campaigns.filter((campaign) => campaign.channel === channel);
    const totals = group.reduce((sum, row) => { ["spend", "impressions", "clicks", "conversions", "revenue"].forEach((key) => { sum[key] += row[key] || 0; }); return sum; }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 });
    return { channel, campaign_count: group.length, ...withDerived(totals) };
  });
  const sumCampaigns = (from, to) => withDerived(db.campaigns.reduce((sum, campaign) => {
    const item = aggregate(campaign.dailyMetrics, from, to);
    ["spend", "impressions", "clicks", "conversions", "revenue"].forEach((key) => { sum[key] += item[key]; });
    return sum;
  }, { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }));
  const current = sumCampaigns(start, end);
  let previous = null;
  let changes = null;
  if (compare) {
    const days = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
    const shift = (iso, offset) => { const [year, month, date] = iso.split("-").map(Number); return dayString(new Date(year, month - 1, date + offset)); };
    const previousEnd = shift(start, -1);
    const previousStart = shift(previousEnd, -(days - 1));
    previous = sumCampaigns(previousStart, previousEnd);
    changes = Object.fromEntries(["spend", "impressions", "clicks", "conversions", "cpl"].map((key) => [key, previous[key] && current[key] != null ? ((current[key] - previous[key]) / Math.abs(previous[key])) * 100 : null]));
  }
  const campaignsRaw = db.campaigns.map(({ dailyMetrics, ...row }) => row);
  const keywordsRaw = db.keywords.map(({ dailyMetrics, ...row }) => row);
  return { campaigns: campaignsRaw, campaignAnalytics: campaigns, keywords: keywordsRaw, keywordAnalytics: keywords, channels, trends, summary: { period: { start, end }, current, previous, changes }, source: "Sample data, local browser storage" };
}
