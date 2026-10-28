export const safeDivide = (a, b) => (Number(b) ? Number(a) / Number(b) : null);
export const metric = (value, digits = 1, suffix = "") => value == null || !Number.isFinite(Number(value)) ? "n/a" : `${Number(value).toFixed(digits)}${suffix}`;
export const currency = (value) => value == null || !Number.isFinite(Number(value)) ? "n/a" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
export const number = (value) => value == null ? "n/a" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
export const percentChange = (current, previous) => previous == null || previous === 0 || current == null ? null : ((current - previous) / Math.abs(previous)) * 100;
export const queryString = (values) => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== "").map(([key, value]) => [key, String(value)])).toString();
