import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export default function PortalHeader({ email }: { email?: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line pb-5">
      <Link href="/portal" className="leading-tight">
        <span className="font-display text-lg tracking-tight">{SITE_NAME}</span>
        <span className="block text-xs text-muted">Client portal</span>
      </Link>
      <div className="flex items-center gap-4">
        {email && <span className="hidden text-sm text-muted sm:inline">{email}</span>}
        <SignOutButton redirectUrl="/"><button className="btn btn-ghost btn-sm"><LogOut size={14} /> Log out</button></SignOutButton>
      </div>
    </header>
  );
}
