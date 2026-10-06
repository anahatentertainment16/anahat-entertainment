import { BedDouble, CalendarCheck, Contact, GraduationCap, ReceiptText, ScanBarcode, ShoppingBag, Stethoscope, UtensilsCrossed, Wallet, type LucideIcon } from "lucide-react";

type Service = { n: string; slug: string; title: string; blurb: string; includes?: { label: string; icon: LucideIcon }[] };

export const services: Service[] = [
  {
    n: "01",
    slug: "advertising-branded-content",
    title: "Advertising & Branded Content",
    blurb: "Campaigns and films that earn attention instead of buying it: concept, production, and the kind of story people actually pass on.",
  },
  {
    n: "02",
    slug: "web-development",
    title: "Web Development",
    blurb: "Sites and digital products engineered to feel inevitable. Fast, considered, and built to convert without ever looking like it.",
  },
  {
    n: "03",
    slug: "ai-partnerships",
    title: "AI Partnerships",
    blurb: "Creative systems built with intelligent tools, generative pipelines and bespoke models that extend what a small team can make.",
  },
  {
    n: "04",
    slug: "social-media",
    title: "Social Media",
    blurb: "Always-on storytelling that compounds. Channels, content engines, and community that turn audiences into advocates.",
  },
  {
    n: "05",
    slug: "custom-software",
    title: "Custom Software",
    blurb: "Business software built around how you actually work, from the first booking to the final invoice. Yours to own, no per-seat fees.",
    includes: [
      { label: "Custom CRMs", icon: Contact },
      { label: "Booking & scheduling", icon: CalendarCheck },
      { label: "E-commerce stores", icon: ShoppingBag },
      { label: "Hotel management", icon: BedDouble },
      { label: "Invoicing & billing", icon: ReceiptText },
      { label: "Restaurant management", icon: UtensilsCrossed },
      { label: "Inventory & POS", icon: ScanBarcode },
      { label: "School & coaching", icon: GraduationCap },
      { label: "Clinic appointments", icon: Stethoscope },
      { label: "HR & payroll", icon: Wallet },
    ],
  },
];
