// The studio works in IST; without a zone, server-rendered times come out in the server's (UTC on Vercel).
const TZ = "Asia/Kolkata";

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ });
export const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// Money is INR across the app. Amounts are stored as numeric(12,2) and arrive as numbers or strings.
const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
export const fmtMoney = (n: number | string) => INR.format(Number(n) || 0);
// Plain dates (date columns, "2026-10-08") shown without a time-zone shift.
export const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
// Today as YYYY-MM-DD in IST, for date inputs.
export const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
