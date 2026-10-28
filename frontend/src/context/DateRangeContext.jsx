import { createContext, useContext, useMemo, useState } from "react";

const DateRangeContext = createContext(null);
const day = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const defaults = () => {
  const end = new Date();
  const start = new Date(end.getTime() - 29 * 86400000);
  return { preset: "30", start: day(start), end: day(end), compare: false };
};

export function DateRangeProvider({ children }) {
  const [range, setRange] = useState(() => {
    try { return { ...defaults(), ...JSON.parse(localStorage.getItem("marketing_date_range") || "{}") }; }
    catch { return defaults(); }
  });
  const update = (values) => setRange((previous) => {
    const next = { ...previous, ...values };
    localStorage.setItem("marketing_date_range", JSON.stringify(next));
    return next;
  });
  const setPreset = (preset) => {
    const endDate = new Date();
    const days = Number(preset);
    if (days) update({ preset, end: day(endDate), start: day(new Date(endDate.getTime() - (days - 1) * 86400000)) });
    else update({ preset });
  };
  const value = useMemo(() => ({ ...range, setPreset, setCustomStart: (start) => update({ start, preset: "custom" }), setCustomEnd: (end) => update({ end, preset: "custom" }), setCompare: (compare) => update({ compare }) }), [range]);
  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export const useDateRange = () => useContext(DateRangeContext);
