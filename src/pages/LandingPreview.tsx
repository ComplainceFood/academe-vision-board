import React, { useState } from "react";
import { motion, type Easing } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
  Brain
} from "lucide-react";
import { SmartProfLogo } from "@/components/Logo";

// Import preview images
import notesPreview from "@/assets/landing/notes-preview.png";
import meetingsPreview from "@/assets/landing/meetings-preview.png";
import planningPreview from "@/assets/landing/planning-preview.png";
import suppliesPreview from "@/assets/landing/supplies-preview.png";
import analyticsPreview from "@/assets/landing/analytics-preview.png";
import fundingPreview from "@/assets/landing/funding-preview.png";

// Logo palette extracted colors (used as inline style accents where Tailwind can't reach)
// Navy: #0D1E41  |  Teal: #1B6B6B  |  Green: #2C7A4B  |  Light green: #3DAA6E
// These map closely to: primary (teal), secondary (green), and a deep navy for dark sections

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

const LandingPreview = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: ListTodo,
      title: "Notes & Commitments",
      description: "Manage tasks with subtasks, recurring automation, smart deadlines, and color-coded folder organization.",
      highlights: ["Subtask Progress", "Recurring Tasks", "Folder Organization"],
      badge: "Popular",
      color: "primary"
    },
    {
      icon: Users,
      title: "Meeting Hub",
      description: "Schedule meetings, track action items, generate summaries, and sync with your calendar seamlessly.",
      highlights: ["Calendar Sync", "Action Items", "Recurring Meetings"],
      badge: null,
      color: "secondary"
    },
    {
      icon: Calendar,
      title: "Semester Planning",
      description: "Plan your academic calendar with event scheduling, deadline tracking, and Outlook/Google Calendar integrations.",
      highlights: ["Event Scheduling", "Outlook Sync", "Google Calendar"],
      badge: null,
      color: "primary"
    },
    {
      icon: Wallet,
      title: "Grant Management",
      description: "Monitor research grants, track expenditures, manage commitments, and generate detailed financial reports.",
      highlights: ["Budget Tracking", "Expenditure Reports", "Multi-source"],
      badge: null,
      color: "secondary"
    },
    {
      icon: Package,
      title: "Supplies & Expenses",
      description: "Threshold alerts, shopping lists, CSV import/export, expense tracking, and cost analytics for lab supplies.",
      highlights: ["Stock Alerts", "Shopping Lists", "CSV Export"],
      badge: null,
      color: "primary"
    },
    {
      icon: Award,
      title: "Scholastic Achievements",
      description: "Track publications, awards, teaching performance, research presentations, and student supervision in one place.",
      highlights: ["Publications", "Awards & Honors", "ORCID Integration"],
      badge: "New",
      color: "secondary"
    },
    {
      icon: MessageSquare,
      title: "Communications",
      description: "Send announcements to your team, submit feedback, and manage inter-department communications with ease.",
      highlights: ["Announcements", "Team Feedback", "Admin Broadcasts"],
      badge: null,
      color: "primary"
    },
    {
      icon: Brain,
      title: "AI-Powered Analytics",
      description: "Get AI-generated biosketches, productivity insights, workload analysis, and smart recommendations tailored to your academic role.",
      highlights: ["AI Biosketch", "Productivity Insights", "Workload Analysis"],
      badge: "AI",
      color: "secondary"
    },
  ];

  const stats = [
    { icon: Layers, value: "8", label: "Modules" },
    { icon: TrendingUp, value: "4hrs+", label: "Saved Weekly" },
    { icon: Shield, value: "100%", label: "Secure" },
    { icon: Zap, value: "AI", label: "Powered" },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Professor of Biology",
      content: "The smart deadline indicators have transformed how I manage my research commitments. I never miss a deadline now.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Prof. Michael Chen",
      role: "Associate Professor, Computer Science",
      content: "The folder organization system is phenomenal. I can easily categorize all my notes and student commitments.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Psychology Department Chair",
      content: "Managing lab supplies with threshold alerts has eliminated emergency supply runs completely.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
      rating: 5
    }
  ];

  const showcaseItems = [
    { title: "Notes & Tasks", subtitle: "Subtasks, deadlines, folders", image: notesPreview, icon: ListTodo },
    { title: "Meetings", subtitle: "Calendar sync, action items", image: meetingsPreview, icon: Users },
    { title: "Planning", subtitle: "Semester roadmaps", image: planningPreview, icon: Calendar },
    { title: "Analytics", subtitle: "Productivity insights", image: analyticsPreview, icon: BarChart },
    { title: "Supplies", subtitle: "Inventory management", image: suppliesPreview, icon: Package },
    { title: "Funding", subtitle: "Grant tracking", image: fundingPreview, icon: Wallet },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#F0F7F4" }}>

      {/* ── Navigation ── */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: "rgba(240,247,244,0.88)", borderColor: "rgba(44,122,75,0.15)" }}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <motion.div whileHover={{ scale: 1.05, rotate: 4 }} transition={{ type: "spring", stiffness: 300 }}>
              <SmartProfLogo size={38} />
            </motion.div>
            <span className="text-xl font-bold tracking-tight" style={{ color: "#0D1E41" }}>
              Smart<span style={{ color: "#1B7A5A" }}>-Prof</span>
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-8">
            <a href="#features" className="hidden md:block text-sm font-medium transition-colors duration-300" style={{ color: "#4A6B5A" }}>Features</a>
            <a href="#showcase" className="hidden md:block text-sm font-medium transition-colors duration-300" style={{ color: "#4A6B5A" }}>Showcase</a>
            <a href="#testimonials" className="hidden md:block text-sm font-medium transition-colors duration-300" style={{ color: "#4A6B5A" }}>Reviews</a>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden md:block">
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                style={{ background: "linear-gradient(135deg, #1B7A5A 0%, #0D5C3E 100%)", color: "#fff", border: "none" }}>
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <button
              type="button"
              className="md:hidden p-2 rounded-lg transition-colors duration-200"
              style={{ color: "#4A6B5A" }}
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
            style={{ borderColor: "rgba(44,122,75,0.15)", backgroundColor: "rgba(240,247,244,0.97)" }}
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium" style={{ color: "#4A6B5A" }}>Features</a>
            <a href="#showcase" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium" style={{ color: "#4A6B5A" }}>Showcase</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium" style={{ color: "#4A6B5A" }}>Reviews</a>
            <Button asChild size="default" className="w-full mt-1 font-semibold"
              style={{ background: "linear-gradient(135deg, #1B7A5A 0%, #0D5C3E 100%)", color: "#fff", border: "none" }}
              onClick={() => setMobileMenuOpen(false)}>
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        )}
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="relative py-16 md:py-28 lg:py-36 overflow-hidden">
        {/* Background blobs using logo palette */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -30, 0], opacity: [0.18, 0.32, 0.18] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 w-[200px] h-[200px] sm:w-[380px] sm:h-[380px] md:w-[540px] md:h-[540px] rounded-full blur-[110px]"
            style={{ background: "radial-gradient(circle, rgba(27,122,90,0.35) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ y: [0, 30, 0], opacity: [0.12, 0.22, 0.12] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -left-32 w-[160px] h-[160px] sm:w-[300px] sm:h-[300px] md:w-[440px] md:h-[440px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(circle, rgba(13,30,65,0.22) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.06, 0.14, 0.06] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] md:w-[750px] md:h-[750px] rounded-full blur-[130px]"
            style={{ background: "radial-gradient(circle, rgba(44,122,75,0.18) 0%, transparent 70%)" }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Logo showcase */}
            <motion.div variants={fadeInUp} className="flex justify-center mb-8">
              <motion.div
                whileHover={{ scale: 1.06, rotate: 2 }}
                transition={{ type: "spring", stiffness: 280 }}
                className="rounded-3xl overflow-hidden"
                style={{
                  boxShadow: "0 20px 60px -10px rgba(13,30,65,0.22), 0 0 0 4px rgba(27,122,90,0.18)",
                }}
              >
                <SmartProfLogo size={180} className="rounded-3xl" />
              </motion.div>
            </motion.div>

            {/* Badge */}
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 mb-8 px-5 py-2 rounded-full text-sm font-semibold border"
                style={{ background: "rgba(27,122,90,0.08)", borderColor: "rgba(27,122,90,0.25)", color: "#1B7A5A" }}>
                <Sparkles className="h-4 w-4" style={{ color: "#3DAA6E" }} />
                The all-in-one platform for professors, researchers and educators
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6 md:mb-8 leading-[1.12] tracking-tight"
            >
              <span style={{ color: "#0D1E41" }}>Your Academic</span>
              <br />
              <span className="relative inline-block pb-3">
                <span style={{
                  backgroundImage: "linear-gradient(90deg, #1B7A5A 0%, #3DAA6E 50%, #1B7A5A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>
                  Life
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.9, ease: easeOut }}
                  className="absolute bottom-0 left-[5%] right-[5%] h-[3px] origin-left rounded-full"
                  style={{ background: "linear-gradient(90deg, #1B7A5A, #3DAA6E, #1B7A5A)" }}
                />
              </span>
              <br />
              <span style={{ color: "#0D1E41" }}>Organized.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl mb-8 md:mb-14 max-w-2xl mx-auto leading-relaxed"
              style={{ color: "#4A6B5A" }}
            >
              Manage grants, track publications, schedule meetings, monitor supplies, and get AI-powered insights.
              Everything a professor needs, beautifully organized in one place.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-10 md:mb-20"
            >
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-shadow duration-300"
                  style={{ background: "linear-gradient(135deg, #1B7A5A 0%, #0D5C3E 100%)", color: "#fff", border: "none" }}>
                  <Link to="/auth">
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                <a href="#showcase" className="inline-flex items-center gap-2 h-14 px-6 text-base font-medium rounded-lg border transition-all duration-200"
                  style={{ color: "#1B7A5A", borderColor: "rgba(27,122,90,0.3)", background: "rgba(27,122,90,0.06)" }}>
                  <Play className="h-4 w-4" />
                  See it in action
                  <ChevronRight className="h-4 w-4" />
                </a>
              </motion.div>
            </motion.div>

            {/* Feature pills */}
            <motion.div variants={staggerContainer} className="flex flex-wrap justify-center gap-3">
              {[
                { icon: CheckCircle2, label: "Subtasks" },
                { icon: Clock, label: "Smart Deadlines" },
                { icon: Calendar, label: "Semester Planning" },
                { icon: FolderOpen, label: "Folders" },
                { icon: Award, label: "Achievements" },
                { icon: LineChart, label: "Analytics" },
                { icon: MessageSquare, label: "Communications" },
                { icon: Brain, label: "AI Insights" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  whileHover={{ y: -4, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full cursor-default border"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    borderColor: "rgba(27,122,90,0.2)",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 2px 8px rgba(13,30,65,0.06)"
                  }}
                >
                  <item.icon className="h-4 w-4" style={{ color: "#1B7A5A" }} />
                  <span className="text-sm font-medium" style={{ color: "#0D1E41" }}>{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-12 md:py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D1E41 0%, #0D3D2E 60%, #1B7A5A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(61,170,110,0.12), transparent 60%)" }} />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ scale: 1.08, y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex p-4 rounded-2xl mb-4 transition-colors duration-300"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <stat.icon className="h-7 w-7" style={{ color: "#A8DFC8" }} />
                </motion.div>
                <h3 className="text-4xl md:text-5xl font-bold mb-1" style={{ color: "#F0F7F4" }}>{stat.value}</h3>
                <p className="font-medium" style={{ color: "rgba(168,223,200,0.85)" }}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-16 md:py-32 relative" style={{ backgroundColor: "#F0F7F4" }}>
        {/* Subtle grid texture */}
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{ backgroundImage: "radial-gradient(circle, rgba(27,122,90,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center mb-10 md:mb-20"
          >
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ background: "rgba(27,122,90,0.08)", borderColor: "rgba(27,122,90,0.25)", color: "#1B7A5A" }}>
              <Layers className="h-3.5 w-3.5" style={{ color: "#3DAA6E" }} />
              Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#0D1E41" }}>
              8 Powerful Modules
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: "#4A6B5A" }}>
              Comprehensive tools designed specifically for academic professionals, all connected in one seamless workspace.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="group relative overflow-hidden h-full transition-all duration-500"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(27,122,90,0.15)",
                    boxShadow: "0 2px 12px rgba(13,30,65,0.06)"
                  }}>
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-lg"
                    style={{ background: "linear-gradient(90deg, transparent, #1B7A5A, #3DAA6E, transparent)" }} />

                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-lg"
                    style={{ background: "linear-gradient(135deg, rgba(27,122,90,0.04) 0%, transparent 60%)" }} />

                  <CardContent className="relative p-7">
                    <div className="flex items-center justify-between mb-5">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        className="p-3.5 rounded-xl transition-shadow duration-500"
                        style={{
                          background: "linear-gradient(135deg, #1B7A5A 0%, #0D5C3E 100%)",
                          boxShadow: "0 6px 20px rgba(27,122,90,0.3)"
                        }}
                      >
                        <feature.icon className="h-6 w-6" style={{ color: "#fff" }} />
                      </motion.div>
                      {feature.badge && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          feature.badge === "New"
                            ? "border-[rgba(61,170,110,0.3)] bg-[rgba(61,170,110,0.1)] text-[#2C7A4B]"
                            : feature.badge === "AI"
                            ? "border-[rgba(13,30,65,0.2)] bg-[rgba(13,30,65,0.07)] text-[#0D1E41]"
                            : "border-[rgba(27,122,90,0.25)] bg-[rgba(27,122,90,0.08)] text-[#1B7A5A]"
                        }`}>
                          {feature.badge === "AI" && <Brain className="h-3 w-3 mr-1 inline" />}
                          {feature.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold mb-3 transition-colors duration-300 group-hover:text-[#1B7A5A]"
                      style={{ color: "#0D1E41" }}>{feature.title}</h3>
                    <p className="mb-5 leading-relaxed text-sm" style={{ color: "#4A6B5A" }}>{feature.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight, hIndex) => (
                        <span key={hIndex}
                          className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-300"
                          style={{
                            borderColor: "rgba(27,122,90,0.2)",
                            background: "rgba(240,247,244,0.8)",
                            color: "#3A5C4A"
                          }}>
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Showcase Section ── */}
      <section id="showcase" className="py-16 md:py-32 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #E8F3EE 0%, #F0F7F4 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at bottom right, rgba(13,30,65,0.07), transparent 60%)" }} />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center mb-10 md:mb-20"
          >
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ background: "rgba(13,30,65,0.06)", borderColor: "rgba(13,30,65,0.18)", color: "#0D1E41" }}>
              <Target className="h-3.5 w-3.5" style={{ color: "#1B7A5A" }} />
              Platform Showcase
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#0D1E41" }}>
              See It In Action
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: "#4A6B5A" }}>
              Explore the features that make academic management effortless.
            </p>
          </motion.div>

          {/* Top row: 2 featured cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6 mb-6"
          >
            {showcaseItems.slice(0, 2).map((item, index) => (
              <motion.div
                key={index}
                variants={index === 0 ? fadeInLeft : fadeInRight}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group"
              >
                <div className="rounded-2xl overflow-hidden h-full transition-all duration-500"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(27,122,90,0.15)",
                    boxShadow: "0 4px 20px rgba(13,30,65,0.08)"
                  }}>
                  <div className="p-5 border-b"
                    style={{ borderColor: "rgba(27,122,90,0.12)", background: "linear-gradient(90deg, rgba(240,247,244,0.9), rgba(232,243,238,0.6))" }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl transition-shadow duration-500"
                        style={{ background: "linear-gradient(135deg, #1B7A5A, #0D5C3E)", boxShadow: "0 4px 12px rgba(27,122,90,0.3)" }}>
                        <item.icon className="h-5 w-5" style={{ color: "#fff" }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-[#1B7A5A]"
                          style={{ color: "#0D1E41" }}>{item.title}</h3>
                        <p className="text-sm" style={{ color: "#4A6B5A" }}>{item.subtitle}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto transition-all duration-300 group-hover:translate-x-1"
                        style={{ color: "rgba(27,122,90,0.4)" }} />
                    </div>
                  </div>
                  <div className="overflow-hidden relative">
                    <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: "linear-gradient(to top, rgba(13,30,65,0.08), transparent)" }} />
                    <img src={item.image} alt={item.title}
                      className="w-full h-auto group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      loading="lazy" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom row: 4 compact cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {showcaseItems.slice(2).map((item, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group"
              >
                <div className="rounded-2xl overflow-hidden h-full transition-all duration-500"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(27,122,90,0.15)",
                    boxShadow: "0 4px 16px rgba(13,30,65,0.07)"
                  }}>
                  <div className="p-3.5 border-b"
                    style={{ borderColor: "rgba(27,122,90,0.12)", background: "linear-gradient(90deg, rgba(240,247,244,0.9), rgba(232,243,238,0.5))" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg"
                        style={{ background: "linear-gradient(135deg, #1B7A5A, #0D5C3E)", boxShadow: "0 3px 8px rgba(27,122,90,0.25)" }}>
                        <item.icon className="h-3.5 w-3.5" style={{ color: "#fff" }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate transition-colors duration-300 group-hover:text-[#1B7A5A]"
                          style={{ color: "#0D1E41" }}>{item.title}</h3>
                        <p className="text-xs truncate" style={{ color: "#4A6B5A" }}>{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden relative">
                    <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: "linear-gradient(to top, rgba(13,30,65,0.07), transparent)" }} />
                    <img src={item.image} alt={item.title}
                      className="w-full h-auto group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      loading="lazy" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section id="testimonials" className="py-16 md:py-32 relative" style={{ backgroundColor: "#F0F7F4" }}>
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center mb-10 md:mb-20"
          >
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ background: "rgba(61,170,110,0.1)", borderColor: "rgba(61,170,110,0.3)", color: "#2C7A4B" }}>
              <Award className="h-3.5 w-3.5" style={{ color: "#3DAA6E" }} />
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#0D1E41" }}>
              Loved by Academics
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: "#4A6B5A" }}>
              See what professors and researchers are saying.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="group h-full relative overflow-hidden transition-all duration-500"
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(27,122,90,0.15)",
                    boxShadow: "0 4px 20px rgba(13,30,65,0.07)"
                  }}>
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(180deg, #1B7A5A, #3DAA6E)" }} />

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-lg"
                    style={{ background: "linear-gradient(135deg, rgba(27,122,90,0.03) 0%, transparent 60%)" }} />

                  <CardContent className="relative p-8">
                    <div className="flex gap-1 mb-5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" style={{ color: "#3DAA6E" }} />
                      ))}
                    </div>

                    <p className="mb-8 leading-relaxed text-lg italic" style={{ color: "#3A5C4A" }}>
                      "{testimonial.content}"
                    </p>

                    <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: "rgba(27,122,90,0.12)" }}>
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 transition-all duration-300"
                        style={{ ringColor: "rgba(27,122,90,0.25)" }}
                      />
                      <div>
                        <p className="font-semibold" style={{ color: "#0D1E41" }}>{testimonial.name}</p>
                        <p className="text-sm font-medium" style={{ color: "#1B7A5A" }}>{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-16 md:py-32 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D1E41 0%, #0A3028 55%, #1B7A5A 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, rgba(61,170,110,0.1), transparent 60%)" }} />
          <motion.div
            animate={{ y: [-20, 20, -20], x: [-15, 15, -15] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-[15%] w-3 h-3 rounded-full"
            style={{ background: "rgba(168,223,200,0.3)" }}
          />
          <motion.div
            animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-24 right-[20%] w-5 h-5 rounded-full"
            style={{ background: "rgba(168,223,200,0.2)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.04, 0.1, 0.04] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px]"
            style={{ background: "rgba(61,170,110,0.25)" }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-sm font-semibold border"
              style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "#A8DFC8" }}>
              <Zap className="h-3.5 w-3.5" />
              Start Your Journey
            </span>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8" style={{ color: "#F0F7F4" }}>
              Your Academic Command Center Awaits
            </h2>

            <p className="text-xl mb-8 md:mb-14 max-w-xl mx-auto" style={{ color: "rgba(168,223,200,0.85)" }}>
              Join hundreds of academics who have transformed how they manage their professional life. Start free, no credit card needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                  style={{ background: "#F0F7F4", color: "#0D1E41", border: "none" }}>
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button size="lg" variant="outline" onClick={() => setShowContact(true)}
                  className="h-14 px-10 text-lg font-semibold transition-all duration-300"
                  style={{ borderColor: "rgba(168,223,200,0.4)", color: "#A8DFC8", background: "transparent" }}>
                  Talk to the Team
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t" style={{ background: "#E8F3EE", borderColor: "rgba(27,122,90,0.15)" }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2.5">
              <SmartProfLogo size={32} />
              <span className="text-lg font-bold" style={{ color: "#0D1E41" }}>
                Smart<span style={{ color: "#1B7A5A" }}>-Prof</span>
              </span>
            </div>

            <p className="text-sm" style={{ color: "#4A6B5A" }}>
              &copy; {new Date().getFullYear()} SmartProf. Empowering academics worldwide.
            </p>

            <div className="flex gap-6">
              <button type="button" onClick={() => setShowPrivacy(true)}
                className="text-sm font-medium transition-colors duration-300 hover:underline"
                style={{ color: "#4A6B5A" }}>Privacy</button>
              <button type="button" onClick={() => setShowTerms(true)}
                className="text-sm font-medium transition-colors duration-300 hover:underline"
                style={{ color: "#4A6B5A" }}>Terms</button>
              <button type="button" onClick={() => setShowContact(true)}
                className="text-sm font-medium transition-colors duration-300 hover:underline"
                style={{ color: "#4A6B5A" }}>Contact</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Dialogs ── */}
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
            <DialogDescription>Please review our terms before using SmartProf.</DialogDescription>
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
          <div className="space-y-3 py-2 text-sm leading-6" style={{ color: "#4A6B5A" }}>
            <p>
              For support, bug reports, or general feedback, please use the{" "}
              <span className="font-medium" style={{ color: "#0D1E41" }}>in-app Feedback Portal</span> after signing in.
            </p>
            <p>
              You can find it in the main navigation menu once you are logged into your SmartProf account.
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
