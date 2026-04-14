import React, { useState, useEffect } from "react";
import { motion, type Easing } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { PrivacyPolicy } from "@/components/legal/PrivacyPolicy";
import { TermsOfService } from "@/components/legal/TermsOfService";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  Star,
  ChevronRight,
  Play,
  ListTodo,
  Package,
  Wallet,
  Clock,
  Award,
  Layers,
  Menu,
  X,
  Brain,
  Check,
  AlertTriangle,
  RefreshCw,
  Shield,
} from "lucide-react";
import { SmartProfLogo, SmartProfLogoWide } from "@/components/Logo";

// Import preview images
import notesPreview from "@/assets/landing/notes-preview.png";
import narrativePreview from "@/assets/landing/AI-Grant-Narrative.png";
import analyticsPreview from "@/assets/landing/analytics-preview.png";
import fundingPreview from "@/assets/landing/funding-preview.png";

// Logo palette:  Navy #0D1E41  |  Teal #1B6B6B  |  Green #2C7A4B  |  Light green #3DAA6E
const easeOut: Easing = [0.16, 1, 0.3, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOut } }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: easeOut } }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: easeOut } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: easeOut } }
};

// ── Shared style tokens ──────────────────────────────────────────────────────
const C = {
  navy: "#0D1E41",
  teal: "#1B7A5A",
  tealLight: "#3DAA6E",
  bg: "#F0F7F4",
  bgAlt: "#E8F3EE",
  muted: "#4A6B5A",
  mutedLight: "rgba(168,223,200,0.85)",
  border: "rgba(27,122,90,0.15)",
  borderMed: "rgba(27,122,90,0.25)",
};

const gradientBtn = { background: "linear-gradient(135deg, #1B7A5A 0%, #0D5C3E 100%)", color: "#fff", border: "none" };
const gradientDark = "linear-gradient(135deg, #0D1E41 0%, #0A3028 55%, #1B7A5A 100%)";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(unit_amount: number | null, currency: string): string {
  if (unit_amount == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(unit_amount / 100);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-sm font-semibold border"
      style={{ background: "rgba(27,122,90,0.08)", borderColor: C.borderMed, color: C.teal }}>
      <Icon className="h-3.5 w-3.5" style={{ color: C.tealLight }} />
      {label}
    </span>
  );
}

function CheckItem({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.tealLight }} />
      <span className="text-sm leading-snug" style={{ color: dark ? C.mutedLight : C.muted }}>{children}</span>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface PriceData {
  id: string;
  unit_amount: number | null;
  currency: string;
  interval: string;
}

const LandingPreview = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prices, setPrices] = useState<{ monthly: PriceData; annual: PriceData } | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  // Fetch live prices from Stripe. Falls back to known amounts if Stripe isn't
  // configured in this environment - update FALLBACK_PRICES when you change
  // prices on Stripe (the live env will always override these automatically).
  const FALLBACK_PRICES = {
    monthly: { id: "", unit_amount: 7.99,  currency: "usd", interval: "month" },
    annual:  { id: "", unit_amount: 75, currency: "usd", interval: "year"  },
  } as const;

  useEffect(() => {
    supabase.functions.invoke("get-prices").then(({ data, error }) => {
      if (!error && data?.monthly?.unit_amount != null) setPrices(data);
    });
  }, []);

  const monthlyPrice = prices?.monthly ?? FALLBACK_PRICES.monthly;
  const annualPrice  = prices?.annual  ?? FALLBACK_PRICES.annual;
  // Derived display helpers
  const shownPrice = billingInterval === "annual" ? annualPrice : monthlyPrice;
  const savingsPerMonth =
    annualPrice?.unit_amount != null && monthlyPrice?.unit_amount != null
      ? monthlyPrice.unit_amount - Math.round(annualPrice.unit_amount / 12)
      : null;

  // ── Data ────────────────────────────────────────────────────────────────────

  const pillars = [
    {
      icon: ListTodo,
      headline: "Stay on top of everything",
      description:
        "One place for every task, note, meeting, and semester deadline - so nothing falls through the cracks.",
      bullets: [
        "Tasks & Notes with subtasks, folders, and smart deadlines",
        "Recurring-task automation for office hours, grading cycles, and reviews",
        "Meeting Hub: agendas, action items, and follow-ups",
        "Semester Planning with event and deadline tracking",
        "Google Calendar & Outlook sync (Pro)",
      ],
      image: notesPreview,
      badge: null,
    },
    {
      icon: Wallet,
      headline: "Win and manage grants without chaos",
      description:
        "Track every funding source, expenditure, and lab resource in one organized system - no more spreadsheet archaeology before a reporting deadline.",
      bullets: [
        "Grant Management: budgets, commitments, and multi-source funding",
        "Grant-linked meetings and notes for full context",
        "Supplies & Expenses: inventory, threshold alerts, shopping lists",
        "CSV import / export for existing data",
        "AI Supply Analysis and cost analytics (Pro)",
      ],
      image: fundingPreview,
      badge: null,
    },
    {
      icon: Award,
      headline: "Always promotion-ready",
      description:
        "Your achievements accumulate automatically so your promotion dossier is never a last-minute scramble.",
      bullets: [
        "11 achievement categories: publications, talks, awards, teaching, supervision, and more",
        "ORCID integration + live citation metrics (Pro)",
        "CV / biosketch import and export",
        "One-click NIH Biosketch generation via AI (Pro)",
        "Full data export anytime - your records are yours",
      ],
      image: analyticsPreview,
      badge: "New",
    },
    {
      icon: Brain,
      headline: "Let AI handle the first draft",
      description:
        "Eight purpose-built AI tools draft text, surface patterns, and plan your week - so you can focus on the thinking that actually requires you.",
      bullets: [
        "AI Task Draft and AI Smart Planner",
        "AI Meeting Agenda and AI Meeting Summarizer",
        "AI Grant Narrative Writer",
        "AI Analytics Insights and AI Supply Analysis",
        "NIH Biosketch Generator",
      ],
      image: narrativePreview,
      badge: "Pro",
    },
  ];

  const weekSteps = [
    {
      icon: Calendar,
      step: "1",
      title: "Plan your week",
      description:
        "Open Semester Planning, run the AI Smart Planner, and sync deadlines straight to your calendar. Your week is drafted before Monday morning.",
    },
    {
      icon: Users,
      step: "2",
      title: "Run your meetings",
      description:
        "AI generates the agenda, Smart-Prof captures action items, and the AI Summarizer sends a clean recap - all linked to the right grant or project.",
    },
    {
      icon: Wallet,
      step: "3",
      title: "Track grants and lab work",
      description:
        "Log expenses, check inventory alerts, and review your grant dashboard. Reporting numbers are always current, never reconstructed.",
    },
    {
      icon: Award,
      step: "4",
      title: "Capture achievements as you go",
      description:
        "Add a talk or publication in seconds. ORCID pulls citations automatically. Your promotion dossier builds itself in the background.",
    },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Associate Professor of Biology",
      content:
        "I finished my promotion dossier in a weekend instead of a month. Every publication, talk, and service entry was already there - I just exported.",
      rating: 5,
    },
    {
      name: "Prof. Michael Chen",
      role: "Associate Professor, Computer Science",
      content:
        "The AI Biosketch alone saved me three hours before my last NSF submission. I used to dread biosketches. Now it's a 10-minute job.",
      rating: 5,
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Psychology Department Chair",
      content:
        "Grant reporting used to eat a full day every cycle. Now I open the dashboard, everything's current, and I'm done before lunch.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: "Does Smart-Prof replace my LMS (Canvas, Blackboard, etc.)?",
      a: "No - it complements your LMS. Smart-Prof is built for your work outside the classroom: research, grants, lab management, service, and promotion tracking. Think of it as the cockpit for your faculty career, not a gradebook.",
    },
    {
      q: "Can I use Smart-Prof without institutional approval or IT involvement?",
      a: "Yes. You sign up with your email and start immediately - no IT ticket, no department buy-in required. Smart-Prof is a personal productivity tool that lives entirely in your own account.",
    },
    {
      q: "Is my data portable if I stop subscribing?",
      a: "Absolutely. Full data export is available at any time on every plan, in standard formats (CSV, JSON). Your records are yours - always.",
    },
    {
      q: "What's the difference between Free and Pro?",
      a: "Free gives you the full core system: tasks, notes, meetings, semester planning, grant management, supplies, achievements, and communications. Pro adds AI drafting tools (agendas, summaries, narratives, biosketches), ORCID + citation metrics, calendar sync with Google and Outlook, and advanced import/export.",
    },
    {
      q: "Is Smart-Prof secure?",
      a: "Yes. Data is encrypted in transit and at rest, hosted on enterprise-grade infrastructure, and never sold or shared with third parties. You can also delete your account and all associated data at any time.",
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: C.bg }}>

      {/* ══ Navigation ══════════════════════════════════════════════════════════ */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b"
        style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #0D3D2E 100%)`, borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <motion.div whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 300 }}>
            <SmartProfLogoWide height={80} />
          </motion.div>

          <div className="flex items-center gap-2 md:gap-7">
            {["How it works", "Pricing", "FAQ"].map((label, i) => (
              <a key={i} href={["#how-it-works", "#pricing", "#faq"][i]}
                className="hidden md:block text-sm font-medium transition-colors duration-200 hover:text-white"
                style={{ color: "rgba(168,223,200,0.8)" }}>
                {label}
              </a>
            ))}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden md:block">
              <Button asChild size="sm" className="font-semibold px-5"
                style={{ background: C.tealLight, color: C.navy, border: "none" }}>
                <Link to="/auth">Start free <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            </motion.div>
            <button type="button" className="md:hidden p-2 rounded-lg" style={{ color: "rgba(168,223,200,0.8)" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="md:hidden border-t px-6 py-4 flex flex-col gap-4"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: C.navy }}>
            {["How it works", "Pricing", "FAQ"].map((label, i) => (
              <a key={i} href={["#how-it-works", "#pricing", "#faq"][i]}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium" style={{ color: "rgba(168,223,200,0.85)" }}>
                {label}
              </a>
            ))}
            <Button asChild size="default" className="w-full mt-1 font-semibold"
              style={{ background: C.tealLight, color: C.navy, border: "none" }}
              onClick={() => setMobileMenuOpen(false)}>
              <Link to="/auth">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </motion.div>
        )}
      </motion.nav>

  {/* ══ 1. HERO — 3-col: AI card left · bare text center · bare logo right ══ */}
<section className="relative py-10 md:py-14 overflow-hidden">
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{ y: [0, -20, 0], opacity: [0.15, 0.28, 0.15] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-24 -right-24 w-[320px] h-[320px] md:w-[480px] md:h-[480px] rounded-full blur-[100px]"
      style={{ background: "radial-gradient(circle, rgba(27,122,90,0.32) 0%, transparent 70%)" }}
    />
    <motion.div
      animate={{ y: [0, 20, 0], opacity: [0.08, 0.18, 0.08] }}
      transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -bottom-20 -left-20 w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-full blur-[90px]"
      style={{ background: "radial-gradient(circle, rgba(13,30,65,0.2) 0%, transparent 70%)" }}
    />
  </div>

  <div className="container mx-auto px-6 relative z-10">
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-[3fr_4fr_3fr] gap-3 items-center"
    >

      {/* ── Col 1: AI feature showcase card (only tile in the row) ── */}
      <motion.div variants={fadeInLeft} className="flex">
        <div
          className="w-full rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: `linear-gradient(145deg, ${C.navy} 0%, #0A3028 100%)`,
            boxShadow: "0 20px 48px -10px rgba(13,30,65,0.3), 0 0 0 1px rgba(27,122,90,0.22)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(168,223,200,0.6)" }}>
              AI Tools
            </p>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: "rgba(61,170,110,0.18)",
                border: "1px solid rgba(61,170,110,0.32)",
                color: C.tealLight,
              }}
            >
              <Brain className="h-3 w-3" />
              8 included in Pro
            </span>
          </div>

          {/* AI tool rows */}
          <div className="p-3 space-y-2">
            {[
              { icon: Brain,    label: "AI Grant Narrative Writer",  preview: "Drafting Specific Aims for your NSF proposal...", color: "#3DAA6E" },
              { icon: Users,    label: "AI Meeting Summarizer",       preview: "Action items extracted from today's lab meeting.", color: "#60A5FA" },
              { icon: Award,    label: "NIH Biosketch Generator",     preview: "Generating Section A from your achievements...",  color: "#A78BFA" },
              { icon: Calendar, label: "AI Smart Planner",            preview: "Balancing 3 deadlines across your week.",          color: "#FB923C" },
            ].map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: easeOut }}
                className="rounded-xl px-3 py-2 flex items-start gap-2.5"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                <div
                  className="p-1.5 rounded-lg shrink-0 mt-0.5"
                  style={{ background: `${tool.color}22`, border: `1px solid ${tool.color}44` }}
                >
                  <tool.icon className="h-3.5 w-3.5" style={{ color: tool.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: "rgba(240,247,244,0.95)" }}>
                    {tool.label}
                  </p>
                  <p className="text-xs leading-snug" style={{ color: "rgba(168,223,200,0.55)" }}>
                    {tool.preview}
                  </p>
                </div>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.35 }}
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                  style={{ background: tool.color }}
                />
              </motion.div>
            ))}
            <div className="pt-0.5 text-center">
              <p className="text-xs" style={{ color: "rgba(168,223,200,0.4)" }}>+ 4 more AI tools in Pro</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Col 2: Hero text — no card, no background ── */}
      <motion.div variants={fadeInUp} className="flex">
        <div className="w-full flex flex-col items-center justify-center text-center px-6 py-8">

          {/* Audience pill */}
          <span
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-semibold border"
            style={{ background: "rgba(27,122,90,0.08)", borderColor: C.borderMed, color: C.teal }}
          >
            <Sparkles className="h-3 w-3" style={{ color: C.tealLight }} />
            Professors · Researchers · Lab Leads
          </span>

          {/* H1 */}
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-[1.1] tracking-tight">
            <span style={{ color: C.navy }}>The academic cockpit</span>
            <br />
            <span className="relative inline-block pb-2">
              <span
                style={{
                  backgroundImage: `linear-gradient(90deg, ${C.teal} 0%, ${C.tealLight} 50%, ${C.teal} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                for your entire career.
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.9, ease: easeOut }}
                className="absolute bottom-0 left-0 right-0 h-[3px] origin-left rounded-full"
                style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.tealLight}, ${C.teal})` }}
              />
            </span>
          </h1>

          {/* Subhead */}
          <p className="text-sm md:text-base mb-7 leading-relaxed" style={{ color: C.muted }}>
            Smart-Prof keeps your tasks, meetings, grants, lab inventory, and achievements in one
            organized system — so you can focus on research and teaching.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
              <Button asChild size="lg" className="w-full h-11 text-sm font-semibold shadow-lg" style={gradientBtn}>
                <Link to="/auth">
                  Start free for this semester <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ x: 2 }} transition={{ type: "spring", stiffness: 400 }}>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 w-full h-10 px-5 text-sm font-medium rounded-lg border transition-all duration-200"
                style={{ color: C.teal, borderColor: "rgba(27,122,90,0.3)", background: "rgba(27,122,90,0.05)" }}
              >
                <Play className="h-3.5 w-3.5" />
                See how it fits your week
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { icon: Clock,  label: "Save 4+ hrs/week" },
              { icon: Brain,  label: "8 AI Tools" },
              { icon: Shield, label: "Free to start" },
            ].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
                style={{ background: "rgba(27,122,90,0.06)", borderColor: "rgba(27,122,90,0.18)", color: C.navy }}
              >
                <item.icon className="h-3 w-3" style={{ color: C.teal }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Col 3: Logo only — no card, no background, vertically centered ── */}
      <motion.div variants={fadeInRight} className="flex items-center justify-center py-6">
        <SmartProfLogoWide height={300} />
      </motion.div>

    </motion.div>
  </div>
</section>

      {/* ══ 2. PROBLEM ══════════════════════════════════════════════════════════ */}
      <section className="py-8 md:py-12 relative overflow-hidden" style={{ backgroundColor: C.bgAlt }}>
        <div className="absolute inset-0 pointer-events-none opacity-50"
          style={{ backgroundImage: "radial-gradient(circle, rgba(27,122,90,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="container mx-auto px-6 relative z-10 max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeInUp} className="text-center mb-7">
            <span className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#b91c1c" }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Sound familiar?
            </span>
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: C.navy }}>
              Faculty admin is out of control.
            </h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={staggerContainer}
            className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: ListTodo,
                title: "Tools everywhere",
                body: "Email, sticky notes, spreadsheets, a task app, a calendar - none of them talk to each other.",
              },
              {
                icon: Clock,
                title: "Grant scrambles",
                body: "Pulling together expenditure reports and meeting notes at the last minute, every single reporting cycle.",
              },
              {
                icon: RefreshCw,
                title: "Duplicate data entry",
                body: "Re-entering the same publications, talks, and awards into your CV, annual report, biosketch, and department form - every year.",
              },
            ].map((item, i) => (
              <motion.div key={i} variants={scaleIn}
                className="rounded-2xl p-6 bg-white"
                style={{ border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(13,30,65,0.06)" }}>
                <div className="p-2.5 rounded-xl w-fit mb-4"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <item.icon className="h-5 w-5" style={{ color: "#dc2626" }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: C.navy }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{item.body}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center text-base font-semibold mt-7" style={{ color: C.navy }}>
            Smart-Prof replaces the chaos with one organized system - built specifically for faculty.
          </motion.p>
        </div>
      </section>

      {/* ══ 3. PILLARS ══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-10 md:py-16 relative" style={{ backgroundColor: C.bg }}>
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: "radial-gradient(circle, rgba(27,122,90,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeInUp} className="text-center mb-10">
            <SectionBadge icon={Layers} label="Smart-Prof is your academic cockpit" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: C.navy }}>
              Four outcomes. One platform.
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: C.muted }}>
              Instead of a long feature list, here's what Smart-Prof actually does for your career.
            </p>
          </motion.div>

          <div className="space-y-12 md:space-y-16">
            {pillars.map((pillar, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={staggerContainer}
                className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                {/* Text block */}
                <motion.div variants={i % 2 === 0 ? fadeInLeft : fadeInRight}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${C.teal} 0%, #0D5C3E 100%)`, boxShadow: "0 6px 20px rgba(27,122,90,0.3)" }}>
                      <pillar.icon className="h-6 w-6 text-white" />
                    </div>
                    {pillar.badge && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                        style={{
                          borderColor: pillar.badge === "Pro" ? "rgba(13,30,65,0.2)" : "rgba(61,170,110,0.3)",
                          background: pillar.badge === "Pro" ? "rgba(13,30,65,0.07)" : "rgba(61,170,110,0.1)",
                          color: pillar.badge === "Pro" ? C.navy : "#2C7A4B"
                        }}>
                        {pillar.badge === "Pro" && <Brain className="h-3 w-3 mr-1 inline" />}
                        {pillar.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: C.navy }}>{pillar.headline}</h3>
                  <p className="text-base leading-relaxed mb-6" style={{ color: C.muted }}>{pillar.description}</p>
                  <ul className="space-y-2.5">
                    {pillar.bullets.map((b, bi) => <CheckItem key={bi}>{b}</CheckItem>)}
                  </ul>
                </motion.div>

                {/* Image block */}
                <motion.div variants={i % 2 === 0 ? fadeInRight : fadeInLeft}
                  className="rounded-2xl overflow-hidden group"
                  style={{ border: `1px solid ${C.border}`, boxShadow: "0 8px 32px rgba(13,30,65,0.1)" }}>
                  <img src={pillar.image} alt={pillar.headline}
                    className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                    loading="lazy" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 4. HOW IT FITS INTO YOUR WEEK ════════════════════════════════════ */}
      <section id="how-it-works" className="py-10 md:py-16 relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${C.bgAlt} 0%, ${C.bg} 100%)` }}>
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeInUp} className="text-center mb-6">
            <SectionBadge icon={Clock} label="A typical week with Smart-Prof" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: C.navy }}>
              How it fits into your week
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: C.muted }}>
              Four moments where Smart-Prof replaces friction with flow.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {weekSteps.map((step, i) => (
              <motion.div key={i} variants={fadeInUp} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="h-full relative overflow-hidden transition-all duration-500 group"
                  style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(13,30,65,0.06)" }}>
                  <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-lg"
                    style={{ background: `linear-gradient(90deg, transparent, ${C.teal}, ${C.tealLight}, transparent)` }} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-black" style={{ color: C.tealLight }}>0{step.step}</span>
                      <div className="p-2 rounded-lg" style={{ background: "rgba(27,122,90,0.1)" }}>
                        <step.icon className="h-5 w-5" style={{ color: C.teal }} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-[#1B7A5A] transition-colors duration-300" style={{ color: C.navy }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ 5. PRICING ══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-10 md:py-16 relative" style={{ backgroundColor: C.bg }}>
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: "radial-gradient(circle, rgba(27,122,90,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeInUp} className="text-center mb-6">
            <SectionBadge icon={Zap} label="Simple, honest pricing" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: C.navy }}>
              Start free. Upgrade when you're ready.
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: C.muted }}>
              No credit card required to start. Both plans give you permanent access — not a trial.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center mt-8 rounded-full p-1 gap-1"
              style={{ background: "rgba(27,122,90,0.08)", border: `1px solid ${C.border}` }}>
              {(["annual", "monthly"] as const).map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setBillingInterval(interval)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={
                    billingInterval === interval
                      ? { ...gradientBtn, boxShadow: "0 2px 8px rgba(27,122,90,0.3)" }
                      : { background: "transparent", color: C.muted, border: "none" }
                  }
                >
                  {interval === "annual" ? "Annual - save ~20%" : "Monthly"}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Free card */}
            <motion.div variants={fadeInLeft} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <Card className="h-full relative overflow-hidden"
                style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(13,30,65,0.07)" }}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-1" style={{ color: C.navy }}>Free</h3>
                    <p className="text-sm font-medium mb-4" style={{ color: C.muted }}>
                      Perfect for individual faculty getting out of chaos.
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black" style={{ color: C.navy }}>$0</span>
                      <span className="text-sm" style={{ color: C.muted }}>forever</span>
                    </div>
                  </div>

                  <div className="space-y-5 mb-8">
                    {[
                      { label: "Planning & Tasks", items: ["Tasks & Notes with subtasks and folders", "Semester Planning with event tracking", "Smart deadlines and recurring tasks"] },
                      { label: "Meetings", items: ["Meeting Hub: agendas and action items", "Recurring meeting support"] },
                      { label: "Grants & Lab", items: ["Grant Management: budgets and commitments", "Supplies & Expenses with threshold alerts", "Shopping lists and CSV export"] },
                      { label: "Achievements & CV", items: ["11 achievement categories", "CV / biosketch import and export", "Communications and announcements"] },
                    ].map((group, gi) => (
                      <div key={gi}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.teal }}>{group.label}</p>
                        <ul className="space-y-1.5">
                          {group.items.map((item, ii) => <CheckItem key={ii}>{item}</CheckItem>)}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <Button asChild size="lg" variant="outline" className="w-full font-semibold h-12 transition-all duration-300"
                    style={{ borderColor: C.borderMed, color: C.teal }}>
                    <Link to="/auth">Start free</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro card */}
            <motion.div variants={fadeInRight} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              {/* Most popular badge - outside Card so overflow-hidden doesn't clip it */}
              <div className="flex justify-end pr-6 mb-[-14px] relative z-10">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.tealLight})`, color: "#fff", boxShadow: "0 4px 12px rgba(27,122,90,0.4)" }}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Most popular
                </span>
              </div>

              <Card className="h-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${C.navy} 0%, #0A3028 60%, #1B4A3A 100%)`,
                  border: `2px solid ${C.teal}`,
                  boxShadow: `0 8px 40px rgba(27,122,90,0.35)`
                }}>
                <CardContent className="p-8 pt-10">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-1" style={{ color: "#F0F7F4" }}>Pro</h3>
                    <p className="text-sm font-medium mb-4" style={{ color: C.mutedLight }}>
                      For faculty and lab leads who want AI to draft and organize for them.
                    </p>

                    {/* Live price from Stripe - matches SettingsPage display logic */}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black" style={{ color: "#F0F7F4" }}>
                          {formatPrice(shownPrice.unit_amount, shownPrice.currency)}
                        </span>
                        <span className="text-base font-medium" style={{ color: C.mutedLight }}>
                          {billingInterval === "annual" ? "/ year" : "/ month"}
                        </span>
                      </div>
                      {billingInterval === "annual" && savingsPerMonth != null && savingsPerMonth > 0 && (
                        <p className="text-xs mt-1.5 font-medium" style={{ color: C.tealLight }}>
                          {formatPrice(Math.round(shownPrice.unit_amount / 12), shownPrice.currency)}/mo equivalent
                          {" · "}saves {formatPrice(savingsPerMonth, shownPrice.currency)}/mo vs monthly
                        </p>
                      )}
                      {billingInterval === "monthly" && (
                        <p className="text-xs mt-1.5 font-medium" style={{ color: C.mutedLight }}>
                          Switch to annual to save ~20%
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5 mb-8">
                    {[
                      { label: "Everything in Free, plus:", items: [] },
                      { label: "AI & Automation", items: ["AI Task Draft and AI Smart Planner", "AI Meeting Agenda and AI Summarizer", "AI Grant Narrative Writer", "AI Supply Analysis and AI Analytics Insights", "NIH Biosketch Generator"] },
                      { label: "Integrations", items: ["Google Calendar sync", "Outlook Calendar sync", "ORCID integration + live citation metrics"] },
                      { label: "Advanced Export", items: ["Advanced CV / biosketch import and export", "Full data export in standard formats"] },
                    ].map((group, gi) => (
                      <div key={gi}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.tealLight }}>{group.label}</p>
                        {group.items.length > 0 && (
                          <ul className="space-y-1.5">
                            {group.items.map((item, ii) => (
                              <CheckItem key={ii} dark>{item}</CheckItem>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button asChild size="lg" className="w-full font-semibold h-12 shadow-lg transition-all duration-300"
                    style={{ background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealLight} 100%)`, color: "#fff", border: "none" }}>
                    <Link to="/auth?plan=pro">Start Pro trial</Link>
                  </Button>
                  <p className="text-xs text-center mt-3" style={{ color: C.mutedLight }}>No credit card required to try</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Data portability note */}
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center text-sm mt-10 font-medium"
            style={{ color: C.muted }}>
            <Shield className="h-4 w-4 inline mr-1.5 mb-0.5" style={{ color: C.tealLight }} />
            Your data is yours - full export anytime on every plan. No lock-in.
          </motion.p>
        </div>
      </section>

      {/* ══ 6. TESTIMONIALS ══════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-10 md:py-16 relative" style={{ backgroundColor: C.bgAlt }}>
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeInUp} className="text-center mb-6">
            <SectionBadge icon={Award} label="Trusted by academics" />
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: C.navy }}>
              Faculty who got their time back
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: C.muted }}>
              Real results from professors and researchers who switched to Smart-Prof.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={staggerContainer}
            className="grid md:grid-cols-3 gap-5">
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} variants={fadeInUp} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="group h-full relative overflow-hidden transition-all duration-500"
                  style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(13,30,65,0.07)" }}>
                  <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(180deg, ${C.teal}, ${C.tealLight})` }} />
                  <CardContent className="relative p-5">
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, ri) => (
                        <Star key={ri} className="h-5 w-5 fill-current" style={{ color: C.tealLight }} />
                      ))}
                    </div>
                    <p className="mb-5 leading-relaxed text-sm italic" style={{ color: "#3A5C4A" }}>
                      "{testimonial.content}"
                    </p>
                    <div className="pt-3 border-t" style={{ borderColor: "rgba(27,122,90,0.12)" }}>
                      <p className="font-semibold text-sm" style={{ color: C.navy }}>{testimonial.name}</p>
                      <p className="text-xs font-medium" style={{ color: C.teal }}>{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ 7. FAQ ══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-10 md:py-16 relative" style={{ backgroundColor: C.bg }}>
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeInUp} className="text-center mb-7">
            <SectionBadge icon={Brain} label="Common questions" />
            <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: C.navy }}>
              FAQ
            </h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeInUp}>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl overflow-hidden border-0"
                  style={{ border: `1px solid ${C.border}`, background: "#fff", boxShadow: "0 2px 8px rgba(13,30,65,0.04)" }}
                >
                  <AccordionTrigger
                    className="px-6 py-5 text-left font-semibold hover:no-underline hover:bg-[rgba(27,122,90,0.03)] transition-colors duration-200 [&[data-state=open]]:bg-[rgba(27,122,90,0.04)]"
                    style={{ color: C.navy }}
                  >
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent
                    className="px-6 pb-5 text-sm leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════════════════ */}
      <section className="py-10 md:py-16 relative overflow-hidden" style={{ background: gradientDark }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(61,170,110,0.1), transparent 60%)" }} />
        <motion.div animate={{ y: [-20, 20, -20], x: [-15, 15, -15] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[15%] w-3 h-3 rounded-full pointer-events-none"
          style={{ background: "rgba(168,223,200,0.3)" }} />
        <motion.div animate={{ y: [20, -20, 20], x: [10, -10, 10] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-24 right-[20%] w-5 h-5 rounded-full pointer-events-none"
          style={{ background: "rgba(168,223,200,0.2)" }} />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeInUp}
            className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: C.mutedLight }}>
              <Zap className="h-3.5 w-3.5" />
              Your cockpit is ready
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4" style={{ color: "#F0F7F4" }}>
              Less admin. More impact.
            </h2>

            <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color: C.mutedLight }}>
              Join faculty who replaced five scattered tools with one organized system. Start free this semester - no credit card, no IT ticket.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                  style={{ background: "#F0F7F4", color: C.navy, border: "none" }}>
                  <Link to="/auth">
                    Start free for this semester
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button size="lg" variant="outline" onClick={() => setShowContact(true)}
                  className="h-14 px-10 text-lg font-semibold transition-all duration-300"
                  style={{ borderColor: "rgba(168,223,200,0.4)", color: C.mutedLight, background: "transparent" }}>
                  Talk to us
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ Footer ══════════════════════════════════════════════════════════════ */}
      <footer className="py-7 border-t" style={{ background: C.bgAlt, borderColor: C.border }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <SmartProfLogoWide height={76} />
            <p className="text-sm" style={{ color: C.muted }}>
              &copy; {new Date().getFullYear()} Smart-Prof. Built for academia.
            </p>
            <div className="flex gap-6">
              <button type="button" onClick={() => setShowPrivacy(true)}
                className="text-sm font-medium transition-colors duration-300 hover:underline" style={{ color: C.muted }}>Privacy</button>
              <button type="button" onClick={() => setShowTerms(true)}
                className="text-sm font-medium transition-colors duration-300 hover:underline" style={{ color: C.muted }}>Terms</button>
              <button type="button" onClick={() => setShowContact(true)}
                className="text-sm font-medium transition-colors duration-300 hover:underline" style={{ color: C.muted }}>Contact</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ══ Dialogs ═════════════════════════════════════════════════════════════ */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
            <DialogDescription>How we collect, use, and protect your information.</DialogDescription>
          </DialogHeader>
          <PrivacyPolicy />
          <div className="flex justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setShowPrivacy(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
            <DialogDescription>Please review our terms before using Smart-Prof.</DialogDescription>
          </DialogHeader>
          <TermsOfService />
          <div className="flex justify-end mt-4">
            <Button type="button" variant="outline" onClick={() => setShowTerms(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact &amp; Support</DialogTitle>
            <DialogDescription>We would love to hear from you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm leading-6" style={{ color: C.muted }}>
            <p>
              For support, bug reports, or general feedback, please use the{" "}
              <span className="font-medium" style={{ color: C.navy }}>in-app Feedback Portal</span> after signing in.
            </p>
            <p>
              You can find it in the main navigation menu once you are logged into your Smart-Prof account.
              Our team reviews every submission and will respond as soon as possible.
            </p>
          </div>
          <div className="flex justify-end mt-2">
            <Button type="button" variant="outline" onClick={() => setShowContact(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPreview;
