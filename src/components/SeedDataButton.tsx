
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";

// Comprehensive mock data for all modules
const mockNotes = [
  {
    title: "Project Extension Promise",
    content: "Promised 2-week extension for final project to students who attended the workshop due to technical difficulties during class.",
    type: "commitment",
    course: "CS101",
    tags: ["extension", "project", "promise"],
    priority: "high",
    status: "active",
    due_date: "2025-03-15 23:59:59",
    starred: true
  },
  {
    title: "Research Mentoring Commitment",
    content: "Committed to reviewing Jane Smith's research proposal on neural networks by Friday and providing detailed feedback.",
    type: "commitment",
    course: "Research",
    student_name: "Jane Smith",
    tags: ["research", "mentoring", "deadline"],
    priority: "urgent",
    status: "active",
    due_date: "2025-02-07 17:00:00",
    starred: true
  },
  {
    title: "Lab Equipment Order",
    content: "Need to order 5 more Raspberry Pi kits for the robotics lab. Budget approved, just need to process the order by Monday.",
    type: "note",
    course: "CS202",
    tags: ["supplies", "lab", "order"],
    priority: "medium",
    status: "active",
    due_date: "2025-02-10 09:00:00",
    starred: false
  },
  {
    title: "Midterm Format Change",
    content: "Agreed to change midterm format to include more practical coding problems after student feedback survey results.",
    type: "commitment",
    course: "CS101",
    tags: ["exam", "format", "student-feedback"],
    priority: "medium",
    status: "completed",
    starred: false
  },
  {
    title: "Conference Paper Deadline",
    content: "Submit paper on 'AI in Education' to SIGCSE 2025. Draft is 80% complete, need to finalize results section.",
    type: "reminder",
    course: "Research",
    tags: ["conference", "paper", "deadline"],
    priority: "urgent",
    status: "active",
    due_date: "2025-02-15 23:59:59",
    starred: true
  },
  {
    title: "Student Accommodation",
    content: "Promised to provide extended time on exams for Michael Brown due to documented learning disability.",
    type: "commitment",
    course: "CS404",
    student_name: "Michael Brown",
    tags: ["accommodation", "exam", "accessibility"],
    priority: "high",
    status: "active",
    starred: false
  },
  {
    title: "Lecture Recording",
    content: "Promised to post recording of today's lecture due to technical issues with the projector during class.",
    type: "commitment",
    course: "CS202",
    tags: ["lecture", "recording", "technical-issues"],
    priority: "high",
    status: "completed",
    starred: true
  },
  {
    title: "Guest Speaker Follow-up",
    content: "Follow up with Dr. Martinez about guest lecture on cybersecurity. Need to confirm date and technical requirements.",
    type: "note",
    course: "CS404",
    tags: ["guest-speaker", "cybersecurity", "coordination"],
    priority: "medium",
    status: "active",
    due_date: "2025-02-20 12:00:00",
    starred: false
  },
  {
    title: "Grade Appeal Process",
    content: "Review Emily Davis's grade appeal for CS101 midterm. Schedule meeting to discuss her concerns about question 5.",
    type: "note",
    course: "CS101",
    student_name: "Emily Davis",
    tags: ["grade-appeal", "meeting", "review"],
    priority: "high",
    status: "active",
    due_date: "2025-02-12 15:00:00",
    starred: false
  },
  {
    title: "Summer Research Program",
    content: "Committed to mentoring 3 undergraduate students in the summer research program. Need to prepare project proposals.",
    type: "commitment",
    course: "Research",
    tags: ["summer", "research", "mentoring"],
    priority: "medium",
    status: "active",
    due_date: "2025-03-15 17:00:00",
    starred: false
  }
];

const mockMeetings = [
  {
    title: "Academic Advisory Meeting",
    description: "",
    type: "one_on_one",
    status: "scheduled",
    start_date: "2025-04-28",
    start_time: "10:00",
    end_time: "10:30",
    location: "Office 302",
    attendees: [{ name: "John Smith", email: "", status: "pending", required: true }],
    agenda: "",
    notes: "",
    action_items: [],
    attachments: [],
    is_recurring: false,
    reminder_minutes: 15
  },
  {
    title: "Project Guidance",
    description: "",
    type: "one_on_one",
    status: "scheduled",
    start_date: "2025-04-27",
    start_time: "14:00",
    end_time: "14:45",
    location: "Online (Zoom)",
    attendees: [{ name: "Emily Johnson", email: "", status: "pending", required: true }],
    agenda: "",
    notes: "",
    action_items: [],
    attachments: [],
    is_recurring: false,
    reminder_minutes: 15
  },
  {
    title: "Research Discussion",
    description: "",
    type: "one_on_one",
    status: "completed",
    start_date: "2025-04-20",
    start_time: "11:30",
    end_time: "12:30",
    location: "Lab 204",
    attendees: [{ name: "Michael Brown", email: "", status: "accepted", required: true }],
    agenda: "",
    notes: "Discussed progress on the machine learning project. Michael has made significant progress on the data preprocessing steps.",
    action_items: [
      { id: "1", description: "Share research papers on neural networks by email", assignee: "Professor", due_date: "", completed: false, created_at: "2025-04-20T11:30:00Z" },
      { id: "2", description: "Provide access to the department GPU server", assignee: "Professor", due_date: "", completed: false, created_at: "2025-04-20T11:30:00Z" },
      { id: "3", description: "Schedule follow-up meeting next week", assignee: "Professor", due_date: "", completed: false, created_at: "2025-04-20T11:30:00Z" }
    ],
    attachments: [],
    is_recurring: false,
    reminder_minutes: 15
  },
  {
    title: "Grade Review",
    description: "",
    type: "one_on_one",
    status: "completed",
    start_date: "2025-04-18",
    start_time: "09:15",
    end_time: "09:30",
    location: "Office 302",
    attendees: [{ name: "Sarah Davis", email: "", status: "accepted", required: true }],
    agenda: "",
    notes: "Reviewed midterm exam results. Sarah had questions about the algorithm complexity question.",
    action_items: [
      { id: "1", description: "Provide additional practice problems", assignee: "Professor", due_date: "", completed: false, created_at: "2025-04-18T09:15:00Z" },
      { id: "2", description: "Review concepts during next lecture", assignee: "Professor", due_date: "", completed: false, created_at: "2025-04-18T09:15:00Z" }
    ],
    attachments: [],
    is_recurring: false,
    reminder_minutes: 15
  },
  {
    title: "Career Advising",
    description: "",
    type: "one_on_one",
    status: "scheduled",
    start_date: "2025-04-30",
    start_time: "15:30",
    end_time: "16:15",
    location: "Office 302",
    attendees: [{ name: "David Wilson", email: "", status: "pending", required: true }],
    agenda: "",
    notes: "",
    action_items: [],
    attachments: [],
    is_recurring: false,
    reminder_minutes: 15
  }
];

const mockSupplies = [
  {
    name: "Whiteboard Markers",
    category: "Office Supplies",
    course: "All Courses",
    current_count: 12,
    total_count: 50,
    threshold: 10,
    cost: 2.99,
    last_restocked: "2025-03-15"
  },
  {
    name: "Raspberry Pi Kits",
    category: "Lab Equipment",
    course: "CS202",
    current_count: 8,
    total_count: 15,
    threshold: 5,
    cost: 65.00,
    last_restocked: "2025-01-20"
  },
  {
    name: "USB Flash Drives",
    category: "Lab Equipment",
    course: "CS101",
    current_count: 24,
    total_count: 40,
    threshold: 15,
    cost: 12.50,
    last_restocked: "2025-02-10"
  },
  {
    name: "Lab Manuals",
    category: "Books",
    course: "PHYS304",
    current_count: 18,
    total_count: 30,
    threshold: 10,
    cost: 24.99,
    last_restocked: "2025-03-01"
  },
  {
    name: "Graph Paper Notepads",
    category: "Office Supplies",
    course: "MATH201",
    current_count: 20,
    total_count: 50,
    threshold: 15,
    cost: 3.49,
    last_restocked: "2025-03-25"
  }
];

const mockExpenses = [
  {
    description: "Conference Registration - SIGCSE 2025",
    amount: 299.99,
    date: "2025-01-20",
    category: "Professional Development",
    course: "Research",
    receipt: true
  },
  {
    description: "Lab Equipment - Raspberry Pi Kits",
    amount: 450.00,
    date: "2024-12-10",
    category: "Equipment",
    course: "CS202",
    receipt: true
  },
  {
    description: "Reference Books - Machine Learning Textbooks",
    amount: 156.45,
    date: "2025-01-15",
    category: "Materials",
    course: "CS404",
    receipt: true
  },
  {
    description: "Workshop Refreshments",
    amount: 87.50,
    date: "2025-01-18",
    category: "Events",
    course: "CS101",
    receipt: false
  },
  {
    description: "Printer Ink Cartridges",
    amount: 64.99,
    date: "2025-01-25",
    category: "Office Supplies",
    course: "All Courses",
    receipt: true
  },
  {
    description: "Software License - MATLAB",
    amount: 500.00,
    date: "2025-01-08",
    category: "Software",
    course: "MATH201",
    receipt: true
  },
  {
    description: "Travel - Industry Conference",
    amount: 1250.75,
    date: "2024-12-15",
    category: "Travel",
    course: "Professional Development",
    receipt: true
  }
];

const mockPlanningEvents = [
  {
    title: "CS101 - Introduction to Programming",
    description: "Lecture on basic programming concepts",
    type: "lecture",
    course: "CS101",
    date: "2025-02-03",
    time: "09:00",
    end_time: "10:30",
    priority: "high",
    completed: false,
    location: "Room 101"
  },
  {
    title: "CS202 - Lab Session",
    description: "Hands-on Raspberry Pi programming",
    type: "lab",
    course: "CS202",
    date: "2025-02-04",
    time: "14:00",
    end_time: "16:00",
    priority: "high",
    completed: false,
    location: "Lab 204"
  },
  {
    title: "CS404 - Cybersecurity Seminar",
    description: "Guest lecture by Dr. Martinez on network security",
    type: "seminar",
    course: "CS404",
    date: "2025-02-10",
    time: "11:00",
    end_time: "12:30",
    priority: "medium",
    completed: false,
    location: "Auditorium A"
  },
  {
    title: "Faculty Senate Meeting",
    description: "Monthly faculty governance meeting",
    type: "meeting",
    date: "2025-02-07",
    time: "15:00",
    end_time: "17:00",
    priority: "medium",
    completed: false,
    location: "Conference Room B"
  },
  {
    title: "CS101 - Midterm Exam",
    description: "First midterm examination",
    type: "exam",
    course: "CS101",
    date: "2025-02-12",
    time: "09:00",
    end_time: "11:00",
    priority: "urgent",
    completed: false,
    location: "Room 101"
  }
];

const mockFundingSources = [
  {
    name: "NSF Educational Innovation Grant",
    type: "grant",
    total_amount: 85000.00,
    remaining_amount: 62500.00,
    start_date: "2024-09-01",
    end_date: "2026-08-31",
    status: "active",
    description: "Grant for developing innovative AI-based educational tools and methodologies",
    restrictions: "Must be used for educational technology development and student support",
    contact_person: "Dr. Patricia Chen",
    contact_email: "p.chen@nsf.gov",
    reporting_requirements: "Quarterly progress reports and annual financial statements"
  },
  {
    name: "University Research Excellence Fund",
    type: "budget_allocation",
    total_amount: 25000.00,
    remaining_amount: 18750.00,
    start_date: "2025-01-01",
    end_date: "2025-12-31",
    status: "active",
    description: "Annual research fund allocation for faculty research activities",
    restrictions: "Equipment purchases over $5000 require committee approval",
    contact_person: "Dr. Robert Williams",
    contact_email: "r.williams@university.edu",
    reporting_requirements: "Semester expense reports"
  },
  {
    name: "Industry Partnership - TechCorp",
    type: "donation",
    total_amount: 50000.00,
    remaining_amount: 45000.00,
    start_date: "2024-10-15",
    end_date: "2025-10-14",
    status: "active",
    description: "Corporate partnership funding for lab equipment and student projects",
    restrictions: "Preference for projects involving machine learning and data science",
    contact_person: "Ms. Jennifer Martinez",
    contact_email: "j.martinez@techcorp.com",
    reporting_requirements: "Bi-annual project showcases and impact reports"
  }
];

const mockShoppingList = [
  {
    name: "Raspberry Pi 4 Model B",
    quantity: 10,
    priority: "high",
    notes: "Needed for CS202 lab expansion next semester",
    purchased: false
  },
  {
    name: "Whiteboard Markers (Assorted Colors)",
    quantity: 20,
    priority: "medium",
    notes: "Running low on blue and red markers",
    purchased: false
  },
  {
    name: "USB-C Cables",
    quantity: 15,
    priority: "medium",
    notes: "For new laptop connectivity in lab",
    purchased: false
  },
  {
    name: "Backup Hard Drives (2TB)",
    quantity: 3,
    priority: "high",
    notes: "For critical data backup in research lab",
    purchased: false
  }
];

const mockFeedback = [
  {
    subject: "Dashboard Loading Performance",
    description: "The analytics dashboard takes too long to load when viewing semester-wide data. Sometimes it times out completely. This affects daily workflow efficiency.",
    category: "technical",
    priority: "high",
    status: "in_progress"
  },
  {
    subject: "Feature Request: Bulk Note Operations",
    description: "It would be very helpful to have bulk operations for notes - such as bulk tagging, bulk status changes, and bulk archiving. Currently doing these one by one is time-consuming.",
    category: "feature_request",
    priority: "medium",
    status: "under_review"
  },
  {
    subject: "Mobile App Suggestion",
    description: "A mobile app or better mobile web interface would be incredibly useful for quick note-taking during meetings and checking schedules on the go.",
    category: "feature_request",
    priority: "medium",
    status: "open"
  },
  {
    subject: "Excellent Supply Management Features",
    description: "The supply tracking and shopping list features have been incredibly helpful for lab management. The low-stock alerts have prevented several potential issues.",
    category: "general",
    priority: "low",
    status: "closed"
  }
];

const mockAchievements = [
  {
    category: "publication",
    title: "AI-Augmented Formative Assessment in Introductory CS Courses",
    description: "Peer-reviewed study on the effectiveness of AI-driven feedback tools in CS1/CS2 courses across three semesters.",
    journal_name: "ACM Transactions on Computing Education",
    date: "2025-01-10",
    status: "published",
    visibility: "public",
    tags: ["AI", "CS Education", "peer-reviewed"],
    co_authors: ["Emily Clark", "Michael Chen"],
    impact_factor: 3.2,
    url: "https://doi.org/10.1145/example"
  },
  {
    category: "research_presentation",
    title: "Federated Learning for Privacy-Preserving Student Analytics",
    description: "Conference presentation on a federated learning framework for cross-institutional student performance analysis.",
    venue: "SIGCSE 2025 Technical Symposium, Pittsburgh, PA",
    date: "2025-03-05",
    status: "completed",
    visibility: "public",
    tags: ["federated learning", "privacy", "conference"],
    co_authors: ["Sarah Johnson"]
  },
  {
    category: "invited_talk",
    title: "Keynote: The Future of AI-Assisted Learning in Higher Education",
    description: "Invited keynote address discussing emerging trends, ethical challenges, and practical applications of AI in university teaching.",
    venue: "National Conference on Educational Technology 2025, Chicago, IL",
    date: "2025-02-18",
    status: "completed",
    visibility: "public",
    tags: ["keynote", "AI", "invited"]
  },
  {
    category: "award_honor",
    title: "Outstanding Teaching Award - College of Engineering",
    description: "Recognized for exceptional teaching effectiveness, innovative pedagogy, and dedication to student mentorship in 2024–2025.",
    organization: "University College of Engineering",
    award_type: "teaching",
    date: "2025-04-01",
    status: "completed",
    visibility: "public",
    tags: ["teaching", "recognition"]
  },
  {
    category: "course_taught",
    title: "CS101 - Introduction to Computer Science (Spring 2025)",
    description: "Redesigned the introductory CS curriculum to incorporate Python-first instruction and active-learning exercises.",
    course_code: "CS101",
    term: "Spring 2025",
    student_count: 52,
    status: "completed",
    visibility: "public",
    tags: ["CS101", "curriculum", "Python"]
  },
  {
    category: "teaching_performance",
    title: "CS404 - Advanced Artificial Intelligence (Fall 2024)",
    description: "Teaching evaluation: 4.6/5.0. Students highlighted real-world project assignments and research-oriented instruction.",
    course_code: "CS404",
    term: "Fall 2024",
    evaluation_score: 4.6,
    student_count: 30,
    status: "completed",
    visibility: "private",
    tags: ["evaluation", "CS404"]
  },
  {
    category: "student_supervision",
    title: "PhD Supervision - Sarah Johnson",
    description: "Primary advisor for Sarah Johnson's PhD dissertation on 'Federated Learning for Healthcare Data Privacy'. Expected defense: May 2026.",
    student_name: "Sarah Johnson",
    student_level: "phd",
    status: "in_progress",
    visibility: "public",
    tags: ["PhD", "supervision", "research"]
  },
  {
    category: "service_review",
    title: "Program Committee Member - SIGCSE 2026",
    description: "Serving as a program committee reviewer for SIGCSE 2026 Technical Symposium. Reviewing 12 paper submissions across CS education tracks.",
    organization: "ACM SIGCSE",
    review_count: 12,
    date: "2025-03-20",
    status: "in_progress",
    visibility: "public",
    tags: ["service", "review", "SIGCSE"]
  },
  {
    category: "leadership_role",
    title: "Undergraduate Program Director - CS Department",
    description: "Overseeing undergraduate CS program: curriculum governance, advising coordination, and ABET accreditation self-study.",
    organization: "CS Department, University",
    date: "2024-08-15",
    status: "in_progress",
    visibility: "public",
    tags: ["leadership", "administration", "ABET"]
  },
  {
    category: "professional_development",
    title: "Workshop: Inclusive Pedagogy in STEM",
    description: "Completed 2-day faculty workshop on Universal Design for Learning (UDL), inclusive teaching practices, and supporting neurodivergent students.",
    organization: "Faculty Center for Teaching Excellence",
    date: "2025-03-15",
    status: "completed",
    visibility: "public",
    tags: ["workshop", "inclusion", "pedagogy"]
  },
  {
    category: "external_impact",
    title: "K-12 CS Education Outreach - Hour of Code 2024",
    description: "Led 3 coding sessions for local high school students as part of the national Hour of Code initiative. Reached 85 students across two schools.",
    organization: "Local School District / Code.org",
    date: "2024-12-12",
    status: "completed",
    visibility: "public",
    tags: ["outreach", "K-12", "Hour of Code"]
  }
];

const mockAdminCommunications = [
  {
    title: "System Maintenance Scheduled",
    content: "The learning management system will be offline for maintenance on Saturday, February 10th from 2:00 AM - 6:00 AM EST. Please plan accordingly and save your work before this time.",
    description: "Scheduled system maintenance notification",
    category: "system",
    priority: "high",
    is_published: true,
    published_at: "2025-02-01 09:00:00",
    expires_at: "2025-02-10 06:00:00"
  },
  {
    title: "New Lab Safety Protocols",
    content: "Updated lab safety protocols are now in effect. All faculty and students must complete the new safety training module before accessing lab facilities. Training materials available on the department website.",
    description: "Important safety protocol updates",
    category: "policy",
    priority: "urgent",
    is_published: true,
    published_at: "2025-01-25 14:30:00",
    expires_at: "2025-03-01 23:59:59"
  },
  {
    title: "Spring Semester Registration Reminder",
    content: "Registration for Spring 2025 courses ends on February 15th. Students should meet with their academic advisors to finalize course selections. Late registration fees apply after the deadline.",
    description: "Course registration deadline reminder",
    category: "academic",
    priority: "normal",
    is_published: true,
    published_at: "2025-01-30 10:00:00",
    expires_at: "2025-02-15 23:59:59"
  }
];

export function SeedDataButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  // Only show seed button to system admin users
  if (roleLoading || !isSystemAdmin()) {
    return null;
  }

  async function seedMockData() {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to seed data",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSeeding(true);
      
      // Add user_id to each record and current dates
      const notesWithUserId = mockNotes.map(note => ({
        ...note,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const meetingsWithUserId = mockMeetings.map(meeting => ({
        ...meeting,
        user_id: user.id
      }));
      
      const suppliesWithUserId = mockSupplies.map(supply => ({
        ...supply,
        user_id: user.id
      }));
      
      const expensesWithUserId = mockExpenses.map(expense => ({
        ...expense,
        user_id: user.id
      }));

      const planningEventsWithUserId = mockPlanningEvents.map(event => ({
        ...event,
        user_id: user.id,
        created_at: new Date().toISOString()
      }));

      const fundingSourcesWithUserId = mockFundingSources.map(source => ({
        ...source,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const shoppingListWithUserId = mockShoppingList.map(item => ({
        ...item,
        user_id: user.id,
        created_at: new Date().toISOString()
      }));

      const feedbackWithUserId = mockFeedback.map(feedback => ({
        ...feedback,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const adminCommunicationsWithUserId = mockAdminCommunications.map(comm => ({
        ...comm,
        admin_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const achievementsWithUserId = mockAchievements.map(achievement => ({
        ...achievement,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log("Seeding comprehensive mock data with user ID:", user.id);
      
      // Insert data into all tables in parallel
      const [
        notesResult,
        meetingsResult,
        suppliesResult,
        expensesResult,
        planningResult,
        fundingResult,
        shoppingResult,
        feedbackResult,
        communicationsResult,
        achievementsResult
      ] = await Promise.all([
        supabase.from('notes').insert(notesWithUserId),
        supabase.from('meetings').insert(meetingsWithUserId),
        supabase.from('supplies').insert(suppliesWithUserId),
        supabase.from('expenses').insert(expensesWithUserId),
        supabase.from('planning_events').insert(planningEventsWithUserId),
        supabase.from('funding_sources').insert(fundingSourcesWithUserId),
        supabase.from('shopping_list').insert(shoppingListWithUserId),
        supabase.from('feedback').insert(feedbackWithUserId),
        supabase.from('admin_communications').insert(adminCommunicationsWithUserId),
        supabase.from('scholastic_achievements').insert(achievementsWithUserId)
      ]);
      
      // Check if any errors occurred
      const errors = [];
      if (notesResult.error) errors.push(`Notes: ${notesResult.error.message}`);
      if (meetingsResult.error) errors.push(`Meetings: ${meetingsResult.error.message}`);
      if (suppliesResult.error) errors.push(`Supplies: ${suppliesResult.error.message}`);
      if (expensesResult.error) errors.push(`Expenses: ${expensesResult.error.message}`);
      if (planningResult.error) errors.push(`Planning Events: ${planningResult.error.message}`);
      if (fundingResult.error) errors.push(`Funding Sources: ${fundingResult.error.message}`);
      if (shoppingResult.error) errors.push(`Shopping List: ${shoppingResult.error.message}`);
      if (feedbackResult.error) errors.push(`Feedback: ${feedbackResult.error.message}`);
      if (communicationsResult.error) errors.push(`Communications: ${communicationsResult.error.message}`);
      if (achievementsResult.error) errors.push(`Achievements: ${achievementsResult.error.message}`);
      
      if (errors.length > 0) {
        console.warn("Some seeding operations had errors:", errors);
        toast({
          title: "Partial Success",
          description: `Mock data seeded with some warnings. Check console for details.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Success!",
          description: "Comprehensive mock data has been successfully seeded across all modules!",
        });
      }
      
      // Invalidate queries to refresh UI data across the app
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notes'] }),
        queryClient.invalidateQueries({ queryKey: ['meetings'] }),
        queryClient.invalidateQueries({ queryKey: ['supplies'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['planning_events'] }),
        queryClient.invalidateQueries({ queryKey: ['funding_sources'] }),
        queryClient.invalidateQueries({ queryKey: ['funding_expenditures'] }),
        queryClient.invalidateQueries({ queryKey: ['shopping_list'] }),
        queryClient.invalidateQueries({ queryKey: ['feedback'] }),
        queryClient.invalidateQueries({ queryKey: ['admin_communications'] }),
        queryClient.invalidateQueries({ queryKey: ['scholastic_achievements'] })
      ]);
      
      // Create a custom event that other components can listen for
      const seedDataEvent = new CustomEvent('seedDataCompleted', { detail: { userId: user.id } });
      window.dispatchEvent(seedDataEvent);
      
      console.log("Successfully seeded comprehensive mock data!");
    } catch (error) {
      console.error("Error seeding data:", error);
      toast({
        title: "Error seeding data",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <Button 
      onClick={seedMockData} 
      disabled={isSeeding || !user}
      className="w-full"
    >
      {isSeeding ? "Seeding Data..." : "Seed Mock Data"}
    </Button>
  );
}
