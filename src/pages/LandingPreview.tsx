import React, { useState } from "react";
import { motion, type Easing } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { PrivacyPolicy } from "@/components/legal/PrivacyPolicy";
import { TermsOfService } from "@/components/legal/TermsOfService";
import {
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  Star,
  ChevronRight,
  CheckCircle2,
  Play,
  ListTodo,
  Package,
  Wallet,
  LineChart,
  Clock,
  BarChart,
  Award,
  Target,
  Layers,
  FolderOpen,
  Menu,
  X,
  MessageSquare,
  Brain,
  Check,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { SmartProfLogo, SmartProfLogoWide } from "@/components/Logo";

// Import preview images
import notesPreview from "@/assets/landing/notes-preview.png";
import meetingsPreview from "@/assets/landing/meetings-preview.png";
import planningPreview from "@/assets/landing/planning-preview.png";
import suppliesPreview from "@/assets/landing/supplies-preview.png";
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

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.tealLight }} />
      <span className="text-sm leading-snug" style={{ color: C.muted }}>{children}</span>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const LandingPreview = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────────

  const pillars = [
    {
      icon: ListTodo,
      headline: "Stay on top of everything",
      description:
        "One place for every task, note, meeting, and semester deadline — so nothing falls through the cracks.",
      bullets: [
        "Tasks & Notes with subtasks, folders, and smart deadlines",
        "Recurring-task automation for office hours, grading cycles, and reviews",
        "Meeting Hub: agendas, action items, and follow-ups",
        "Semester Planning with event and deadline tracking",
        "Google Calendar & Outlook sync (Pro)",
      ],
      image: planningPreview,
      badge: null,
    },
    {
      icon: Wallet,
      headline: "Win and manage grants without chaos",
      description:
        "Track every funding source, expenditure, and lab resource in one organized system — no more spreadsheet archaeology before a reporting deadline.",
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
        "Full data export anytime — your records are yours",
      ],
      image: analyticsPreview,
      badge: "New",
    },
    {
      icon: Brain,
      headline: "Let AI handle the first draft",
      description:
        "Eight purpose-built AI tools draft text, surface patterns, and plan your week — so you can focus on the thinking that actually requires you.",
      bullets: [
        "AI Task Draft and AI Smart Planner",
        "AI Meeting Agenda and AI Meeting Summarizer",
        "AI Grant Narrative Writer",
        "AI Analytics Insights and AI Supply Analysis",
        "NIH Biosketch Generator",
      ],
      image: notesPreview,
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
        "AI generates the agenda, Smart-Prof captures action items, and the AI Summarizer sends a clean recap — all linked to the right grant or project.",
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
      institution: "State Research University",
      content:
        "Smart-Prof cut my grant-reporting prep from a full day to under an hour. The budget tracker and meeting notes are always in sync.",
      rating: 5,
    },
    {
      name: "Prof. Michael Chen",
      role: "Associate Professor, Computer Science",
      institution: "Midwest Technical Institute",
      content:
        "The AI Biosketch alone saved me three hours before my last NSF submission. Having ORCID pull my citations automatically is a game-changer.",
      rating: 5,
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Psychology Department Chair",
      institution: "Liberal Arts College",
      content:
        "I stopped using six different tools. Smart-Prof replaced my task app, my grant spreadsheet, and my lab inventory tracker in one go.",
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: "Does Smart-Prof replace my LMS (Canvas, Blackboard, etc.)?",
      a: "No — it complements your LMS. Smart-Prof is built for your work outside the classroom: research, grants, lab management, service, and promotion tracking. Think of it as the cockpit for your faculty career, not a gradebook.",
    },
    {
      q: "Can I use Smart-Prof without institutional approval or IT involvement?",
      a: "Yes. You sign up with your email and start immediately — no IT ticket, no department buy-in required. Smart-Prof is a personal productivity tool that lives entirely in your own account.",
    },
    {
      q: "Is my data portable if I stop subscribing?",
      a: "Absolutely. Full data export is available at any time on every plan, in standard formats (CSV, JSON). Your records are yours — always.",
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
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: "rgba(240,247,244,0.88)", borderColor: C.border }}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <SmartProfLogoWide height={100} />
          </motion.div>

          <div className="flex items-center gap-2 md:gap-8">
            <a href="#how-it-works" className="hidden md:block text-sm font-medium transition-colors duration-300" style={{ color: C.muted }}>How it works</a>
            <a href="#pricing" className="hidden md:block text-sm font-medium transition-colors duration-300" style={{ color: C.muted }}>Pricing</a>
            <a href="#faq" className="hidden md:block text-sm font-medium transition-colors duration-300" style={{ color: C.muted }}>FAQ</a>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden md:block">
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 font-semibold" style={gradientBtn}>
                <Link to="/auth">
                  Start free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <button
              type="button"
              className="md:hidden p-2 rounded-lg transition-colors duration-200"
              style={{ color: C.muted }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t px-6 py-4 flex flex-col gap-4 backdrop-blur-xl"
            style={{ borderColor: C.border, backgroundColor: "rgba(240,247,244,0.97)" }}
          >
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium" style={{ color: C.muted }}>How it works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium" style={{ color: C.muted }}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium" style={{ color: C.muted }}>FAQ</a>
            <Button asChild size="default" className="w-full mt-1 font-semibold" style={gradientBtn} onClick={() => setMobileMenuOpen(false)}>
              <Link to="/auth">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </motion.div>
        )}
      </motion.nav>

      {/* ══ 1. HERO ═════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ y: [0, -30, 0], opacity: [0.18, 0.32, 0.18] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 w-[200px] h-[200px] sm:w-[380px] sm:h-[380px] md:w-[540px] md:h-[540px] rounded-full blur-[110px]"
            style={{ background: "radial-gradient(circle, rgba(27,122,90,0.35) 0%, transparent 70%)" }} />
          <motion.div animate={{ y: [0, 30, 0], opacity: [0.12, 0.22, 0.12] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -left-32 w-[160px] h-[160px] sm:w-[300px] sm:h-[300px] md:w-[440px] md:h-[440px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, rgba(13,30,65,0.22) 0%, transparent 70%)" }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="text-center max-w-4xl mx-auto">

            {/* Logo */}
            <motion.div variants={fadeInUp} className="flex justify-center mb-10">
              <motion.div whileHover={{ scale: 1.06, rotate: 1 }} transition={{ type: "spring", stiffness: 280 }}
                className="rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 20px 60px -10px rgba(13,30,65,0.22), 0 0 0 4px rgba(27,122,90,0.18)" }}>
                <SmartProfLogo size={400} className="rounded-3xl" />
              </motion.div>
            </motion.div>

            {/* Audience pill */}
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full text-sm font-semibold border"
                style={{ background: "rgba(27,122,90,0.08)", borderColor: C.borderMed, color: C.teal }}>
                <Sparkles className="h-4 w-4" style={{ color: C.tealLight }} />
                Built for Professors · Researchers · Lab Leads
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1 variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              <span style={{ color: C.navy }}>The academic cockpit</span>
              <br />
              <span className="relative inline-block pb-3">
                <span style={{
                  backgroundImage: `linear-gradient(90deg, ${C.teal} 0%, ${C.tealLight} 50%, ${C.teal} 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                }}>
                  for your entire career.
                </span>
                <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.9, ease: easeOut }}
                  className="absolute bottom-0 left-[5%] right-[5%] h-[3px] origin-left rounded-full"
                  style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.tealLight}, ${C.teal})` }} />
              </span>
            </motion.h1>

            {/* Subhead */}
            <motion.p variants={fadeInUp}
              className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: C.muted }}>
              Smart-Prof keeps your tasks, meetings, grants, lab inventory, and achievements in one
              organized system — so you can spend more time on research and teaching.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-shadow duration-300" style={gradientBtn}>
                  <Link to="/auth">
                    Start free for this semester
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                <a href="#how-it-works"
                  className="inline-flex items-center gap-2 h-14 px-6 text-base font-medium rounded-lg border transition-all duration-200"
                  style={{ color: C.teal, borderColor: "rgba(27,122,90,0.3)", background: "rgba(27,122,90,0.06)" }}>
                  <Play className="h-4 w-4" />
                  See how it works
                  <ChevronRight className="h-4 w-4" />
                </a>
              </motion.div>
            </motion.div>

            {/* Capability chips */}
            <motion.div variants={staggerContainer} className="flex flex-wrap justify-center gap-3">
              {[
                { icon: ListTodo, label: "Tasks & Notes" },
                { icon: Users, label: "Meeting Hub" },
                { icon: Calendar, label: "Semester Planning" },
                { icon: Wallet, label: "Grant Management" },
                { icon: Package, label: "Lab Supplies" },
                { icon: Award, label: "Achievements & CV" },
                { icon: Brain, label: "8 AI Tools" },
                { icon: LineChart, label: "Analytics" },
              ].map((item, i) => (
                <motion.div key={i} variants={scaleIn} whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full cursor-default border"
                  style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(27,122,90,0.2)", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(13,30,65,0.06)" }}>
                  <item.icon className="h-4 w-4" style={{ color: C.teal }} />
                  <span className="text-sm font-medium" style={{ color: C.navy }}>{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ 2. PROBLEM ══════════════════════════════════════════════════════════ */}
      <section className="py-14 md:py-20 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #0D3D2E 60%, ${C.teal} 100%)` }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top, rgba(61,170,110,0.12), transparent 60%)" }} />

        <div className="container mx-auto px-6 relative z-10 max-w-3xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: C.mutedLight }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Sound familiar?
            </span>

            <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: "#F0F7F4" }}>
              Faculty admin is out of control.
            </h2>

            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                {
                  icon: FolderOpen,
                  title: "Tools everywhere",
                  body: "Email, sticky notes, spreadsheets, a task app, a calendar — none of them talk to each other."
                },
                {
                  icon: Clock,
                  title: "Grant scrambles",
                  body: "Pulling together expenditure reports and meeting notes at the last minute, every single reporting cycle."
                },
                {
                  icon: RefreshCw,
                  title: "Duplicate data entry",
                  body: "Re-entering the same publications, talks, and awards into your CV, annual report, biosketch, and department form — every year."
                },
              ].map((item, i) => (
                <motion.div key={i} variants={scaleIn}
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <item.icon className="h-6 w-6 mb-3" style={{ color: C.tealLight }} />
                  <h3 className="font-semibold mb-2" style={{ color: "#F0F7F4" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.mutedLight }}>{item.body}</p>
                </motion.div>
              ))}
            </div>

            <p className="mt-10 text-lg font-medium" style={{ color: "#F0F7F4" }}>
              Smart-Prof replaces the chaos with one organized system — built specifically for faculty.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ 3. PILLARS — "Your Academic Cockpit" ════════════════════════════════ */}
      <section id="features" className="py-16 md:py-32 relative" style={{ backgroundColor: C.bg }}>
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: "radial-gradient(circle, rgba(27,122,90,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeInUp} className="text-center mb-14 md:mb-20">
            <SectionBadge icon={Layers} label="Smart-Prof is your academic cockpit" />
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: C.navy }}>
              Four outcomes. One platform.
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: C.muted }}>
              Instead of a long feature list, here's what Smart-Prof actually does for your career.
            </p>
          </motion.div>

          <div className="space-y-20 md:space-y-28">
            {pillars.map((pillar, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={staggerContainer}
                className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
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
      <section id="how-it-works" className="py-16 md:py-28 relative overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${C.bgAlt} 0%, ${C.bg} 100%)` }}>
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeInUp} className="text-center mb-14">
            <SectionBadge icon={Clock} label="A typical week with Smart-Prof" />
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: C.navy }}>
              How it fits into your week
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: C.muted }}>
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
      <section id="pricing" className="py-16 md:py-32 relative" style={{ backgroundColor: C.bg }}>
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: "radial-gradient(circle, rgba(27,122,90,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeInUp} className="text-center mb-14">
            <SectionBadge icon={Zap} label="Simple, honest pricing" />
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: C.navy }}>
              Start free. Upgrade when you're ready.
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: C.muted }}>
              No credit card required to start. Both plans give you permanent access — not a trial.
            </p>
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
              <Card className="h-full relative overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${C.navy} 0%, #0A3028 60%, #1B4A3A 100%)`,
                  border: `2px solid ${C.teal}`,
                  boxShadow: `0 8px 40px rgba(27,122,90,0.35)`
                }}>
                {/* Recommended badge */}
                <div className="absolute top-0 right-6 -translate-y-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.tealLight})`, color: "#fff" }}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Most popular
                  </span>
                </div>

                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-1" style={{ color: "#F0F7F4" }}>Pro</h3>
                    <p className="text-sm font-medium mb-4" style={{ color: C.mutedLight }}>
                      For faculty and lab leads who want AI to draft and organize for them.
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black" style={{ color: "#F0F7F4" }}>See pricing</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: C.mutedLight }}>Monthly and annual plans available</p>
                  </div>

                  <div className="space-y-5 mb-8">
                    {[
                      { label: "Everything in Free, plus:", items: [] },
                      { label: "AI & Automation", items: ["AI Task Draft and AI Smart Planner", "AI Meeting Agenda and AI Summarizer", "AI Grant Narrative Writer", "AI Supply Analysis and AI Analytics Insights", "NIH Biosketch Generator"] },
                      { label: "Integrations", items: ["Google Calendar sync", "Outlook Calendar sync", "ORCID integration + live citation metrics"] },
                      { label: "Achievements & Export", items: ["Advanced CV / biosketch import and export", "Full data export in standard formats"] },
                    ].map((group, gi) => (
                      <div key={gi}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.tealLight }}>{group.label}</p>
                        {group.items.length > 0 && (
                          <ul className="space-y-1.5">
                            {group.items.map((item, ii) => (
                              <li key={ii} className="flex items-start gap-2.5">
                                <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.tealLight }} />
                                <span className="text-sm leading-snug" style={{ color: C.mutedLight }}>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button asChild size="lg" className="w-full font-semibold h-12 shadow-lg transition-all duration-300"
                    style={{ background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealLight} 100%)`, color: "#fff", border: "none" }}>
                    <Link to="/auth">Start Pro trial</Link>
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
            Your data is yours — full export anytime on every plan. No lock-in.
          </motion.p>
        </div>
      </section>

      {/* ══ 6. SOCIAL PROOF & TRUST ══════════════════════════════════════════ */}
      <section id="testimonials" className="py-16 md:py-32 relative" style={{ backgroundColor: C.bgAlt }}>
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeInUp} className="text-center mb-14">
            <SectionBadge icon={Award} label="Trusted by academics" />
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: C.navy }}>
              Faculty who got their time back
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: C.muted }}>
              Real results from professors and researchers who switched to Smart-Prof.
            </p>
          </motion.div>

          {/* University logos placeholder */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="flex flex-wrap justify-center gap-6 mb-14 opacity-50">
            {["State Research University", "Midwest Technical Institute", "Liberal Arts College", "National Science Lab"].map((uni, i) => (
              <div key={i} className="px-5 py-2.5 rounded-lg border text-sm font-semibold"
                style={{ borderColor: C.border, color: C.muted, background: "rgba(255,255,255,0.6)" }}>
                {uni}
              </div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} variants={fadeInUp} whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Card className="group h-full relative overflow-hidden transition-all duration-500"
                  style={{ background: "#fff", border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(13,30,65,0.07)" }}>
                  <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(180deg, ${C.teal}, ${C.tealLight})` }} />
                  <CardContent className="relative p-8">
                    <div className="flex gap-1 mb-5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" style={{ color: C.tealLight }} />
                      ))}
                    </div>
                    <p className="mb-8 leading-relaxed text-base italic" style={{ color: "#3A5C4A" }}>
                      "{testimonial.content}"
                    </p>
                    <div className="pt-4 border-t" style={{ borderColor: "rgba(27,122,90,0.12)" }}>
                      <p className="font-semibold" style={{ color: C.navy }}>{testimonial.name}</p>
                      <p className="text-sm font-medium" style={{ color: C.teal }}>{testimonial.role}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{testimonial.institution}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ 7. FAQ ═══════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 md:py-28 relative" style={{ backgroundColor: C.bg }}>
        <div className="container mx-auto px-6 max-w-2xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeInUp} className="text-center mb-12">
            <SectionBadge icon={MessageSquare} label="Common questions" />
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: C.navy }}>
              FAQ
            </h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={staggerContainer} className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left rounded-xl px-6 py-5 flex items-start justify-between gap-4 transition-colors duration-200 group"
                  style={{
                    background: openFaq === i ? "#fff" : "rgba(255,255,255,0.6)",
                    border: `1px solid ${openFaq === i ? C.borderMed : C.border}`,
                    boxShadow: openFaq === i ? "0 4px 16px rgba(13,30,65,0.08)" : "none"
                  }}
                >
                  <span className="font-semibold text-sm md:text-base" style={{ color: C.navy }}>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 mt-0.5 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    style={{ color: C.teal }} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    className="px-6 py-4 text-sm leading-relaxed rounded-b-xl -mt-1"
                    style={{ background: "#fff", borderLeft: `1px solid ${C.borderMed}`, borderRight: `1px solid ${C.borderMed}`, borderBottom: `1px solid ${C.borderMed}`, color: C.muted }}>
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-32 relative overflow-hidden" style={{ background: gradientDark }}>
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
            <span className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: C.mutedLight }}>
              <Zap className="h-3.5 w-3.5" />
              Your cockpit is ready
            </span>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: "#F0F7F4" }}>
              Less admin. More impact.
            </h2>

            <p className="text-xl mb-12 max-w-xl mx-auto" style={{ color: C.mutedLight }}>
              Join faculty who replaced five scattered tools with one organized system. Start free this semester — no credit card, no IT ticket.
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
      <footer className="py-12 border-t" style={{ background: C.bgAlt, borderColor: C.border }}>
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
