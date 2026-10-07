"use client";

import { Printer } from "lucide-react";

// Browser print: "Save as PDF" in the print dialog gives the PDF. ponytail: no PDF library until a server-made file is needed (e.g. emailing it).
export default function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="btn btn-solid btn-sm"><Printer size={14} /> Print or save PDF</button>;
}
