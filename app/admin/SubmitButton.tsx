"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

// Submit button that disables itself and says so while its form's server action runs.
export default function SubmitButton({ children, pending: pendingLabel = "Saving…", className = "btn btn-solid btn-sm" }: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:cursor-wait disabled:opacity-70`}>
      {pending ? <><LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" /> {pendingLabel}</> : children}
    </button>
  );
}
