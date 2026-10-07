import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

// Clerk's form, restyled with the site tokens. Its own header and sign-up footer are hidden:
// the page supplies the heading, and admin accounts are invite-only.
export const appearance = {
  variables: {
    colorPrimary: "#2B140C",
    colorPrimaryForeground: "#FFF2CF",
    colorBackground: "#FFF8E7",
    colorForeground: "#2B140C",
    colorMutedForeground: "#6E4A3A",
    colorInput: "#FFF8E7",
    colorInputForeground: "#2B140C",
    colorBorder: "rgb(43 20 12 / 0.18)",
    colorDanger: "#C2381A",
    fontFamily: "var(--font-geist), system-ui, sans-serif",
    fontSize: "15px",
    borderRadius: "12px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full max-w-none shadow-none border-0 rounded-none",
    card: "bg-transparent shadow-none border-0 p-0",
    header: "hidden",
    footer: "hidden",
    formButtonPrimary: "rounded-full py-3 text-[15px] font-medium normal-case shadow-none hover:bg-accent hover:text-on-accent",
    socialButtonsBlockButton: "rounded-full border-line shadow-none",
    formFieldInput: "py-2.5 shadow-none",
  },
};

// Brand panel + form column shared by sign-in and sign-up.
export default function AuthFrame({ title, intro, tagline = "The studio desk. Inquiries, testimonials, work and people.", children }: { title: string; intro: string; tagline?: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand panel: desktop only, the form is the whole page on mobile */}
      <aside className="on-accent relative hidden flex-col justify-between overflow-hidden bg-accent p-12 text-on-accent lg:flex">
        <Link href="/" className="font-display text-2xl tracking-tight">{SITE_NAME}</Link>
        <Image
          src="/hero/scene/pass.png"
          alt=""
          width={1254}
          height={1254}
          priority
          sizes="40vw"
          className="mx-auto h-auto w-[78%] max-w-[520px] -rotate-6 drop-shadow-[0_40px_60px_rgb(43_20_12/0.25)]"
        />
        <p className="max-w-sm font-display text-3xl leading-tight tracking-tight">{tagline}</p>
      </aside>

      <section className="flex flex-col px-4 py-8 sm:px-10 lg:px-16">
        <Link href="/" className="u-link inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Back to site
        </Link>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <p className="mb-3 font-display text-lg tracking-tight lg:hidden">{SITE_NAME}</p>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 mb-10 text-muted">{intro}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
