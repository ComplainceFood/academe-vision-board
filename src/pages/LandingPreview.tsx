import React from "react";
import { motion, type Easing } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
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
  BarChart,
  Award,
  Target,
  Layers
} from "lucide-react";

// Import preview images
import notesPreview from "@/assets/landing/notes-preview.png";
import meetingsPreview from "@/assets/landing/meetings-preview.png";
import planningPreview from "@/assets/landing/planning-preview.png";
import suppliesPreview from "@/assets/landing/supplies-preview.png";
import analyticsPreview from "@/assets/landing/analytics-preview.png";
import fundingPreview from "@/assets/landing/funding-preview.png";

// Animation variants
const easeOut: Easing = [0.16, 1, 0.3, 1];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easeOut } }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easeOut } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } }
};

// Pine Green color palette (using CSS custom properties approach)
// Primary: #1B4332 (Pine Green), #2D6A4F, #40916C, #52B788, #74C69D
// Accent: #081C15 (Deep Forest), #D8F3DC (Mint Cream)

const LandingPreview = () => {
  const features = [
    {
      icon: ListTodo,
      title: "Smart Task Management",
      description: "Break down complex tasks with visual progress tracking and smart deadline indicators.",
      highlights: ["Subtask Progress", "Deadline Alerts", "Priority Sorting"],
      badge: "Popular"
    },
    {
      icon: RefreshCw,
      title: "Recurring Automation",
      description: "Set up auto-regenerating tasks that keep your routine responsibilities on track.",
      highlights: ["Auto-Regeneration", "Pattern Scheduling", "End Date Control"],
      badge: "New"
    },
    {
      icon: FolderOpen,
      title: "Folder Organization",
      description: "Color-coded folders for notes, commitments, and research materials.",
      highlights: ["Color Coding", "Hierarchical View", "Quick Access"],
      badge: null
    },
    {
      icon: Users,
      title: "Meeting Hub",
      description: "Schedule meetings, track action items, and sync with your calendar seamlessly.",
      highlights: ["Calendar Sync", "Action Items", "Recurring Meetings"],
      badge: null
    },
    {
      icon: Wallet,
      title: "Grant Tracker",
      description: "Monitor research grants, track expenditures, and generate financial reports.",
      highlights: ["Budget Tracking", "Reports", "Multi-source"],
      badge: null
    },
    {
      icon: Package,
      title: "Inventory Control",
      description: "Threshold alerts, shopping lists, and cost analytics for lab supplies.",
      highlights: ["Stock Alerts", "Shopping Lists", "Analytics"],
      badge: null
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

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 50%, #F0FDF4 100%)' }}>
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ 
          background: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(27, 67, 50, 0.1)'
        }}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative"
            >
              <div className="p-2.5 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}>
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </motion.div>
            <span className="text-2xl font-bold" style={{ color: '#1B4332' }}>
              SmartProf
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            <a href="#features" className="hidden md:block text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#2D6A4F' }}>Features</a>
            <a href="#showcase" className="hidden md:block text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#2D6A4F' }}>Showcase</a>
            <a href="#testimonials" className="hidden md:block text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#2D6A4F' }}>Reviews</a>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300 text-white font-semibold" style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}>
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
      <section className="relative py-24 md:py-36 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(82, 183, 136, 0.2) 0%, transparent 70%)' }}
          />
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(27, 67, 50, 0.15) 0%, transparent 70%)' }}
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
              <Badge 
                className="mb-8 px-5 py-2 text-sm font-medium border-0"
                style={{ 
                  background: 'rgba(27, 67, 50, 0.08)',
                  color: '#1B4332'
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" style={{ color: '#40916C' }} />
                Trusted by 10,000+ Academics Worldwide
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight"
            >
              <span style={{ color: '#1B4332' }}>Academic</span>
              <br />
              <span className="relative">
                <span style={{ 
                  background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 50%, #52B788 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Excellence
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.8, duration: 0.8, ease: easeOut }}
                  className="absolute -bottom-2 left-0 h-1 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #40916C, #74C69D)' }}
                />
              </span>
              <br />
              <span style={{ color: '#081C15' }}>Simplified.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
              style={{ color: '#2D6A4F' }}
            >
              The all-in-one workspace for professors, researchers, and educators. 
              Organize tasks, track grants, manage supplies, and boost productivity.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 text-white" style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}>
                  <Link to="/auth">
                    Start Free Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold transition-all duration-300" style={{ borderColor: '#2D6A4F', color: '#1B4332', borderWidth: '2px' }}>
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
                { icon: RefreshCw, label: "Recurring Tasks" },
                { icon: FolderOpen, label: "Folders" },
                { icon: Bell, label: "Notifications" },
                { icon: LineChart, label: "Analytics" },
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  variants={scaleIn}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-sm transition-all duration-300"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(27, 67, 50, 0.1)'
                  }}
                >
                  <item.icon className="h-4 w-4" style={{ color: '#40916C' }} />
                  <span className="text-sm font-medium" style={{ color: '#1B4332' }}>{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #1B4332 0%, #081C15 100%)' }}>
        <div className="container mx-auto px-6">
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
                className="text-center"
              >
                <motion.div 
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  className="inline-flex p-4 rounded-2xl mb-4"
                  style={{ background: 'rgba(82, 183, 136, 0.2)' }}
                >
                  <stat.icon className="h-7 w-7" style={{ color: '#74C69D' }} />
                </motion.div>
                <h3 className="text-4xl md:text-5xl font-bold mb-1" style={{ color: '#D8F3DC' }}>{stat.value}</h3>
                <p className="font-medium" style={{ color: '#74C69D' }}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <Badge className="mb-6 px-4 py-1.5 border-0" style={{ background: 'rgba(27, 67, 50, 0.08)', color: '#1B4332' }}>
              <Layers className="h-3.5 w-3.5 mr-1.5" style={{ color: '#40916C' }} />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#1B4332' }}>
              Everything You Need
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: '#2D6A4F' }}>
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
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="group relative overflow-hidden h-full border-0 shadow-lg hover:shadow-xl transition-all duration-500" style={{ background: 'rgba(255, 255, 255, 0.9)' }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #1B4332, #40916C)' }} />
                  
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div 
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        className="p-3 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
                      >
                        <feature.icon className="h-6 w-6 text-white" />
                      </motion.div>
                      {feature.badge && (
                        <Badge className="text-xs font-semibold border-0" style={{ background: feature.badge === 'New' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(27, 67, 50, 0.1)', color: feature.badge === 'New' ? '#2D6A4F' : '#1B4332' }}>
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#1B4332' }}>{feature.title}</h3>
                    <p className="mb-4 leading-relaxed" style={{ color: '#2D6A4F' }}>{feature.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight, hIndex) => (
                        <span 
                          key={hIndex}
                          className="text-xs font-medium px-3 py-1.5 rounded-full"
                          style={{ 
                            background: 'rgba(27, 67, 50, 0.06)',
                            color: '#2D6A4F'
                          }}
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
      <section id="showcase" className="py-28" style={{ background: 'linear-gradient(180deg, #F0FDF4 0%, #D8F3DC 50%, #F0FDF4 100%)' }}>
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <Badge className="mb-6 px-4 py-1.5 border-0" style={{ background: 'rgba(27, 67, 50, 0.1)', color: '#1B4332' }}>
              <Target className="h-3.5 w-3.5 mr-1.5" style={{ color: '#40916C' }} />
              Platform Showcase
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#1B4332' }}>
              See It In Action
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: '#2D6A4F' }}>
              Explore the features that make academic management effortless
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {showcaseItems.map((item, index) => (
              <motion.div
                key={index}
                variants={index % 2 === 0 ? fadeInLeft : fadeInRight}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group"
              >
                <div 
                  className="rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
                  style={{ background: 'white' }}
                >
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #1B4332, #52B788)' }} />
                  <div className="p-4" style={{ background: 'rgba(27, 67, 50, 0.03)' }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}>
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: '#1B4332' }}>{item.title}</h3>
                        <p className="text-xs" style={{ color: '#40916C' }}>{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-28">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <Badge className="mb-6 px-4 py-1.5 border-0" style={{ background: 'rgba(27, 67, 50, 0.08)', color: '#1B4332' }}>
              <Award className="h-3.5 w-3.5 mr-1.5" style={{ color: '#40916C' }} />
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: '#1B4332' }}>
              Loved by Academics
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: '#2D6A4F' }}>
              See what professors and researchers are saying
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
                whileHover={{ y: -6 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300" style={{ background: 'white' }}>
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-current" style={{ color: '#40916C' }} />
                      ))}
                    </div>
                    
                    <p className="mb-8 leading-relaxed text-lg italic" style={{ color: '#2D6A4F' }}>
                      "{testimonial.content}"
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover"
                        style={{ border: '3px solid rgba(27, 67, 50, 0.1)' }}
                      />
                      <div>
                        <p className="font-semibold" style={{ color: '#1B4332' }}>{testimonial.name}</p>
                        <p className="text-sm" style={{ color: '#40916C' }}>{testimonial.role}</p>
                        <p className="text-sm" style={{ color: '#2D6A4F' }}>{testimonial.institution}</p>
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
      <section className="py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)' }}>
        {/* Decorative elements */}
        <motion.div 
          animate={{ y: [-15, 15, -15], x: [-10, 10, -10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-4 h-4 rounded-full"
          style={{ background: 'rgba(116, 198, 157, 0.3)' }}
        />
        <motion.div 
          animate={{ y: [15, -15, 15], x: [10, -10, 10] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 right-32 w-6 h-6 rounded-full"
          style={{ background: 'rgba(82, 183, 136, 0.2)' }}
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #52B788 0%, transparent 70%)' }}
        />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-8 px-4 py-1.5 border-0" style={{ background: 'rgba(116, 198, 157, 0.2)', color: '#D8F3DC' }}>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Start Your Journey
            </Badge>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8" style={{ color: '#D8F3DC' }}>
              Ready to Transform Your Workflow?
            </h2>
            
            <p className="text-xl mb-12" style={{ color: '#74C69D' }}>
              Join thousands of academics already using SmartProf to boost their productivity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="lg" className="h-14 px-10 text-lg font-semibold shadow-xl" style={{ background: '#D8F3DC', color: '#1B4332' }}>
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold" style={{ borderColor: 'rgba(116, 198, 157, 0.4)', color: '#D8F3DC', background: 'transparent' }}>
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
      <footer className="py-12 border-t" style={{ background: '#F0FDF4', borderColor: 'rgba(27, 67, 50, 0.1)' }}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl shadow-sm" style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}>
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold" style={{ color: '#1B4332' }}>SmartProf</span>
            </div>
            
            <p className="text-sm" style={{ color: '#40916C' }}>
              © {new Date().getFullYear()} SmartProf. Empowering academics worldwide.
            </p>
            
            <div className="flex gap-6">
              <a href="#" className="text-sm transition-colors hover:opacity-70" style={{ color: '#2D6A4F' }}>Privacy</a>
              <a href="#" className="text-sm transition-colors hover:opacity-70" style={{ color: '#2D6A4F' }}>Terms</a>
              <a href="#" className="text-sm transition-colors hover:opacity-70" style={{ color: '#2D6A4F' }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPreview;
