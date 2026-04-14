import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";
import { Database, TestTube, RotateCcw, Zap, Info, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper to create dates relative to today
const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const daysAgo = (days: number) => daysFromNow(-days);

// ─── Enhanced mock data sets for academic administration ─────────────────────

const mockDataSets = {
  notes: {
    name: "Academic Tasks & Notes",
    description: "Tasks, commitments, reminders and quick notes for academic work",
    count: 14,
    data: [
      {
        title: "Grade Midterm Exams - CS101",
        content: "Complete grading for CS101 midterm exams. 47 students submitted online, 2 submitted hard-copy (accessibility accommodations). Use updated rubric v3. Deadline: this Friday.",
        type: "commitment",
        course: "Grading",
        priority: "urgent",
        tags: ["grading", "deadline", "CS101"],
        starred: true,
        due_date: daysFromNow(3) + "T23:59:59",
      },
      {
        title: "Submit Final Grades to Registrar",
        content: "Submit all final grades for Fall semester courses (CS101, CS202, CS404) via the Faculty Grade Portal before the registrar deadline.",
        type: "commitment",
        course: "Admin",
        priority: "high",
        tags: ["admin", "grades", "registrar"],
        starred: false,
        due_date: daysFromNow(21) + "T17:00:00",
      },
      {
        title: "Review Thesis Draft - Sarah Johnson",
        content: "Review Chapter 3 of Sarah's thesis on 'Federated Learning for Healthcare Data Privacy'. Focus on methodology section and statistical validation approach. She needs feedback by next Tuesday.",
        type: "commitment",
        course: "Students",
        priority: "high",
        tags: ["thesis", "review", "graduate"],
        student_name: "Sarah Johnson",
        starred: false,
        due_date: daysFromNow(5) + "T17:00:00",
      },
      {
        title: "Prepare Lecture - Binary Search Trees",
        content: "Update slides for next week's Data Structures lecture. Add new interactive examples for BST insertion/deletion. Include a live-coding demo using Python.",
        type: "commitment",
        course: "Teaching",
        priority: "medium",
        tags: ["lecture", "preparation", "CS202"],
        starred: false,
        due_date: daysFromNow(6) + "T09:00:00",
      },
      {
        title: "Extended Office Hours Before Finals",
        content: "Set up additional office hours (Mon/Wed 4 to 6 PM) during the two weeks before final exams. Coordinate with TA Michael to cover Tuesday slots.",
        type: "reminder",
        course: "Admin",
        priority: "medium",
        tags: ["office-hours", "finals", "scheduling"],
        starred: false,
        due_date: daysFromNow(14) + "T10:00:00",
      },
      {
        title: "Department Curriculum Committee Presentation",
        content: "Prepare presentation proposing the new 'AI Ethics & Society' elective for the Spring 2026 catalog. Include learning outcomes, textbook options, and cross-department enrollment projections.",
        type: "commitment",
        course: "Meetings",
        priority: "high",
        tags: ["meeting", "curriculum", "presentation"],
        starred: true,
        due_date: daysFromNow(7) + "T14:00:00",
      },
      {
        title: "Order Raspberry Pi 5 Kits",
        content: "Submit purchase order for 10× Raspberry Pi 5 Starter Kits for the IoT Applications lab. Budget approved under NSF-2024-CS grant. Vendor: Adafruit.",
        type: "reminder",
        course: "Admin",
        priority: "low",
        tags: ["supplies", "lab", "purchase-order"],
        starred: false,
      },
      {
        title: "Student Accommodation - John Davis",
        content: "John D. has documented accommodations (extended exam time ×1.5, separate quiet room). Notify Testing Center for all remaining exams this semester.",
        type: "note",
        course: "Quick Notes",
        priority: "medium",
        tags: ["accommodation", "accessibility"],
        student_name: "John Davis",
        starred: false,
      },
      {
        title: "Research Paper Ideas for Summer",
        content: "Potential topics to explore:\n1. AI-assisted formative assessment in intro CS\n2. Gamification effects on retention in programming courses\n3. Remote lab accessibility for students with disabilities\n4. LLM-based tutoring system evaluation",
        type: "note",
        course: "Quick Notes",
        priority: "low",
        tags: ["research", "ideas", "summer"],
        starred: false,
      },
      {
        title: "SIGCSE 2026 Paper Submission",
        content: "Abstract deadline: March 15. Full paper due: April 20. Paper: 'Evaluating AI-Generated Code Reviews as a Pedagogical Tool'. Co-authors: Dr. Clark, M. Chen.",
        type: "note",
        course: "Quick Notes",
        priority: "high",
        tags: ["conference", "deadline", "SIGCSE"],
        starred: true,
        due_date: daysFromNow(30) + "T23:59:59",
      },
      {
        title: "Letter of Recommendation - Emily Park",
        content: "Emily Park requested a letter of rec for her PhD applications (MIT, Stanford, CMU). Deadline: December 15. She was my top student in CS404 and contributed to the AI assessment paper.",
        type: "commitment",
        course: "Students",
        priority: "high",
        tags: ["recommendation", "graduate-school"],
        student_name: "Emily Park",
        starred: false,
        due_date: daysFromNow(10) + "T17:00:00",
      },
      {
        title: "Update Course Syllabus - CS404",
        content: "Revise CS404 Advanced AI syllabus for Spring semester. Add new modules on transformer architecture and prompt engineering. Remove outdated RNN-only section.",
        type: "commitment",
        course: "Teaching",
        priority: "medium",
        tags: ["syllabus", "curriculum", "CS404"],
        starred: false,
        due_date: daysFromNow(25) + "T17:00:00",
      },
      {
        title: "Lab Safety Training Certificates",
        content: "All TAs and student workers need updated lab safety certs by start of next semester. Send reminder emails. 3 of 8 still outstanding.",
        type: "reminder",
        course: "Admin",
        priority: "low",
        tags: ["safety", "compliance", "lab"],
        starred: false,
      },
      {
        title: "Guest Lecture Confirmation - Dr. Martinez",
        content: "Dr. Ana Martinez (Google DeepMind) confirmed guest lecture on 'Responsible AI in Production' for CS404. Date: in two weeks. Need A/V setup and Zoom link for remote students.",
        type: "note",
        course: "Quick Notes",
        priority: "medium",
        tags: ["guest-speaker", "coordination"],
        starred: false,
      },
    ],
  },

  meetings: {
    name: "Academic Meetings",
    description: "Faculty meetings, student advising, committee sessions, and office hours",
    count: 8,
    data: [
      {
        title: "PhD Advisory - Sarah Johnson",
        type: "one_on_one",
        status: "scheduled",
        start_date: daysFromNow(2),
        start_time: "10:00",
        end_time: "10:45",
        attendees: [{ name: "Sarah Johnson", email: "s.johnson@university.edu", status: "accepted", required: true }],
        location: "Office 302, Science Building",
        description: "Monthly thesis progress check. Review Chapter 3 methodology, discuss timeline for defense (target: May).",
        agenda: "1. Chapter 3 feedback\n2. Defense timeline\n3. Conference submission plan",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: true,
        recurring_pattern: "monthly",
        reminder_minutes: 30,
      },
      {
        title: "Curriculum Committee Meeting",
        type: "group",
        status: "scheduled",
        start_date: daysFromNow(7),
        start_time: "14:00",
        end_time: "15:30",
        attendees: [
          { name: "Dr. Robert Smith (Chair)", email: "", status: "accepted", required: true },
          { name: "Dr. Lisa Brown", email: "", status: "accepted", required: true },
          { name: "Dr. James Wilson", email: "", status: "pending", required: false },
          { name: "Prof. Karen Lee", email: "", status: "accepted", required: true },
        ],
        location: "Conference Room A, Admin Building",
        description: "Review proposed changes to undergraduate CS requirements including new AI Ethics elective.",
        agenda: "1. Review current curriculum gaps\n2. New course proposals (AI Ethics, Cloud Computing)\n3. Industry advisory board feedback\n4. Vote on catalog updates",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: false,
        reminder_minutes: 60,
      },
      {
        title: "TA Weekly Sync - Michael Chen",
        type: "one_on_one",
        status: "scheduled",
        start_date: daysFromNow(1),
        start_time: "15:00",
        end_time: "15:30",
        attendees: [{ name: "Michael Chen (TA)", email: "m.chen@university.edu", status: "accepted", required: true }],
        location: "Office 302",
        description: "Weekly check-in on CS101 lab sections and grading progress.",
        agenda: "",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: true,
        recurring_pattern: "weekly",
        reminder_minutes: 15,
      },
      {
        title: "Department Faculty Meeting",
        type: "group",
        status: "scheduled",
        start_date: daysFromNow(10),
        start_time: "09:00",
        end_time: "11:00",
        attendees: [{ name: "All CS Faculty", email: "", status: "pending", required: true }],
        location: "Main Conference Hall",
        description: "Monthly department meeting. Topics: FY26 budget review, new faculty hiring, accreditation prep.",
        agenda: "1. Budget review (FY26 allocation)\n2. Faculty search committee update\n3. ABET accreditation timeline\n4. Open discussion",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: true,
        recurring_pattern: "monthly",
        reminder_minutes: 60,
      },
      {
        title: "Student Office Hours",
        type: "one_on_one",
        status: "scheduled",
        start_date: daysFromNow(1),
        start_time: "13:00",
        end_time: "15:00",
        attendees: [],
        location: "Office 302 & Zoom",
        description: "Open office hours for CS101 and CS202 students. Drop-in; no appointment needed.",
        agenda: "",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: true,
        recurring_pattern: "weekly",
        reminder_minutes: 15,
      },
      {
        title: "NSF Grant Collaboration Call - Dr. Clark",
        type: "one_on_one",
        status: "completed",
        start_date: daysAgo(3),
        start_time: "11:00",
        end_time: "12:00",
        attendees: [{ name: "Dr. Emily Clark (Stanford)", email: "eclark@stanford.edu", status: "accepted", required: true }],
        location: "Zoom",
        description: "Discussed collaborative NSF CAREER proposal on 'AI-Augmented CS Education for Equity'.",
        agenda: "",
        notes: "Agreed on joint proposal structure. Emily will lead the evaluation framework section. We'll target the July NSF deadline. Budget: ~$500K over 5 years.",
        action_items: [
          { id: "1", description: "Draft project narrative outline", assignee: "Self", due_date: daysFromNow(14), completed: false, created_at: new Date().toISOString() },
          { id: "2", description: "Share pilot study data from Fall CS101", assignee: "Self", due_date: daysFromNow(7), completed: false, created_at: new Date().toISOString() },
          { id: "3", description: "Schedule follow-up in 3 weeks", assignee: "Self", due_date: daysFromNow(21), completed: false, created_at: new Date().toISOString() },
        ],
        attachments: [],
        is_recurring: false,
        reminder_minutes: 15,
      },
      {
        title: "Undergraduate Research Mentor Meeting",
        type: "group",
        status: "scheduled",
        start_date: daysFromNow(4),
        start_time: "16:00",
        end_time: "17:00",
        attendees: [
          { name: "Alex Rivera", email: "", status: "accepted", required: true },
          { name: "Priya Sharma", email: "", status: "accepted", required: true },
        ],
        location: "Lab 204",
        description: "Biweekly meeting with undergraduate research assistants working on the AI tutoring system project.",
        agenda: "1. Progress updates\n2. Code review of chatbot module\n3. Plan user study recruitment",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: true,
        recurring_pattern: "biweekly",
        reminder_minutes: 15,
      },
      {
        title: "Promotion & Tenure Workshop",
        type: "group",
        status: "scheduled",
        start_date: daysFromNow(14),
        start_time: "12:00",
        end_time: "13:30",
        attendees: [{ name: "Faculty Development Office", email: "", status: "accepted", required: true }],
        location: "Faculty Center, Room 110",
        description: "Workshop on preparing tenure dossier. Covers teaching portfolio, research statement, and external reviewer selection.",
        agenda: "",
        notes: "",
        action_items: [],
        attachments: [],
        is_recurring: false,
        reminder_minutes: 60,
      },
    ],
  },

  supplies: {
    name: "Lab & Office Supplies",
    description: "Teaching materials, lab equipment, and office supply inventory",
    count: 12,
    data: [
      { name: "Dry Erase Markers (Assorted Colors)", category: "Office Supplies", course: "General", current_count: 8, total_count: 50, threshold: 15, cost: 2.49 },
      { name: "Arduino Uno R4 Boards", category: "Lab Equipment", course: "CS202 - Embedded Systems", current_count: 14, total_count: 25, threshold: 8, cost: 27.50 },
      { name: "Raspberry Pi 5 Starter Kits", category: "Lab Equipment", course: "CS301 - IoT Applications", current_count: 4, total_count: 15, threshold: 5, cost: 89.99 },
      { name: "USB-C Cables (6 ft)", category: "Cables & Accessories", course: "General Lab", current_count: 22, total_count: 50, threshold: 10, cost: 8.99 },
      { name: "Solderless Breadboards (Full-size)", category: "Lab Equipment", course: "CS202 - Embedded Systems", current_count: 3, total_count: 30, threshold: 10, cost: 5.99 },
      { name: "LED Assortment Kit (500 pcs)", category: "Components", course: "CS202 - Embedded Systems", current_count: 2, total_count: 10, threshold: 3, cost: 14.99 },
      { name: "Printer Paper (Ream, 500 sheets)", category: "Office Supplies", course: "General", current_count: 4, total_count: 20, threshold: 5, cost: 7.99 },
      { name: "HDMI Cables (10 ft)", category: "Cables & Accessories", course: "General Lab", current_count: 12, total_count: 20, threshold: 5, cost: 12.99 },
      { name: "Jumper Wire Kit (M/M, M/F, F/F)", category: "Components", course: "CS202 - Embedded Systems", current_count: 6, total_count: 20, threshold: 5, cost: 9.99 },
      { name: "Whiteboard Erasers", category: "Office Supplies", course: "General", current_count: 2, total_count: 10, threshold: 3, cost: 3.49 },
      { name: "Multimeter (Digital)", category: "Lab Equipment", course: "CS202 - Embedded Systems", current_count: 8, total_count: 12, threshold: 4, cost: 34.99 },
      { name: "Ethernet Cables (Cat6, 3 ft)", category: "Cables & Accessories", course: "CS301 - IoT Applications", current_count: 18, total_count: 30, threshold: 8, cost: 4.99 },
    ],
  },

  expenses: {
    name: "Academic Expenses",
    description: "Course materials, equipment, travel, and professional development costs",
    count: 8,
    data: [
      { description: "SIGCSE 2026 Conference Registration (Early Bird)", amount: 495.00, date: daysAgo(10), category: "Professional Development", course: "Research", receipt: true },
      { description: "Arduino Uno R4 Boards (10×) - Adafruit", amount: 275.00, date: daysAgo(18), category: "Lab Equipment", course: "CS202", receipt: true },
      { description: "Textbooks: 'Intro to Algorithms' 4th Ed. (3 desk copies)", amount: 189.00, date: daysAgo(5), category: "Course Materials", course: "CS202", receipt: true },
      { description: "Office Supplies Restock (markers, paper, toner)", amount: 72.45, date: daysAgo(22), category: "Office Supplies", course: "General", receipt: true },
      { description: "Student Worker Wages - Lab Prep (Nov)", amount: 640.00, date: daysAgo(8), category: "Personnel", course: "Lab Support", receipt: false },
      { description: "AWS Educate Cloud Credits - Fall Semester", amount: 200.00, date: daysAgo(32), category: "Software & Services", course: "CS401", receipt: true },
      { description: "Conference Travel - SIGCSE (Airfare + Hotel)", amount: 1245.00, date: daysAgo(45), category: "Travel", course: "Research", receipt: true },
      { description: "Raspberry Pi 5 Kits (5×) - Replacement units", amount: 449.95, date: daysAgo(15), category: "Lab Equipment", course: "CS301", receipt: true },
    ],
  },

  planningEvents: {
    name: "Calendar Events",
    description: "Academic deadlines, exams, lectures, and important dates",
    count: 8,
    data: [
      { title: "CS101 Midterm Exam", type: "exam", date: daysFromNow(14), time: "14:00", end_time: "16:00", course: "CS101", priority: "high", location: "Lecture Hall A" },
      { title: "CS301 Project Proposal Deadline", type: "deadline", date: daysFromNow(7), time: "23:59", course: "CS301", priority: "high" },
      { title: "Guest Lecture: Dr. Martinez (Google DeepMind)", type: "lecture", date: daysFromNow(12), time: "10:00", end_time: "11:30", course: "CS404", priority: "medium", location: "Room 205" },
      { title: "Final Exam Period Begins", type: "deadline", date: daysFromNow(35), time: "08:00", priority: "high" },
      { title: "CS202 Lab Practical Assessment", type: "exam", date: daysFromNow(10), time: "09:00", end_time: "11:00", course: "CS202", priority: "high", location: "Lab 204" },
      { title: "ABET Self-Study Report Due", type: "deadline", date: daysFromNow(28), time: "17:00", priority: "urgent" },
      { title: "Spring Semester Course Registration Opens", type: "deadline", date: daysFromNow(20), time: "08:00", priority: "medium" },
      { title: "Faculty Development Day (No Classes)", type: "meeting", date: daysFromNow(18), time: "09:00", end_time: "16:00", priority: "low", location: "Faculty Center" },
    ],
  },

  futureTasksAndPlanning: {
    name: "Semester Planning",
    description: "Long-term goals and future semester preparation items",
    count: 6,
    data: [
      { title: "Revise CS101 Curriculum (Python Focus)", semester: "Fall 2026", priority: "high", estimated_hours: 40, description: "Redesign introductory programming course to use Python as the primary language. Update all lab exercises, exams, and auto-grader." },
      { title: "Launch AI Ethics & Society Elective", semester: "Spring 2026", priority: "high", estimated_hours: 60, description: "Develop new elective course (CS350) covering bias in ML, responsible AI, regulation, and societal impact. Cross-list with Philosophy dept." },
      { title: "Lab 204 Equipment Modernization", semester: "Summer 2026", priority: "medium", estimated_hours: 20, description: "Replace aging lab PCs (2019 models). Upgrade to 32GB RAM workstations for ML coursework. Coordinate with IT for imaging." },
      { title: "NSF CAREER Proposal Submission", semester: "Fall 2026", priority: "high", estimated_hours: 100, description: "Complete and submit NSF CAREER award proposal: 'AI-Augmented CS Education for Equity'. Includes 5-year budget, evaluation plan, and broader impacts." },
      { title: "Study Abroad Partnership - CS in Barcelona", semester: "Spring 2027", priority: "low", estimated_hours: 30, description: "Explore partnership with Universitat Politècnica de Catalunya for a summer study abroad CS program." },
      { title: "Undergraduate Research Program Expansion", semester: "Summer 2026", priority: "medium", estimated_hours: 25, description: "Expand the summer undergraduate research program from 3 to 6 students. Secure additional funding through dean's office." },
    ],
  },

  feedback: {
    name: "Platform Feedback",
    description: "Sample user feedback for testing the feedback system",
    count: 4,
    data: [
      { category: "feature_request", subject: "Canvas LMS Calendar Sync", description: "Would love to sync assignment deadlines from Canvas LMS directly into the planning calendar. This would save a lot of manual entry at the start of each semester.", priority: "high", status: "open" },
      { category: "bug_report", subject: "Meeting Reminder Timing Issue", description: "Meeting reminders appear to fire at the wrong time - they come through about 5 minutes late instead of the configured 15 minutes before.", priority: "medium", status: "in_progress", admin_response: "Confirmed the timing bug. Fix is being tested and will ship in the next release." },
      { category: "general", subject: "Excellent Tool for Academic Workflow", description: "SmartProf has significantly improved how I manage my teaching, research, and admin responsibilities. The grant tracking feature is especially useful. Great work!", priority: "low", status: "closed", admin_response: "Thank you for the kind words! We're continually improving based on feedback from professors like you." },
      { category: "feature_request", subject: "Bulk CSV Import for Supplies", description: "At the start of each semester I need to add ~50 supply items. A CSV/Excel bulk import feature would save significant time versus adding them one by one.", priority: "medium", status: "open" },
    ],
  },

  fundingSources: {
    name: "Grants & Funding Sources",
    description: "Research grants, departmental budgets, and funding allocations",
    count: 5,
    data: [
      {
        name: "NSF Grant - AI in CS Education (Award #2024-CS-1847)",
        type: "grant",
        total_amount: 285000,
        remaining_amount: 197500,
        start_date: daysAgo(180),
        end_date: daysFromNow(550),
        status: "active",
        description: "NSF-funded research on AI-augmented formative assessment tools for introductory computer science courses. Covers personnel, equipment, travel, and participant support.",
        restrictions: "No foreign travel without prior NSF approval. Equipment purchases >$5,000 require program officer notification. Indirect costs capped at 48%.",
        contact_person: "Dr. Patricia Hernandez",
        contact_email: "phernandez@nsf.gov",
        reporting_requirements: "Annual progress report due every September. Final report due 120 days after award end date.",
      },
      {
        name: "Department Operating Budget - FY2026",
        type: "budget_allocation",
        total_amount: 45000,
        remaining_amount: 28750,
        start_date: daysAgo(90),
        end_date: daysFromNow(275),
        status: "active",
        description: "Annual departmental allocation for teaching supplies, office materials, software licenses, and minor equipment. Use-it-or-lose-it by fiscal year end.",
        restrictions: "Cannot be used for travel or personnel. Equipment limit: $2,500 per item. Software subscriptions must go through IT procurement.",
        contact_person: "Maria Santos (Dept. Admin)",
        contact_email: "m.santos@university.edu",
        reporting_requirements: "Monthly spending summary to department chair. Quarterly reconciliation with finance office.",
      },
      {
        name: "Google CS Education Research Award",
        type: "grant",
        total_amount: 75000,
        remaining_amount: 52000,
        start_date: daysAgo(120),
        end_date: daysFromNow(245),
        status: "active",
        description: "Google-funded research on effectiveness of LLM-based coding tutors for underrepresented students in CS. Covers 2 graduate RAs and cloud computing costs.",
        restrictions: "Must acknowledge Google funding in all publications. Data sharing agreement required for any published datasets.",
        contact_person: "James Liu (Google Research)",
        contact_email: "jliu@google.com",
        reporting_requirements: "Interim report at 6 months. Final report + published paper required within 90 days of conclusion.",
      },
      {
        name: "Dean's Innovation Fund - Lab Modernization",
        type: "donation",
        total_amount: 30000,
        remaining_amount: 12500,
        start_date: daysAgo(60),
        end_date: daysFromNow(120),
        status: "active",
        description: "One-time allocation from the Dean of Engineering's innovation fund to modernize Lab 204. Covers new workstations, IoT hardware, and classroom display technology.",
        restrictions: "Hardware only - no software licenses or personnel. All purchases must go through university procurement. Receipts required within 30 days.",
        contact_person: "Dr. Thomas Reed (Associate Dean)",
        contact_email: "t.reed@university.edu",
        reporting_requirements: "Final equipment inventory report due 30 days after fund expiration.",
      },
      {
        name: "Faculty Professional Development Fund",
        type: "budget_allocation",
        total_amount: 5000,
        remaining_amount: 2260,
        start_date: daysAgo(200),
        end_date: daysFromNow(165),
        status: "active",
        description: "Annual allocation for conference attendance, workshop registrations, journal subscriptions, and professional memberships (ACM, IEEE).",
        restrictions: "Max $2,000 per single conference. International travel requires chair approval 60 days in advance.",
        contact_person: "Admin Office",
        contact_email: "csadmin@university.edu",
        reporting_requirements: "Expense receipts within 14 days of expenditure. Annual summary due May 31.",
      },
    ],
  },

  shoppingList: {
    name: "Shopping / Reorder List",
    description: "Items flagged for purchase or reorder",
    count: 6,
    data: [
      { name: "Dry Erase Markers - Expo (Box of 12)", quantity: 4, priority: "high", purchased: false, notes: "Running low across all classrooms. Order ASAP." },
      { name: "Solderless Breadboards (Full-size)", quantity: 10, priority: "high", purchased: false, notes: "Only 3 left for CS202 lab. Need before next lab session." },
      { name: "LED Assortment Kits", quantity: 3, priority: "medium", purchased: false, notes: "Restock for embedded systems labs." },
      { name: "Whiteboard Erasers", quantity: 5, priority: "low", purchased: false, notes: "General classroom replenishment." },
      { name: "Raspberry Pi 5 Kits (w/ case & power supply)", quantity: 5, priority: "medium", purchased: false, notes: "Expansion for IoT course - funded by Dean's Innovation Fund." },
      { name: "USB-C to USB-A Adapters", quantity: 10, priority: "low", purchased: true, notes: "Ordered last week. Expected delivery: Friday." },
    ],
  },

  achievements: {
    name: "Scholastic Achievements",
    description: "Publications, awards, presentations, teaching performance, and service",
    count: 10,
    data: [
      {
        category: "publication",
        title: "Evaluating AI-Generated Code Reviews as a Pedagogical Tool in Introductory CS",
        description: "Peer-reviewed paper examining how AI-generated code reviews affect student learning outcomes and code quality in CS1 courses.",
        journal_name: "ACM Transactions on Computing Education (TOCE)",
        date: daysAgo(60),
        status: "completed",
        visibility: "public",
        tags: ["AI", "CS Education", "peer-reviewed"],
        co_authors: ["Emily Clark", "Michael Chen"],
        impact_factor: 3.2,
        url: "https://doi.org/10.1145/example",
      },
      {
        category: "publication",
        title: "Federated Learning Approaches for Privacy-Preserving Student Analytics",
        description: "Conference paper presenting a federated learning framework for analyzing student performance data across institutions without sharing raw data.",
        venue: "SIGCSE 2025 Technical Symposium",
        date: daysAgo(90),
        status: "completed",
        visibility: "public",
        tags: ["federated learning", "privacy", "conference"],
        co_authors: ["Sarah Johnson"],
      },
      {
        category: "award_honor",
        title: "Outstanding Teaching Award - College of Engineering",
        description: "Recognized for exceptional teaching effectiveness, innovative pedagogy, and dedication to student mentorship in the 2024-2025 academic year.",
        organization: "University College of Engineering",
        award_type: "teaching",
        date: daysAgo(30),
        status: "completed",
        visibility: "public",
        tags: ["teaching", "recognition"],
      },
      {
        category: "invited_talk",
        title: "Keynote: The Future of AI-Assisted Learning in Higher Education",
        description: "Invited keynote address at the National Conference on Educational Technology discussing trends and challenges in AI-powered learning tools.",
        venue: "NCET 2025 - Chicago, IL",
        date: daysAgo(45),
        status: "completed",
        visibility: "public",
        tags: ["keynote", "AI", "invited"],
      },
      {
        category: "teaching_performance",
        title: "CS101 - Introduction to Computer Science (Fall 2025)",
        description: "Teaching evaluation results: 4.7/5.0 overall. Students praised the interactive coding demos and accessibility of office hours.",
        course_code: "CS101",
        term: "Fall 2025",
        evaluation_score: 4.7,
        student_count: 47,
        status: "completed",
        visibility: "private",
        tags: ["evaluation", "CS101"],
      },
      {
        category: "teaching_performance",
        title: "CS404 - Advanced Artificial Intelligence (Fall 2025)",
        description: "Teaching evaluation: 4.5/5.0. Strong marks for real-world project assignments. Students suggested more industry guest speakers.",
        course_code: "CS404",
        term: "Fall 2025",
        evaluation_score: 4.5,
        student_count: 28,
        status: "completed",
        visibility: "private",
        tags: ["evaluation", "CS404"],
      },
      {
        category: "student_supervision",
        title: "PhD Supervision - Sarah Johnson",
        description: "Primary advisor for Sarah Johnson's PhD research on 'Federated Learning for Healthcare Data Privacy'. Expected defense: May 2026.",
        student_name: "Sarah Johnson",
        student_level: "phd",
        status: "in_progress",
        visibility: "public",
        tags: ["PhD", "supervision"],
      },
      {
        category: "service_review",
        title: "Program Committee - SIGCSE 2026",
        description: "Serving on the program committee for SIGCSE 2026 Technical Symposium. Reviewing 12 paper submissions.",
        organization: "ACM SIGCSE",
        review_count: 12,
        date: daysAgo(15),
        status: "in_progress",
        visibility: "public",
        tags: ["service", "review", "SIGCSE"],
      },
      {
        category: "leadership_role",
        title: "Undergraduate Program Director - CS Department",
        description: "Overseeing the undergraduate CS program including curriculum development, student advising coordination, and ABET accreditation preparation.",
        organization: "CS Department, University",
        date: daysAgo(365),
        status: "in_progress",
        visibility: "public",
        tags: ["leadership", "administration"],
      },
      {
        category: "professional_development",
        title: "Workshop: Inclusive Pedagogy in STEM",
        description: "Completed 2-day faculty workshop on inclusive teaching practices, Universal Design for Learning (UDL), and supporting neurodivergent students.",
        organization: "Faculty Center for Teaching Excellence",
        date: daysAgo(20),
        status: "completed",
        visibility: "public",
        tags: ["workshop", "inclusion", "pedagogy"],
      },
    ],
  },

  adminCommunications: {
    name: "Admin Communications",
    description: "Platform announcements, updates, and communications to users",
    count: 5,
    data: [
      {
        title: "Platform Maintenance - March 28",
        content: "SmartProf will undergo scheduled maintenance on March 28 from 2:00 AM to 4:00 AM EST. During this time, the platform will be temporarily unavailable. All data will be preserved. Please save your work before the maintenance window.",
        description: "Scheduled downtime notification for platform maintenance.",
        category: "maintenance",
        priority: "high",
        is_published: true,
        published_at: new Date().toISOString(),
        expires_at: daysFromNow(10) + "T04:00:00Z",
      },
      {
        title: "New Feature: Grant Management Dashboard",
        content: "We're excited to announce the launch of the Grant Management Dashboard! You can now track funding sources, expenditures, commitments, and generate reports all in one place. Navigate to the Funding tab to explore the new features.",
        description: "Announcing the new grant management module.",
        category: "features",
        priority: "normal",
        is_published: true,
        published_at: daysAgo(5) + "T10:00:00Z",
      },
      {
        title: "Security Update: Enhanced Data Protection",
        content: "We have implemented additional security measures including enhanced Row-Level Security policies, audit logging for sensitive operations, and improved session management. Your data privacy remains our top priority.",
        description: "Security improvements deployed to production.",
        category: "security",
        priority: "high",
        is_published: true,
        published_at: daysAgo(12) + "T09:00:00Z",
      },
      {
        title: "Welcome to SmartProf!",
        content: "Thank you for joining SmartProf - the comprehensive academic administration platform designed for professors and educators. Explore the dashboard to manage your notes, meetings, supplies, grants, and more. Visit Settings to customize your profile and notification preferences.",
        description: "Welcome message for new platform users.",
        category: "general",
        priority: "normal",
        is_published: true,
        published_at: daysAgo(30) + "T08:00:00Z",
      },
      {
        title: "Upcoming: Calendar Integration with Outlook & Google",
        content: "We're working on bidirectional calendar sync with both Microsoft Outlook and Google Calendar. This will allow you to see your SmartProf events alongside your university calendar. Expected release: next month. Stay tuned!",
        description: "Preview of upcoming calendar integration features.",
        category: "updates",
        priority: "low",
        is_published: true,
        published_at: daysAgo(3) + "T14:00:00Z",
      },
    ],
  },

  notificationPreferences: {
    name: "Notification Preferences",
    description: "Default notification settings for the admin account",
    count: 1,
    data: [
      {
        email_notifications: true,
        task_reminders: true,
        meeting_alerts: true,
        low_supply_alerts: true,
        funding_alerts: true,
        email_frequency: "daily",
        reminder_time: "09:00",
      },
    ],
  },
};

// Map from mockDataSets keys to actual Supabase table names
const tableMap: Record<string, string> = {
  notes: 'notes',
  meetings: 'meetings',
  supplies: 'supplies',
  expenses: 'expenses',
  planningEvents: 'planning_events',
  futureTasksAndPlanning: 'future_planning',
  feedback: 'feedback',
  fundingSources: 'funding_sources',
  shoppingList: 'shopping_list',
  achievements: 'scholastic_achievements',
  adminCommunications: 'admin_communications',
  notificationPreferences: 'notification_preferences',
};

// All tables that might contain user data (for delete all)
const ALL_USER_TABLES = [
  'funding_expenditures',
  'funding_commitments',
  'funding_reports',
  'funding_sources',
  'notes',
  'meetings',
  'supplies',
  'expenses',
  'planning_events',
  'future_planning',
  'feedback',
  'shopping_list',
  'scholastic_achievements',
  'admin_communications',
  'notification_preferences',
];

export function AdminSeedDataManager() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentSet, setCurrentSet] = useState("");
  const [seedResults, setSeedResults] = useState<{ [key: string]: { success: boolean; count: number; error?: string } }>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  if (roleLoading || !isSystemAdmin()) {
    return null;
  }

  // ─── INSERT logic ──────────────────────────────────────────────────────────
  async function seedSelectedData() {
    if (!user || selectedSets.length === 0) {
      toast({ title: "No data selected", description: "Please select at least one data set to seed", variant: "destructive" });
      return;
    }

    try {
      setIsSeeding(true);
      setProgress(0);
      setSeedResults({});

      const totalSets = selectedSets.length;
      let completedSets = 0;
      const results: { [key: string]: { success: boolean; count: number; error?: string } } = {};

      // Sort so fundingSources comes first
      const orderedSets = [...selectedSets].sort((a, b) => {
        if (a === 'fundingSources') return -1;
        if (b === 'fundingSources') return 1;
        return 0;
      });

      let fundingSourceIds: string[] = [];

      for (const setKey of orderedSets) {
        const mockSet = mockDataSets[setKey as keyof typeof mockDataSets];
        const tableName = tableMap[setKey];
        setCurrentSet(mockSet.name);

        try {
          const dataWithUserId = mockSet.data.map((item: any) => {
            const cleanedItem = { ...item };
            // For notes, remove 'description' field (table uses 'content')
            if (setKey === 'notes') {
              delete cleanedItem.description;
            }
            // For admin communications, use admin_id instead of user_id
            if (setKey === 'adminCommunications') {
              return { ...cleanedItem, admin_id: user.id };
            }
            return { ...cleanedItem, user_id: user.id };
          });

          // Notification preferences have a unique constraint on user_id - upsert to avoid duplicate errors
          const query = setKey === 'notificationPreferences'
            ? supabase.from(tableName as any).upsert(dataWithUserId, { onConflict: 'user_id' }).select('id')
            : supabase.from(tableName as any).insert(dataWithUserId).select('id');
          const { data, error } = await query;
          if (error) throw error;

          // Capture funding source IDs for potential future use
          if (setKey === 'fundingSources' && data) {
            fundingSourceIds = data.map((r: any) => r.id);
          }

          results[setKey] = { success: true, count: dataWithUserId.length };

          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: [tableName] });
          queryClient.invalidateQueries({ queryKey: [setKey] });
        } catch (error: any) {
          console.error(`Error seeding ${setKey}:`, error);
          results[setKey] = { success: false, count: 0, error: error.message };
        }

        completedSets++;
        setProgress((completedSets / totalSets) * 100);
        setSeedResults({ ...results });
      }

      // If we have funding source IDs, seed expenditures automatically
      if (fundingSourceIds.length > 0 && selectedSets.includes('fundingSources')) {
        try {
          const expenditures = [
            { funding_source_id: fundingSourceIds[0], amount: 15000, description: "Graduate RA - Fall Semester (Sarah Johnson)", category: "Personnel", expenditure_date: daysAgo(60), receipt_number: "RA-2025-001", user_id: user.id },
            { funding_source_id: fundingSourceIds[0], amount: 8500, description: "Cloud computing credits - AWS & GCP", category: "Software & Services", expenditure_date: daysAgo(45), receipt_number: "CC-2025-012", user_id: user.id },
            { funding_source_id: fundingSourceIds[0], amount: 3200, description: "Conference travel - SIGCSE 2025", category: "Travel", expenditure_date: daysAgo(90), receipt_number: "TRV-2025-003", user_id: user.id },
            { funding_source_id: fundingSourceIds[1], amount: 4250, description: "Lab workstation upgrades (RAM + SSD)", category: "Equipment", expenditure_date: daysAgo(30), receipt_number: "PO-2025-088", user_id: user.id },
            { funding_source_id: fundingSourceIds[1], amount: 1800, description: "Software licenses - JetBrains, MATLAB", category: "Software & Services", expenditure_date: daysAgo(15), receipt_number: "SW-2025-022", user_id: user.id },
            { funding_source_id: fundingSourceIds[2], amount: 12000, description: "Graduate RA - LLM tutoring project", category: "Personnel", expenditure_date: daysAgo(50), user_id: user.id },
            { funding_source_id: fundingSourceIds[2], amount: 5500, description: "GCP API credits for LLM inference", category: "Software & Services", expenditure_date: daysAgo(20), user_id: user.id },
            { funding_source_id: fundingSourceIds[3], amount: 9800, description: "10× Dell Optiplex workstations", category: "Equipment", expenditure_date: daysAgo(40), receipt_number: "PO-2025-102", user_id: user.id },
            { funding_source_id: fundingSourceIds[3], amount: 4200, description: "IoT sensor kits + Raspberry Pi bundles", category: "Equipment", expenditure_date: daysAgo(25), receipt_number: "PO-2025-115", user_id: user.id },
            { funding_source_id: fundingSourceIds[4], amount: 1740, description: "SIGCSE 2026 registration + travel", category: "Travel", expenditure_date: daysAgo(10), receipt_number: "TRV-2025-009", user_id: user.id },
          ];

          await supabase.from('funding_expenditures').insert(expenditures as any);
          queryClient.invalidateQueries({ queryKey: ['funding_expenditures'] });
        } catch (e) {
          console.error("Error seeding funding expenditures:", e);
        }
      }

      setCurrentSet("");
      window.dispatchEvent(new CustomEvent('seedDataCompleted', { detail: { userId: user.id, results } }));

      const successCount = Object.values(results).filter(r => r.success).length;
      const failureCount = Object.values(results).filter(r => !r.success).length;

      toast({
        title: "Seed operation completed",
        description: `Successfully seeded ${successCount} data sets${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        variant: successCount > 0 ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error("Error during seeding:", error);
      toast({ title: "Seeding failed", description: error.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  }

  // ─── DELETE selected logic ─────────────────────────────────────────────────
  async function deleteSelectedData() {
    if (!user || selectedSets.length === 0) {
      toast({ title: "No data selected", description: "Please select at least one data set to delete", variant: "destructive" });
      return;
    }

    try {
      setIsDeleting(true);
      setProgress(0);
      setSeedResults({});

      const totalSets = selectedSets.length;
      let completedSets = 0;
      const results: { [key: string]: { success: boolean; count: number; error?: string } } = {};

      // Delete expenditures before funding sources to respect foreign keys
      const orderedSets = [...selectedSets].sort((a, b) => {
        if (a === 'fundingSources') return 1;
        if (b === 'fundingSources') return -1;
        return 0;
      });

      for (const setKey of orderedSets) {
        const mockSet = mockDataSets[setKey as keyof typeof mockDataSets];
        const tableName = tableMap[setKey];
        setCurrentSet(`Deleting ${mockSet.name}`);

        try {
          // If deleting funding sources, first delete related expenditures, commitments, reports
          if (setKey === 'fundingSources') {
            await supabase.from('funding_expenditures').delete().eq('user_id', user.id);
            await supabase.from('funding_commitments').delete().eq('user_id', user.id);
            await supabase.from('funding_reports').delete().eq('user_id', user.id);
            queryClient.invalidateQueries({ queryKey: ['funding_expenditures'] });
            queryClient.invalidateQueries({ queryKey: ['funding_commitments'] });
            queryClient.invalidateQueries({ queryKey: ['funding_reports'] });
          }

          // Admin communications use admin_id not user_id
          const filterColumn = setKey === 'adminCommunications' ? 'admin_id' : 'user_id';
          const deleteResult = await supabase.from(tableName as any).delete({ count: 'exact' }).eq(filterColumn, user.id);
          if (deleteResult.error) throw deleteResult.error;

          results[setKey] = { success: true, count: deleteResult.count ?? 0 };
          queryClient.invalidateQueries({ queryKey: [tableName] });
          queryClient.invalidateQueries({ queryKey: [setKey] });
        } catch (error: any) {
          console.error(`Error deleting ${setKey}:`, error);
          results[setKey] = { success: false, count: 0, error: error.message };
        }

        completedSets++;
        setProgress((completedSets / totalSets) * 100);
        setSeedResults({ ...results });
      }

      setCurrentSet("");
      window.dispatchEvent(new CustomEvent('seedDataCompleted', { detail: { userId: user.id, results } }));

      const successCount = Object.values(results).filter(r => r.success).length;
      const totalDeleted = Object.values(results).filter(r => r.success).reduce((sum, r) => sum + r.count, 0);

      toast({ title: "Delete operation completed", description: `Deleted ${totalDeleted} records across ${successCount} tables` });
    } catch (error: any) {
      console.error("Error during deletion:", error);
      toast({ title: "Deletion failed", description: error.message || "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }

  // ─── DELETE ALL mock data (one-click) ─────────────────────────────────────
  async function deleteAllMockData() {
    if (!user) return;

    try {
      setIsDeletingAll(true);
      setProgress(0);
      setCurrentSet("Deleting all mock data...");

      let deletedCount = 0;
      const totalTables = ALL_USER_TABLES.length;

      for (let i = 0; i < ALL_USER_TABLES.length; i++) {
        const table = ALL_USER_TABLES[i];
        setCurrentSet(`Deleting ${table}...`);

        try {
          // admin_communications uses admin_id
          const filterColumn = table === 'admin_communications' ? 'admin_id' : 'user_id';
          const { count } = await supabase.from(table as any).delete({ count: 'exact' }).eq(filterColumn, user.id);
          deletedCount += (count ?? 0);
        } catch (e: any) {
          console.error(`Error deleting ${table}:`, e);
        }

        setProgress(((i + 1) / totalTables) * 100);
      }

      // Invalidate all queries
      queryClient.invalidateQueries();

      setCurrentSet("");
      window.dispatchEvent(new CustomEvent('seedDataCompleted', { detail: { userId: user.id } }));

      toast({
        title: "All mock data deleted",
        description: `Successfully deleted ${deletedCount} records across ${totalTables} tables. Only your admin data was removed.`,
      });
    } catch (error: any) {
      console.error("Error during delete all:", error);
      toast({ title: "Delete all failed", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingAll(false);
      setProgress(0);
    }
  }

  // ─── Selection helpers ─────────────────────────────────────────────────────
  const handleSetSelection = (setKey: string, checked: boolean) => {
    if (checked) {
      setSelectedSets(prev => [...prev, setKey]);
    } else {
      setSelectedSets(prev => prev.filter(key => key !== setKey));
    }
  };

  const selectAllSets = () => setSelectedSets(Object.keys(mockDataSets));
  const clearSelection = () => setSelectedSets([]);
  const resetResults = () => { setSeedResults({}); setProgress(0); setCurrentSet(""); };

  const isBusy = isSeeding || isDeleting || isDeletingAll;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Admin Seed Data Manager
        </CardTitle>
        <CardDescription>
          Generate realistic demo data for presentations and testing. Data is scoped to your account only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This tool creates realistic academic data (tasks, meetings, grants, supplies, achievements, communications, etc.) to demonstrate platform capabilities. Only your account is affected.
          </AlertDescription>
        </Alert>

        {/* ── Delete All Mock Data (prominent) ── */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              disabled={isBusy}
            >
              {isDeletingAll ? (
                <><Zap className="h-4 w-4 mr-2 animate-spin" />Deleting All Data...</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" />Delete All Mock Data (One-Click Cleanup)</>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete All Mock Data
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>all your data</strong> across every table (notes, meetings, supplies, expenses, funding, achievements, communications, shopping list, planning events, and more). 
                <br /><br />
                <strong>Only your admin account data is affected</strong> - no other user accounts will be touched. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAllMockData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Yes, Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Select Data Sets</h4>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={selectAllSets}>Select All</Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>Clear</Button>
              <Button variant="outline" size="sm" onClick={resetResults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(mockDataSets).map(([key, set]) => (
              <div
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSets.includes(key) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleSetSelection(key, !selectedSets.includes(key))}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox checked={selectedSets.includes(key)} onChange={() => {}} />
                      <h5 className="font-medium text-sm">{set.name}</h5>
                      <Badge variant="secondary" className="text-xs">{set.count} items</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{set.description}</p>
                    {seedResults[key] && (
                      <div className="flex items-center gap-2">
                        {seedResults[key].success ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success ({seedResults[key].count} items)
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Failed: {seedResults[key].error}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(isBusy) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{currentSet}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Database className="h-4 w-4 mr-2" />
                Preview Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mock Data Preview</DialogTitle>
                <DialogDescription>Preview of the first record in each data set</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {Object.entries(mockDataSets).map(([key, set]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{set.name} ({set.count} items)</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {JSON.stringify(set.data[0], null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={seedSelectedData}
            disabled={isBusy || selectedSets.length === 0 || !user}
            className="flex-1"
          >
            {isSeeding ? (
              <><Zap className="h-4 w-4 mr-2" />Seeding...</>
            ) : (
              <><TestTube className="h-4 w-4 mr-2" />Seed ({selectedSets.length})</>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isBusy || selectedSets.length === 0 || !user}
                className="flex-1"
              >
                {isDeleting ? (
                  <><Zap className="h-4 w-4 mr-2" />Deleting...</>
                ) : (
                  <><Trash2 className="h-4 w-4 mr-2" />Delete ({selectedSets.length})</>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Selected Mock Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>all your data</strong> from the {selectedSets.length} selected table(s). Only your admin account is affected - no other user data will be touched. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSelectedData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Delete Selected Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
