import React from "react";
import { motion, type Easing } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  FolderOpen,
  Package,
  Wallet,
  Bell,
  LineChart,
  Clock,
  LayoutDashboard,
  BarChart
} from "lucide-react";

// Import preview images
import notesPreview from "@/assets/landing/notes-preview.png";
import meetingsPreview from "@/assets/landing/meetings-preview.png";
import planningPreview from "@/assets/landing/planning-preview.png";
import suppliesPreview from "@/assets/landing/supplies-preview.png";
import analyticsPreview from "@/assets/landing/analytics-preview.png";
import fundingPreview from "@/assets/landing/funding-preview.png";

// Animation variants with proper typing
const easeOut: Easing = [0.16, 1, 0.3, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOut } }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOut } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } }
};

const LandingPreview = () => {
  const features = [
    {
      icon: ListTodo,
      title: "Smart Task Management",
      description: "Break down complex tasks into subtasks with visual progress tracking. Smart deadline indicators show overdue, today, tomorrow, and this week at a glance.",
      image: notesPreview,
      gradient: "from-teal-500 to-emerald-600",
      bgGradient: "from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20",
      highlights: ["Subtask Progress Bars", "Smart Deadline Alerts", "Priority Sorting"],
      badge: "Most Popular"
    },
    {
      icon: RefreshCw,
      title: "Recurring Tasks & Automation",
      description: "Set up daily, weekly, biweekly, or monthly recurring tasks that auto-regenerate upon completion. Never forget routine responsibilities again.",
      image: planningPreview,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20",
      highlights: ["Auto-Regeneration", "Pattern Scheduling", "End Date Control"],
      badge: "New"
    },
    {
      icon: FolderOpen,
      title: "Folder & Notebook System",
      description: "Create color-coded folders to organize notes, commitments, and research materials. Hierarchical structure keeps everything accessible.",
      image: notesPreview,
      gradient: "from-cyan-500 to-teal-600",
      bgGradient: "from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/20",
      highlights: ["Color Coding", "Hierarchical View", "Quick Navigation"],
      badge: "New"
    },
    {
      icon: Users,
      title: "Meeting & Collaboration Hub",
      description: "Schedule meetings, track action items, and manage attendees with calendar integration. Record meeting notes and follow-up tasks seamlessly.",
      image: meetingsPreview,
      gradient: "from-teal-600 to-cyan-500",
      bgGradient: "from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20",
      highlights: ["Calendar Sync", "Action Items", "Recurring Meetings"],
      badge: null
    },
    {
      icon: Wallet,
      title: "Grant & Funding Tracker",
      description: "Track research grants, monitor expenditures, and generate detailed financial reports. Stay on top of budget allocations and spending.",
      image: fundingPreview,
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20",
      highlights: ["Budget Tracking", "Expenditure Reports", "Multi-source Support"],
      badge: null
    },
    {
      icon: Package,
      title: "Inventory & Supply Management",
      description: "Monitor lab supplies with threshold alerts, manage shopping lists, and track inventory costs. Never run out of essential materials.",
      image: suppliesPreview,
      gradient: "from-emerald-600 to-teal-500",
      bgGradient: "from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20",
      highlights: ["Low Stock Alerts", "Shopping Lists", "Cost Analytics"],
      badge: null
    },
  ];

  const stats = [
    { icon: GraduationCap, value: "10K+", label: "Academics Empowered" },
    { icon: TrendingUp, value: "40%", label: "Productivity Increase" },
    { icon: Shield, value: "100%", label: "Secure & Private" },
    { icon: Zap, value: "24/7", label: "Always Available" },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Professor of Biology",
      institution: "Stanford University",
      content: "The smart deadline indicators and recurring task features have transformed how I manage my research commitments. I never miss a deadline now.",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Prof. Michael Chen",
      role: "Computer Science Department",
      institution: "MIT",
      content: "The folder organization system is phenomenal. I can now easily categorize all my notes, publications, and student commitments in one place.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Psychology Department",
      institution: "Harvard University",
      content: "Managing lab supplies with threshold alerts has eliminated emergency supply runs. The subtask feature helps me break down complex research tasks.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
      rating: 5
    }
  ];

  const keyFeatures = [
    { icon: CheckCircle2, title: "Subtasks & Progress", description: "Visual progress bars for complex tasks" },
    { icon: Clock, title: "Smart Deadlines", description: "Color-coded deadline indicators" },
    { icon: RefreshCw, title: "Recurring Tasks", description: "Auto-regenerating scheduled tasks" },
    { icon: FolderOpen, title: "Folder System", description: "Color-coded organizational folders" },
    { icon: Bell, title: "Smart Notifications", description: "Never miss important deadlines" },
    { icon: LineChart, title: "Analytics Dashboard", description: "Insights into your productivity" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-teal-500 to-emerald-600 p-2.5 rounded-xl shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              SmartProf
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">
              <a href="#features">Features</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">
              <a href="#showcase">Showcase</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors">
              <a href="#testimonials">Reviews</a>
            </Button>
            <Button asChild size="lg" className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg hover:shadow-teal-500/25 hover:shadow-xl transition-all duration-300 text-white font-semibold">
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-background to-emerald-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent"></div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-6 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 px-4 py-1.5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Now with Subtasks, Recurring Tasks & Folders
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                Teaching Smarter.
              </span>
              <br />
              <span className="text-foreground">Managing Better.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The all-in-one academic workspace designed for professors, researchers, and educators. 
              Organize tasks, track grants, manage supplies, and boost your productivity.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button asChild size="lg" className="group bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300 text-white h-14 px-8 text-lg font-semibold">
                <Link to="/auth">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-2 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:border-teal-300 transition-all duration-300">
                <a href="#showcase">
                  <Play className="mr-2 h-5 w-5" />
                  See It In Action
                </a>
              </Button>
            </motion.div>

            {/* Key Features Pills */}
            <motion.div 
              variants={staggerContainer}
              className="flex flex-wrap justify-center gap-3"
            >
              {keyFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={scaleIn}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-teal-100 dark:border-teal-900/50 rounded-full px-4 py-2 shadow-sm hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300"
                >
                  <feature.icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-medium">{feature.title}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-gradient-to-r from-teal-50/50 via-background to-emerald-50/50 dark:from-teal-950/20 dark:via-background dark:to-emerald-950/20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                variants={scaleIn}
                whileHover={{ scale: 1.05 }}
                className="text-center group"
              >
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-4 shadow-lg group-hover:shadow-xl group-hover:shadow-teal-500/20 transition-all duration-300">
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">{stat.value}</h3>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Excel</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed specifically for academic professionals
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-500 bg-gradient-to-br ${feature.bgGradient} h-full`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient}`}></div>
                  
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full"></div>
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <motion.div 
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                        className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                      >
                        <feature.icon className="h-6 w-6 text-white" />
                      </motion.div>
                      {feature.badge && (
                        <Badge className={`text-xs font-semibold ${feature.badge === 'New' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200'}`}>
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight, hIndex) => (
                        <span 
                          key={hIndex}
                          className="text-xs font-medium bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-teal-100 dark:border-teal-900/50 shadow-sm"
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
      <section id="showcase" className="py-24 bg-gradient-to-br from-teal-50/30 via-background to-emerald-50/30 dark:from-teal-950/10 dark:via-background dark:to-emerald-950/10">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Platform Showcase
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              See <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">SmartProf</span> in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore the powerful features that make academic management effortless
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 mb-8"
          >
            {/* Notes & Tasks Preview */}
            <motion.div variants={fadeInLeft} whileHover={{ scale: 1.02 }} className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background hover:shadow-teal-500/10 transition-shadow duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
                <div className="p-4 border-b bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
                      <ListTodo className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Notes & Task Management</h3>
                      <p className="text-xs text-muted-foreground">Subtasks, deadlines, and organization</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <img 
                    src={notesPreview} 
                    alt="Notes and Task Management Dashboard" 
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </motion.div>

            {/* Meetings Preview */}
            <motion.div variants={fadeInRight} whileHover={{ scale: 1.02 }} className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background hover:shadow-teal-500/10 transition-shadow duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-600"></div>
                <div className="p-4 border-b bg-gradient-to-r from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Meeting Scheduler</h3>
                      <p className="text-xs text-muted-foreground">Calendar sync and action items</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <img 
                    src={meetingsPreview} 
                    alt="Meeting Scheduling Dashboard" 
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </motion.div>

            {/* Planning Preview */}
            <motion.div variants={fadeInLeft} whileHover={{ scale: 1.02 }} className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background hover:shadow-teal-500/10 transition-shadow duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600"></div>
                <div className="p-4 border-b bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Academic Planning</h3>
                      <p className="text-xs text-muted-foreground">Semester planning and roadmaps</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <img 
                    src={planningPreview} 
                    alt="Academic Planning Dashboard" 
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </motion.div>

            {/* Analytics Preview */}
            <motion.div variants={fadeInRight} whileHover={{ scale: 1.02 }} className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background hover:shadow-teal-500/10 transition-shadow duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                <div className="p-4 border-b bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md">
                      <BarChart className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Analytics Dashboard</h3>
                      <p className="text-xs text-muted-foreground">Productivity insights and reports</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <img 
                    src={analyticsPreview} 
                    alt="Analytics Dashboard" 
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Supplies Preview */}
            <motion.div variants={fadeInLeft} whileHover={{ scale: 1.02 }} className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background hover:shadow-teal-500/10 transition-shadow duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                <div className="p-4 border-b bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Inventory Management</h3>
                      <p className="text-xs text-muted-foreground">Stock alerts and shopping lists</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <img 
                    src={suppliesPreview} 
                    alt="Inventory Management Dashboard" 
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </motion.div>

            {/* Funding Preview */}
            <motion.div variants={fadeInRight} whileHover={{ scale: 1.02 }} className="group">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-background hover:shadow-teal-500/10 transition-shadow duration-500">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="p-4 border-b bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Grant & Funding Tracker</h3>
                      <p className="text-xs text-muted-foreground">Budget tracking and expenditures</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <img 
                    src={fundingPreview} 
                    alt="Grant Funding Management Dashboard" 
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Trusted by <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Academics</span> Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what professors and researchers are saying about SmartProf
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="relative overflow-hidden border shadow-lg hover:shadow-xl hover:shadow-teal-500/5 transition-all duration-300 h-full bg-gradient-to-br from-background to-teal-50/30 dark:to-teal-950/10">
                  <CardContent className="pt-8">
                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-emerald-400 text-emerald-400" />
                      ))}
                    </div>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed italic">
                      "{testimonial.content}"
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/20"
                      />
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        <p className="text-xs text-teal-600 dark:text-teal-400">{testimonial.institution}</p>
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
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
        
        {/* Animated particles */}
        <motion.div 
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full blur-sm"
        />
        <motion.div 
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-32 w-6 h-6 bg-white/15 rounded-full blur-sm"
        />
        <motion.div 
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-20 w-3 h-3 bg-white/25 rounded-full blur-sm"
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Start Your Journey
            </Badge>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Academic Workflow?
            </h2>
            
            <p className="text-xl text-white/80 mb-10">
              Join thousands of academics who are already using SmartProf to boost their productivity and organize their professional lives.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="lg" className="bg-white text-teal-700 hover:bg-white/90 shadow-xl hover:shadow-2xl h-14 px-8 text-lg font-semibold">
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 h-14 px-8 text-lg font-semibold bg-transparent backdrop-blur-sm">
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
      <footer className="py-12 border-t bg-gradient-to-r from-teal-50/30 via-background to-emerald-50/30 dark:from-teal-950/10 dark:via-background dark:to-emerald-950/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-2 rounded-xl shadow-md">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                SmartProf
              </span>
            </div>
            
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} SmartProf. Empowering academics worldwide.
            </p>
            
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPreview;
