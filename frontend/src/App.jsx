import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { DateRangeProvider } from "./context/DateRangeContext";
import { DataModeProvider } from "./context/DataModeContext";
const Overview = lazy(() => import("./pages/Overview"));
const Performance = lazy(() => import("./pages/Performance"));
const Channels = lazy(() => import("./pages/Channels"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const Keywords = lazy(() => import("./pages/Keywords"));
const Insights = lazy(() => import("./pages/Insights"));
const Reports = lazy(() => import("./pages/Reports"));
const Definitions = lazy(() => import("./pages/Definitions"));
const render = (Page) => <Suspense fallback={<div className="state-message">Loading page…</div>}><Page /></Suspense>;

export default function App() {
  return <BrowserRouter><DateRangeProvider><DataModeProvider><Routes><Route element={<AppLayout />}>
    <Route index element={render(Overview)} />
    <Route path="performance" element={render(Performance)} />
    <Route path="channels" element={render(Channels)} />
    <Route path="campaigns" element={render(Campaigns)} />
    <Route path="campaigns/:id" element={render(CampaignDetail)} />
    <Route path="keywords" element={render(Keywords)} />
    <Route path="insights" element={render(Insights)} />
    <Route path="reports" element={render(Reports)} />
    <Route path="definitions" element={render(Definitions)} />
    <Route path="*" element={<section className="plain-card"><h1>Page not found</h1></section>} />
  </Route></Routes></DataModeProvider></DateRangeProvider></BrowserRouter>;
}
