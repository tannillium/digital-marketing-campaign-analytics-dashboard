import PageHeader from "../components/PageHeader";

const definitions = [
  ["Spend", "Sum of daily cost in the account currency."],
  ["Impressions", "Number of ad displays."],
  ["Clicks", "Number of ad clicks."],
  ["Conversion / Lead", "One recorded conversion event is counted as one lead. The backend defines this in LEAD_DEFINITION."],
  ["CTR", "Clicks ÷ impressions. Displayed as a percentage."],
  ["CPC", "Spend ÷ clicks."],
  ["Conversion rate", "Conversions ÷ clicks. Displayed as a percentage."],
  ["Cost per Lead (CPL)", "Spend ÷ conversions."],
  ["ROAS", "Revenue ÷ spend."],
];

export default function Definitions() {
  return <><PageHeader title="Metric definitions" description="Shared definitions used by the dashboard and reports." data={{ source: "Application definitions" }} />
    <section className="plain-card"><h2>How metrics are calculated</h2><p className="muted">Every ratio guards against a zero denominator. When it cannot be calculated, the dashboard displays “n/a”.</p><dl className="definitions-list">{definitions.map(([term, description]) => <div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}</dl></section>
  </>;
}
