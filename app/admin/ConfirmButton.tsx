"use client";

// Submit button that asks first. ponytail: native confirm(), styled dialog if the browser prompt ever feels off-brand.
export default function ConfirmButton({ message, className, label, children }: { message: string; className?: string; label?: string; children: React.ReactNode }) {
  return (
    <button type="submit" className={className} aria-label={label} title={label} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
