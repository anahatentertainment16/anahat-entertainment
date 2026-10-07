// Shared by the server and the browser editor, so the live total matches the saved one.
export type InvoiceItem = { description: string; qty: number; rate: number };

// Rounded to paise at each step so the printed lines add up to the printed total.
export const round = (n: number) => Math.round(n * 100) / 100;

export function totals(items: InvoiceItem[], taxRate: number) {
  const subtotal = round(items.reduce((sum, i) => sum + round((Number(i.qty) || 0) * (Number(i.rate) || 0)), 0));
  const tax = round((subtotal * (Number(taxRate) || 0)) / 100);
  return { subtotal, tax, total: round(subtotal + tax) };
}
