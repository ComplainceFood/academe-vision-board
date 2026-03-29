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
  GraduationCap, 
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
  Bell,
  LineChart,
  Clock,
  BarChart,
  Award,
  Target,
  Layers,
  Rocket,
  TestTube,
  Megaphone,
  MessageCircle,
  FolderOpen
} from "lucide-react";

// Import preview images
import notesPreview from "@/assets/landing/notes-preview.png";
import meetingsPreview from "@/assets/landing/meetings-preview.png";
import planningPreview from "@/assets/landing/planning-preview.png";
import suppliesPreview from "@/assets/landing/supplies-preview.png";
import analyticsPreview from "@/assets/landing/analytics-preview.png";
import fundingPreview from "@/assets/landing/funding-preview.png";

// Animation config
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

  const features = [
    {
      icon: ListTodo,
      title: "Notes & Commitments",
      description: "Manage tasks with subtasks, recurring automation, smart deadlines, and color-coded folder organization.",
      highlights: ["Subtask Progress", "Recurring Tasks", "Folder Organization"],
      badge: "Popular"
    },
    {
      icon: Users,
      title: "Meeting Hub",
      description: "Schedule meetings, track action items, and sync with your calendar seamlessly.",
      highlights: ["Calendar Sync", "Action Items", "Recurring Meetings"],
      badge: null
    },
    {
      icon: Calendar,
      title: "Semester Planning",
      description: "Plan your academic calendar with event scheduling, future task planning, and calendar integrations.",
      highlights: ["Event Scheduling", "Outlook Sync", "Google Calendar"],
      badge: null
    },
    {
      icon: Wallet,
      title: "Grant Management",
      description: "Monitor research grants, track expenditures, manage commitments, and generate financial reports.",
      highlights: ["Budget Tracking", "Expenditure Reports", "Multi-source"],
      badge: null
    },
    {
      icon: Package,
      title: "Supplies & Expenses",
      description: "Threshold alerts, shopping lists, expense tracking, and cost analytics for lab supplies.",
      highlights: ["Stock Alerts", "Shopping Lists", "Expense Tracking"],
      badge: null
    },
    {
      icon: Award,
      title: "Scholastic Achievements",
      description: "Track publications, awards, teaching performance, research presentations, and student supervision.",
      highlights: ["Publications", "Awards", "ORCID Integration"],
      badge: "New"
    },
  ];

  const stats = [
    { icon: GraduationCap, value: "10K+", label: "Academics" },
    { icon: TrendingUp, value: "40%", label: "More Productive" },
    { icon: Shield, value: "100%", label: "Secure" },
    { icon: Zap, value: "24/7", label: "Available" },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Professor of Biology",
      institution: "Stanford University",
      content: "The smart deadline indicators have transformed how I manage my research commitments. I never miss a deadline now.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Prof. Michael Chen",
      role: "Computer Science",
      institution: "MIT",
      content: "The folder organization system is phenomenal. I can easily categorize all my notes and student commitments.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Psychology Department",
      institution: "Harvard University",
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

  const comingSoonFeatures = [
    { icon: TestTube, title: "Testing Platform", description: "Full test management with suites, cases, and execution tracking" },
    { icon: Megaphone, title: "Admin Communications", description: "Centralized announcements and organizational updates" },
    { icon: MessageCircle, title: "Enhanced Feedback", description: "Advanced feedback analytics and response workflows" },
    { icon: Rocket, title: "AI-Powered Insights", description: "Smart recommendations and automated productivity analysis" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <div className="p-2.5 rounded-xl shadow-lg bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
            </motion.div>
            <span className="text-2xl font-bold text-primary">SmartProf</span>
          </div>
          <div className="flex items-center gap-2 md:gap-8">
            <a href="#features" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">Features</a>
            <a href="#showcase" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">Showcase</a>
            <a href="#testimonials" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300">Reviews</a>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300">
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative py-28 md:py-40 overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ y: [0, -30, 0], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] bg-primary/25"
          />
          <motion.div 
            animate={{ y: [0, 30, 0], opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-[100px] bg-secondary/20"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.12, 0.05] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[120px] bg-primary/10"
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-8 px-5 py-2 text-sm font-medium border border-primary/20 bg-primary/8 text-primary backdrop-blur-sm">
                <Sparkles className="h-4 w-4 mr-2 text-secondary" />
                Trusted by 10,000+ Academics Worldwide
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.15] tracking-tight"
            >
              <span className="text-foreground">Academic</span>
              <br />
              <span className="relative inline-block pb-3">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  Excellence
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8, ease: easeOut }}
                  className="absolute bottom-0 left-[5%] right-[5%] h-[3px] origin-left rounded-full bg-gradient-to-r from-primary via-secondary to-primary"
                />
              </span>
              <br />
              <span className="text-foreground">Simplified.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl mb-14 max-w-2xl mx-auto leading-relaxed text-muted-foreground"
            >
              The all-in-one workspace for professors, researchers, and educators. 
              Organize tasks, track grants, manage supplies, and boost productivity.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
            >
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <Link to="/auth">
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold border-2 border-primary/30 text-primary hover:bg-primary/8 hover:border-primary/50 transition-all duration-300">
                  <a href="#showcase">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </a>
                </Button>
              </motion.div>
            </motion.div>

            {/* Feature pills */}
            <motion.div 
              variants={staggerContainer}
              className="flex flex-wrap justify-center gap-3"
            >
              {[
                { icon: CheckCircle2, label: "Subtasks" },
                { icon: Clock, label: "Smart Deadlines" },
                { icon: Calendar, label: "Planning" },
                { icon: FolderOpen, label: "Folders" },
                { icon: Award, label: "Achievements" },
                { icon: LineChart, label: "Analytics" },
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={scaleIn}
                  whileHover={{ y: -4, scale: 1.05, boxShadow: "0 8px 25px -5px hsl(var(--primary) / 0.15)" }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-sm border border-border/60 bg-card/80 backdrop-blur-sm cursor-default"
                >
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary-foreground)/0.08),transparent_60%)]" />
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
                  className="inline-flex p-4 rounded-2xl mb-4 bg-primary-foreground/15 group-hover:bg-primary-foreground/25 transition-colors duration-300"
                >
                  <stat.icon className="h-7 w-7 text-primary-foreground" />
                </motion.div>
                <h3 className="text-4xl md:text-5xl font-bold mb-1 text-primary-foreground">{stat.value}</h3>
                <p className="font-medium text-primary-foreground/75">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-background relative">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <Badge className="mb-6 px-4 py-1.5 border border-primary/20 bg-primary/8 text-primary">
              <Layers className="h-3.5 w-3.5 mr-1.5 text-secondary" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Everything You Need
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
              Comprehensive tools designed specifically for academic professionals
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="group relative overflow-hidden h-full border border-border/60 bg-card shadow-md hover:shadow-2xl hover:border-primary/30 transition-all duration-500">
                  {/* Top accent line with glow */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                  
                  <CardContent className="relative p-7">
                    <div className="flex items-center justify-between mb-5">
                      <motion.div 
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        className="p-3.5 rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-500"
                      >
                        <feature.icon className="h-6 w-6 text-primary-foreground" />
                      </motion.div>
                      {feature.badge && (
                        <Badge className={`text-xs font-semibold border ${feature.badge === 'New' ? 'border-secondary/30 bg-secondary/10 text-secondary' : 'border-primary/30 bg-primary/10 text-primary'}`}>
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                    <p className="mb-5 leading-relaxed text-muted-foreground">{feature.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight, hIndex) => (
                        <span 
                          key={hIndex}
                          className="text-xs font-medium px-3 py-1.5 rounded-full border border-border/50 bg-muted/60 text-muted-foreground group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors duration-300"
                        >
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

      {/* Showcase Section */}
      <section id="showcase" className="py-32 bg-muted/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.06),transparent_60%)]" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <Badge className="mb-6 px-4 py-1.5 border border-primary/20 bg-primary/8 text-primary">
              <Target className="h-3.5 w-3.5 mr-1.5 text-secondary" />
              Platform Showcase
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              See It In Action
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
              Explore the features that make academic management effortless
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
                <div className="rounded-2xl overflow-hidden border border-border/50 bg-card shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-500 h-full">
                  <div className="p-5 border-b border-border/30 bg-gradient-to-r from-muted/80 to-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-500">
                        <item.icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                  <div className="overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-card/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-auto group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
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
                <div className="rounded-2xl overflow-hidden border border-border/50 bg-card shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-500 h-full">
                  <div className="p-3.5 border-b border-border/30 bg-gradient-to-r from-muted/80 to-muted/40">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-500">
                        <item.icon className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300 truncate">{item.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-card/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-auto group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="py-24 bg-background relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 left-[10%] w-2 h-2 rounded-full bg-primary/20"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-20 right-[15%] w-3 h-3 rounded-full bg-secondary/15"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[80px] bg-primary/8"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <Badge className="px-5 py-2 text-sm font-semibold border border-accent/30 bg-accent/10 text-accent">
                <Rocket className="h-4 w-4 mr-2" />
                Coming Soon
              </Badge>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              What's Next
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
              Exciting new features currently in development
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {comingSoonFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="group relative overflow-hidden h-full border border-dashed border-border bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:bg-card transition-all duration-500">
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <motion.div
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12"
                    />
                  </div>

                  <CardContent className="relative p-6 text-center">
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                      className="inline-flex p-3 rounded-xl mb-4 border border-primary/20 bg-primary/8 group-hover:bg-primary/15 transition-colors duration-300"
                    >
                      <feature.icon className="h-6 w-6 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 bg-muted/30 relative">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <Badge className="mb-6 px-4 py-1.5 border border-primary/20 bg-primary/8 text-primary">
              <Award className="h-3.5 w-3.5 mr-1.5 text-secondary" />
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Loved by Academics
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
              See what professors and researchers are saying
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
                <Card className="group h-full border border-border/60 bg-card shadow-md hover:shadow-2xl hover:border-primary/25 transition-all duration-500 relative overflow-hidden">
                  {/* Subtle hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br from-primary/4 via-transparent to-secondary/4" />
                  
                  <CardContent className="relative p-8">
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current text-secondary" />
                      ))}
                    </div>
                    
                    <p className="mb-8 leading-relaxed text-lg italic text-muted-foreground">
                      "{testimonial.content}"
                    </p>
                    
                    <div className="flex items-center gap-4 pt-4 border-t border-border/40">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all duration-300"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm font-medium text-primary">{testimonial.role}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.institution}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary-foreground)/0.06),transparent_60%)]" />
          <motion.div 
            animate={{ y: [-20, 20, -20], x: [-15, 15, -15] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 left-[15%] w-3 h-3 rounded-full bg-primary-foreground/25"
          />
          <motion.div 
            animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-24 right-[20%] w-5 h-5 rounded-full bg-primary-foreground/15"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] bg-secondary/20"
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
            <Badge className="mb-8 px-4 py-1.5 border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Start Your Journey
            </Badge>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-primary-foreground">
              Ready to Transform Your Workflow?
            </h2>
            
            <p className="text-xl mb-14 text-primary-foreground/80 max-w-xl mx-auto">
              Join thousands of academics already using SmartProf to boost their productivity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl bg-background text-primary hover:bg-background/90 hover:shadow-2xl transition-all duration-300">
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:border-primary-foreground/50 transition-all duration-300">
                  <a href="#features">
                    Learn More
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </a>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl shadow-sm bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SmartProf</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SmartProf. Empowering academics worldwide.
            </p>
            
            <div className="flex gap-6">
              <button type="button" onClick={() => setShowPrivacy(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Privacy</button>
              <button type="button" onClick={() => setShowTerms(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Terms</button>
              <button type="button" onClick={() => setShowContact(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">Contact</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Dialog */}
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

      {/* Terms of Service Dialog */}
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

      {/* Contact Dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact & Support</DialogTitle>
            <DialogDescription>We'd love to hear from you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground leading-6">
            <p>
              For support, bug reports, or general feedback, please use the{" "}
              <span className="font-medium text-foreground">in-app Feedback Portal</span> after signing in.
            </p>
            <p>
              You can find it in the main navigation menu once you're logged into your SmartProf account.
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
