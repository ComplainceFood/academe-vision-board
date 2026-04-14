
// =============================================================================
// Mock Seed Data for AcademeVisionBoard
// =============================================================================
// Context: STEM faculty from diverse backgrounds (Computer Science, Biology,
// Mathematics, Physics, Mechanical Engineering, Data Science, Chemistry).
// Purpose: Platform demonstration and digital media marketing.
//
// To seed: call seedMockData() in the browser console while logged in.
// =============================================================================

// ---------------------------------------------------------------------------
// NOTES & COMMITMENTS
// ---------------------------------------------------------------------------
const mockNotes = [
  // --- Notes ---
  {
    title: "Lab Safety Briefing Reminder",
    content: "Schedule mandatory lab safety briefing for all new BIOL310 students before they begin bench work. Coordinate with the safety officer to book Room 114.",
    type: "note",
    course: "BIOL310",
    tags: ["safety", "lab", "orientation"],
    priority: "high",
    status: "active",
    starred: false
  },
  {
    title: "Update MATH301 Syllabus",
    content: "Revise the Real Analysis syllabus to reflect the new textbook edition. Update problem set numbers and add two additional proof-writing exercises per week.",
    type: "note",
    course: "MATH301",
    tags: ["syllabus", "curriculum"],
    priority: "medium",
    status: "active",
    starred: false
  },
  {
    title: "Python Environment Setup for CS201",
    content: "Students are having trouble with Anaconda installation on Windows 11. Prepare a step-by-step guide and post it to the LMS before next Thursday's lab.",
    type: "note",
    course: "CS201",
    tags: ["setup", "tooling", "python"],
    priority: "high",
    status: "active",
    starred: true
  },
  {
    title: "Spectrophotometer Calibration",
    content: "The UV-Vis spectrophotometer in Lab 204 drifted during last week's CHEM450 session. Submit a service request to the instrumentation center and use the backup unit in the meantime.",
    type: "note",
    course: "CHEM450",
    tags: ["equipment", "maintenance"],
    priority: "medium",
    status: "active",
    starred: false
  },
  {
    title: "Faculty Senate Meeting Notes",
    content: "Key items from the March Faculty Senate: (1) New curriculum review timeline starts May 1. (2) Travel grant applications open April 15. (3) IRB workshop scheduled for April 22.",
    type: "note",
    course: "General",
    tags: ["governance", "faculty-senate"],
    priority: "low",
    status: "active",
    starred: false
  },

  // --- Commitments ---
  {
    title: "Grade Makeup Exam for Aiden Okafor",
    content: "Agreed to administer a makeup midterm for Aiden Okafor (PHYS201) who missed the exam due to a documented medical emergency. Exam must be completed by April 25.",
    type: "commitment",
    course: "PHYS201",
    student_name: "Aiden Okafor",
    tags: ["makeup", "exam", "accommodation"],
    priority: "urgent",
    status: "active",
    starred: true,
    due_date: "2026-04-25"
  },
  {
    title: "Recommendation Letter for Sofia Nguyen",
    content: "Promised to write a graduate school recommendation letter for Sofia Nguyen. She is applying to PhD programs in Computational Biology at three universities. Letter due May 15.",
    type: "commitment",
    course: "Research",
    student_name: "Sofia Nguyen",
    tags: ["recommendation", "graduate-school"],
    priority: "high",
    status: "active",
    starred: true,
    due_date: "2026-05-15"
  },
  {
    title: "Extra Credit Opportunity for CS450",
    content: "Promised to post an optional extra credit assignment on dynamic programming for students who scored below 70 on the midterm. Due posted by this Friday.",
    type: "commitment",
    course: "CS450",
    tags: ["extra-credit", "assignment"],
    priority: "high",
    status: "active",
    starred: false,
    due_date: "2026-04-18"
  },
  {
    title: "Return MECH305 Lab Reports",
    content: "Told students graded lab reports would be returned within 10 days. Batch of 24 reports needs to be graded and uploaded to the portal.",
    type: "commitment",
    course: "MECH305",
    tags: ["grading", "reports"],
    priority: "high",
    status: "active",
    starred: false,
    due_date: "2026-04-22"
  },
  {
    title: "Share Neural Network Reading List",
    content: "Promised Marcus Chen a curated reading list on deep learning architectures to support his independent study on convolutional neural networks.",
    type: "commitment",
    course: "Independent Study",
    student_name: "Marcus Chen",
    tags: ["reading-list", "deep-learning", "mentoring"],
    priority: "medium",
    status: "active",
    starred: false,
    due_date: "2026-04-20"
  },
  {
    title: "Post Lecture Recording for BIOL310",
    content: "Promised to post the recorded lecture on genomics after the projector failed mid-class. Upload to course LMS and notify students via email.",
    type: "commitment",
    course: "BIOL310",
    tags: ["lecture", "recording", "LMS"],
    priority: "urgent",
    status: "active",
    starred: true,
    due_date: "2026-04-15"
  },
  {
    title: "Extended Office Hours Before Finals",
    content: "Agreed to hold two additional office hours sessions per week (Tue and Thu 4-6 PM) during the two weeks before final exams for all enrolled courses.",
    type: "commitment",
    course: "All Courses",
    tags: ["office-hours", "finals"],
    priority: "medium",
    status: "active",
    starred: false,
    due_date: "2026-05-05"
  },

  // --- Reminders ---
  {
    title: "Submit NIH Supplement Progress Report",
    content: "Annual progress report for NIH R15 supplement is due April 30. Gather updated student hours, publications, and budget expenditures from the grants office.",
    type: "reminder",
    course: "Research",
    tags: ["NIH", "grant", "reporting"],
    priority: "urgent",
    status: "active",
    starred: true,
    due_date: "2026-04-30"
  },
  {
    title: "Data Science Capstone Presentation Schedule",
    content: "Remind DATA401 students to sign up for 15-minute capstone presentation slots. Slots available April 28 to May 2. Post scheduling link on LMS today.",
    type: "reminder",
    course: "DATA401",
    tags: ["capstone", "presentations", "scheduling"],
    priority: "medium",
    status: "active",
    starred: false,
    due_date: "2026-04-17"
  },
  {
    title: "Peer Review Deadline for Journal of Applied Mathematics",
    content: "Reviewer deadline for the manuscript on spectral graph theory is April 19. Complete review and submit through the journal portal.",
    type: "reminder",
    course: "Research",
    tags: ["peer-review", "journal", "mathematics"],
    priority: "high",
    status: "active",
    starred: false,
    due_date: "2026-04-19"
  }
];

// ---------------------------------------------------------------------------
// MEETINGS
// ---------------------------------------------------------------------------
const mockMeetings = [
  {
    title: "Research Advising: Dissertation Progress",
    type: "one_on_one",
    status: "scheduled",
    start_date: "2026-04-22",
    start_time: "10:00",
    end_time: "11:00",
    location: "Office 418, Science Building",
    attendees: [
      { name: "Sofia Nguyen", email: "nguyen.sofia@university.edu", status: "accepted", required: true }
    ],
    agenda: "Review Chapter 3 draft on CRISPR off-target analysis. Discuss timeline for data collection in Summer.",
    action_items: [],
    attachments: [],
    is_recurring: false
  },
  {
    title: "CS201 Office Hours",
    type: "office_hours",
    status: "scheduled",
    start_date: "2026-04-17",
    start_time: "14:00",
    end_time: "15:30",
    location: "Zoom (link in syllabus)",
    attendees: [],
    agenda: "Open Q&A on Python functions, loops, and the upcoming Project 2 requirements.",
    action_items: [],
    attachments: [],
    is_recurring: true,
    recurring_pattern: "weekly"
  },
  {
    title: "Undergraduate Research Symposium Planning",
    type: "committee",
    status: "scheduled",
    start_date: "2026-04-24",
    start_time: "13:00",
    end_time: "14:00",
    location: "Conference Room B, Admin Building",
    attendees: [
      { name: "Dr. Priya Krishnamurthy", email: "krishnamurthy@university.edu", status: "accepted", required: true },
      { name: "Dr. James Osei", email: "osei@university.edu", status: "accepted", required: true },
      { name: "Dr. Rachel Torres", email: "torres@university.edu", status: "pending", required: false }
    ],
    agenda: "Finalize judging rubric, assign faculty judges to poster sessions, confirm AV equipment needs.",
    action_items: [],
    attachments: [],
    is_recurring: false
  },
  {
    title: "Capstone Project Check-in: Team Delta",
    type: "group",
    status: "completed",
    start_date: "2026-04-14",
    start_time: "09:00",
    end_time: "09:45",
    location: "Engineering Lab 110",
    attendees: [
      { name: "Marcus Chen", email: "chen.marcus@university.edu", status: "accepted", required: true },
      { name: "Aisha Patel", email: "patel.aisha@university.edu", status: "accepted", required: true },
      { name: "Liam Obafemi", email: "obafemi.liam@university.edu", status: "accepted", required: true }
    ],
    agenda: "Demo working prototype of the predictive maintenance ML model. Review remaining milestones.",
    notes: "Team demonstrated a functional decision tree classifier with 87% accuracy on the test set. Integration with the sensor API is still pending. Agreed to push the API integration deadline by 3 days due to library compatibility issues.",
    action_items: [
      { id: "ai-1", description: "Marcus to resolve pandas version conflict with the sensor SDK", assignee: "Marcus Chen", due_date: "2026-04-17", completed: false, created_at: new Date().toISOString() },
      { id: "ai-2", description: "Aisha to update the project report with current accuracy metrics", assignee: "Aisha Patel", due_date: "2026-04-18", completed: false, created_at: new Date().toISOString() }
    ],
    attachments: [],
    is_recurring: false
  },
  {
    title: "Curriculum Committee: CS Program Review",
    type: "committee",
    status: "completed",
    start_date: "2026-04-10",
    start_time: "11:00",
    end_time: "12:30",
    location: "Faculty Lounge, Merrill Hall",
    attendees: [
      { name: "Dr. Priya Krishnamurthy", email: "krishnamurthy@university.edu", status: "accepted", required: true },
      { name: "Dr. Yusuf Al-Rashid", email: "alrashid@university.edu", status: "accepted", required: true }
    ],
    notes: "Committee approved adding a Data Structures prerequisite to CS450. Voted 4-1 to pilot the new AI Ethics elective in Fall. Action item: update the catalog description before May 1 deadline.",
    action_items: [
      { id: "ai-3", description: "Update CS450 catalog prerequisites before May 1", assignee: "Self", due_date: "2026-05-01", completed: false, created_at: new Date().toISOString() }
    ],
    attachments: [],
    is_recurring: false
  },
  {
    title: "PHYS201 Lecture: Electromagnetism Q&A",
    type: "lecture",
    status: "scheduled",
    start_date: "2026-04-18",
    start_time: "08:00",
    end_time: "09:15",
    location: "Auditorium 101, Science Building",
    attendees: [],
    agenda: "Review Gauss's Law applications. Work through three practice problems on electric flux. Preview the upcoming lab on field mapping.",
    action_items: [],
    attachments: [],
    is_recurring: false
  },
  {
    title: "Independent Study Check-in: Marcus Chen",
    type: "one_on_one",
    status: "scheduled",
    start_date: "2026-04-21",
    start_time: "15:00",
    end_time: "15:45",
    location: "Office 418, Science Building",
    attendees: [
      { name: "Marcus Chen", email: "chen.marcus@university.edu", status: "accepted", required: true }
    ],
    agenda: "Review progress on CNN literature survey. Discuss findings from the Krizhevsky et al. (2012) paper. Set milestones for model implementation phase.",
    action_items: [],
    attachments: [],
    is_recurring: false
  }
];

// ---------------------------------------------------------------------------
// SUPPLIES / INVENTORY
// ---------------------------------------------------------------------------
const mockSupplies = [
  {
    name: "Whiteboard Markers (Assorted Colors)",
    category: "Office Supplies",
    course: "All Courses",
    current_count: 14,
    total_count: 60,
    threshold: 10,
    cost: 2.49,
    last_restocked: "2026-03-10"
  },
  {
    name: "Raspberry Pi 4 Model B Kits",
    category: "Lab Equipment",
    course: "CS201",
    current_count: 9,
    total_count: 20,
    threshold: 6,
    cost: 79.00,
    last_restocked: "2026-02-14"
  },
  {
    name: "Safety Goggles",
    category: "Lab Safety",
    course: "CHEM450",
    current_count: 22,
    total_count: 35,
    threshold: 10,
    cost: 7.50,
    last_restocked: "2026-01-20"
  },
  {
    name: "Nitrile Gloves (Box of 100, Medium)",
    category: "Lab Safety",
    course: "BIOL310",
    current_count: 3,
    total_count: 10,
    threshold: 3,
    cost: 18.99,
    last_restocked: "2026-03-01"
  },
  {
    name: "Engineering Graph Paper Pads",
    category: "Office Supplies",
    course: "MECH305",
    current_count: 28,
    total_count: 50,
    threshold: 10,
    cost: 3.99,
    last_restocked: "2026-03-18"
  },
  {
    name: "USB-C to HDMI Adapters",
    category: "Lab Equipment",
    course: "CS450",
    current_count: 5,
    total_count: 12,
    threshold: 4,
    cost: 22.00,
    last_restocked: "2026-02-28"
  },
  {
    name: "Molecular Model Kits",
    category: "Lab Equipment",
    course: "CHEM450",
    current_count: 18,
    total_count: 30,
    threshold: 8,
    cost: 34.50,
    last_restocked: "2026-01-08"
  },
  {
    name: "Lab Notebooks (Quad-ruled, 100 pages)",
    category: "Office Supplies",
    course: "BIOL310",
    current_count: 11,
    total_count: 40,
    threshold: 8,
    cost: 8.25,
    last_restocked: "2026-02-05"
  }
];

// ---------------------------------------------------------------------------
// EXPENSES
// ---------------------------------------------------------------------------
const mockExpenses = [
  {
    description: "IEEE ICCV 2026 Conference Registration",
    amount: 450.00,
    date: "2026-03-15",
    category: "Professional Development",
    course: "CS450",
    receipt: true
  },
  {
    description: "Replacement Micropipette Set (BIOL310 Lab)",
    amount: 312.40,
    date: "2026-03-22",
    category: "Equipment",
    course: "BIOL310",
    receipt: true
  },
  {
    description: "Introduction to Machine Learning Textbooks (x5)",
    amount: 274.75,
    date: "2026-04-01",
    category: "Materials",
    course: "DATA401",
    receipt: true
  },
  {
    description: "Student Research Symposium Refreshments",
    amount: 95.80,
    date: "2026-04-11",
    category: "Events",
    course: "Research",
    receipt: false
  },
  {
    description: "Printer Toner Cartridges (x3)",
    amount: 74.97,
    date: "2026-03-28",
    category: "Office Supplies",
    course: "All Courses",
    receipt: true
  },
  {
    description: "Arduino Uno Starter Kits for MECH305 Lab (x8)",
    amount: 199.92,
    date: "2026-02-20",
    category: "Equipment",
    course: "MECH305",
    receipt: true
  },
  {
    description: "Subscription: MATLAB Campus License Renewal (Pro-rated Share)",
    amount: 185.00,
    date: "2026-01-15",
    category: "Software",
    course: "MATH301",
    receipt: true
  },
  {
    description: "Travel Reimbursement: NSF Site Visit (Airfare + Hotel)",
    amount: 862.33,
    date: "2026-03-10",
    category: "Travel",
    course: "Research",
    receipt: true
  }
];

// ---------------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------------
const mockAchievements = [
  {
    category: "publication",
    title: "Attention Mechanisms in Low-Resource NLP: A Systematic Review",
    description: "A comprehensive review of transformer-based attention mechanisms applied to under-resourced languages, covering 87 papers from 2018 to 2025.",
    journal_name: "Journal of Artificial Intelligence Research",
    date: "2026-01-15",
    co_authors: ["Sofia Nguyen", "Dr. Yusuf Al-Rashid"],
    status: "published",
    visibility: "public",
    tags: ["NLP", "deep-learning", "transformers"],
    impact_factor: 5.2
  },
  {
    category: "publication",
    title: "Thermal Conductivity Modeling of Nanocomposite Materials Using Finite Element Analysis",
    description: "Developed a validated FEA model predicting thermal properties of graphene-polymer nanocomposites with less than 4% error versus experimental results.",
    journal_name: "Computational Materials Science",
    date: "2025-09-30",
    co_authors: ["Liam Obafemi"],
    status: "published",
    visibility: "public",
    tags: ["FEA", "nanocomposites", "thermal-modeling"],
    impact_factor: 3.8
  },
  {
    category: "research_presentation",
    title: "Predicting Student At-Risk Status Using Gradient Boosting on LMS Interaction Logs",
    description: "Presented early warning system model achieving 91% recall on identifying at-risk students three weeks before final exams.",
    venue: "EDUCAUSE Annual Conference, San Antonio, TX",
    date: "2025-10-22",
    co_authors: ["Marcus Chen"],
    status: "completed",
    visibility: "public",
    tags: ["learning-analytics", "machine-learning", "education"]
  },
  {
    category: "research_presentation",
    title: "CRISPR Off-Target Profiling in Human iPSC Lines",
    description: "Poster presentation on a novel bioinformatics pipeline for identifying CRISPR Cas9 off-target edits with higher sensitivity than current gold-standard methods.",
    venue: "American Society of Cell Biology Annual Meeting, Washington, DC",
    date: "2025-12-03",
    co_authors: ["Sofia Nguyen", "Aisha Patel"],
    status: "completed",
    visibility: "public",
    tags: ["CRISPR", "bioinformatics", "genomics"]
  },
  {
    category: "invited_talk",
    title: "Responsible AI in Academic Research: Opportunities and Ethical Frameworks",
    description: "Keynote invited by the university honors program to address 200+ students and faculty on ethical implications of generative AI in scholarly work.",
    venue: "University Honors Colloquium, Spring 2026",
    date: "2026-02-18",
    status: "completed",
    visibility: "public",
    tags: ["AI-ethics", "keynote", "generative-AI"]
  },
  {
    category: "leadership_role",
    title: "Chair, Computer Science Curriculum Committee",
    description: "Leading a committee of six faculty members in a full BS program review to align curriculum with ABET accreditation criteria and industry hiring trends.",
    organization: "Department of Computer Science",
    date: "2025-08-15",
    status: "in_progress",
    visibility: "public",
    tags: ["ABET", "curriculum", "leadership"]
  },
  {
    category: "course_taught",
    title: "CS450: Advanced Algorithms",
    description: "Upper-division course covering algorithm design paradigms, complexity theory, approximation algorithms, and randomized methods.",
    term: "Spring 2026",
    student_count: 32,
    course_code: "CS450",
    status: "in_progress",
    visibility: "public",
    tags: ["algorithms", "theory"]
  },
  {
    category: "course_taught",
    title: "DATA401: Machine Learning and Data Science Capstone",
    description: "Interdisciplinary capstone integrating machine learning, statistical modeling, and domain-specific data projects for senior undergraduates.",
    term: "Spring 2026",
    student_count: 28,
    course_code: "DATA401",
    status: "in_progress",
    visibility: "public",
    tags: ["machine-learning", "capstone", "data-science"]
  },
  {
    category: "award_honor",
    title: "College of Engineering and Science Excellence in Teaching Award",
    description: "Nominated and selected by student and faculty committee for outstanding instructional clarity, accessibility, and student outcomes across three consecutive semesters.",
    organization: "College of Engineering and Science",
    award_type: "Teaching Award",
    date: "2025-05-10",
    status: "completed",
    visibility: "public",
    tags: ["teaching", "award"]
  },
  {
    category: "service_review",
    title: "Peer Reviewer, Journal of Applied Mathematics",
    description: "Completed three manuscript reviews on topics including spectral graph theory, numerical PDE methods, and combinatorial optimization.",
    organization: "Journal of Applied Mathematics",
    review_count: 3,
    date: "2026-04-01",
    status: "completed",
    visibility: "public",
    tags: ["peer-review", "service", "mathematics"]
  },
  {
    category: "student_supervision",
    title: "PhD Dissertation Advisor: Sofia Nguyen",
    description: "Primary advisor for dissertation on computational genomics. Student is in Year 2, expected defense date Fall 2027.",
    student_name: "Sofia Nguyen",
    student_level: "phd",
    date: "2024-08-20",
    status: "in_progress",
    visibility: "public",
    tags: ["PhD", "advising", "genomics"]
  },
  {
    category: "student_supervision",
    title: "Undergraduate Honors Thesis Mentor: Marcus Chen",
    description: "Mentoring an undergraduate honors thesis on efficient training of CNNs for edge deployment. Thesis defense scheduled for May 2026.",
    student_name: "Marcus Chen",
    student_level: "undergraduate",
    date: "2025-09-01",
    status: "in_progress",
    visibility: "public",
    tags: ["undergraduate", "honors-thesis", "deep-learning"]
  },
  {
    category: "teaching_performance",
    title: "CS450 Student Evaluation Summary",
    description: "End-of-semester teaching evaluation results for Advanced Algorithms, Fall 2025.",
    term: "Fall 2025",
    evaluation_score: 4.7,
    course_code: "CS450",
    student_count: 30,
    date: "2025-12-20",
    status: "completed",
    visibility: "private",
    tags: ["evaluation", "feedback"]
  },
  {
    category: "professional_development",
    title: "NSF Faculty Early Career Development (CAREER) Proposal Workshop",
    description: "Two-day intensive workshop on crafting competitive NSF CAREER proposals, including budget preparation, broader impacts, and review panel expectations.",
    venue: "National Science Foundation, Washington, DC",
    date: "2025-11-07",
    status: "completed",
    visibility: "public",
    tags: ["NSF", "CAREER", "grant-writing"]
  },
  {
    category: "external_impact",
    title: "Guest Lecture Series: Women in STEM High School Outreach",
    description: "Delivered four guest lectures to high school students on careers in computer science and data science, reaching 140 students across three schools in the region.",
    organization: "Regional STEM Outreach Consortium",
    date: "2026-03-01",
    status: "completed",
    visibility: "public",
    tags: ["outreach", "K12", "STEM", "diversity"]
  }
];

// ---------------------------------------------------------------------------
// FUNDING SOURCES
// ---------------------------------------------------------------------------
const mockFundingSources = [
  {
    name: "NSF CAREER Award: Adaptive Learning Systems for STEM Education",
    type: "grant",
    total_amount: 575000.00,
    remaining_amount: 398200.00,
    start_date: "2024-09-01",
    end_date: "2029-08-31",
    status: "active",
    description: "Five-year NSF CAREER grant supporting research on personalized learning algorithms for STEM courses and mentorship of underrepresented undergraduate researchers.",
    restrictions: "Funds may not be used for indirect costs exceeding the negotiated rate. Equipment purchases over $5,000 require prior approval.",
    contact_person: "Dr. Angela Wu",
    contact_email: "awu@nsf.gov",
    reporting_requirements: "Annual progress reports due August 31. Cumulative budget justification required with each report."
  },
  {
    name: "NIH R15 Academic Research Enhancement Award",
    type: "grant",
    total_amount: 300000.00,
    remaining_amount: 87450.00,
    start_date: "2023-06-01",
    end_date: "2026-05-31",
    status: "active",
    description: "NIH R15 supporting undergraduate involvement in CRISPR-based gene editing research in model organisms.",
    restrictions: "At least 50% of direct costs must support student salary or supplies directly used by students.",
    contact_person: "Ms. Renata Flores",
    contact_email: "rflores@nih.gov",
    reporting_requirements: "Annual RPPRs due April 15. Final report due 90 days after end date."
  },
  {
    name: "University Faculty Research Development Fund",
    type: "budget_allocation",
    total_amount: 8000.00,
    remaining_amount: 2350.00,
    start_date: "2025-09-01",
    end_date: "2026-08-31",
    status: "active",
    description: "Internal seed funding allocated by the Office of Research to support pilot studies and conference travel.",
    restrictions: "Cannot be used for faculty salary support. Travel reimbursements require receipts within 30 days.",
    contact_person: "Office of Research",
    contact_email: "research@university.edu",
    reporting_requirements: "Annual expenditure summary due August 15."
  },
  {
    name: "Industry Partnership: DataStream Analytics Research Collaboration",
    type: "donation",
    total_amount: 50000.00,
    remaining_amount: 32500.00,
    start_date: "2025-01-01",
    end_date: "2026-12-31",
    status: "active",
    description: "Unrestricted research collaboration gift from DataStream Analytics to support data science capstone projects and student internship pipeline development.",
    restrictions: "No restrictions. Publication rights retained by the university.",
    contact_person: "Ms. Theresa Kim",
    contact_email: "tkim@datastreamanalytics.com",
    reporting_requirements: "Informal progress briefing to company liaison each semester."
  }
];

// ---------------------------------------------------------------------------
// PLANNING EVENTS
// ---------------------------------------------------------------------------
const mockPlanningEvents = [
  {
    title: "Final Exam: CS450 Advanced Algorithms",
    date: "2026-05-06",
    time: "08:00",
    end_time: "11:00",
    type: "exam",
    course: "CS450",
    description: "Three-hour comprehensive final exam. Proctored in Auditorium 101. Submit grades within 72 hours.",
    priority: "urgent",
    completed: false,
    location: "Auditorium 101"
  },
  {
    title: "DATA401 Capstone Presentations",
    date: "2026-04-29",
    time: "13:00",
    end_time: "17:00",
    type: "presentation",
    course: "DATA401",
    description: "All eight capstone teams present 15-minute demos followed by Q&A. Invite industry partners from DataStream Analytics.",
    priority: "high",
    completed: false,
    location: "Engineering Conference Room A"
  },
  {
    title: "NSF CAREER Progress Report Submission",
    date: "2026-04-30",
    time: "17:00",
    end_time: "17:30",
    type: "deadline",
    course: "Research",
    description: "Submit Year 2 annual progress report via Research.gov. Coordinate with grants office by April 25.",
    priority: "urgent",
    completed: false,
    location: "Online (Research.gov)"
  },
  {
    title: "BIOL310 Field Trip: Wetland Ecology Survey",
    date: "2026-04-26",
    time: "09:00",
    end_time: "14:00",
    type: "field_trip",
    course: "BIOL310",
    description: "Annual wetland survey at Beaver Creek Nature Reserve. Coordinate transportation vans and check wader equipment inventory.",
    priority: "medium",
    completed: false,
    location: "Beaver Creek Nature Reserve"
  },
  {
    title: "Department Colloquium Presentation",
    date: "2026-04-25",
    time: "15:00",
    end_time: "16:00",
    type: "presentation",
    course: "Research",
    description: "Present latest findings on adaptive learning systems to department faculty and graduate students.",
    priority: "high",
    completed: false,
    location: "Science Hall 202"
  },
  {
    title: "MATH301 Midterm Grading Complete",
    date: "2026-04-21",
    time: "17:00",
    end_time: "17:30",
    type: "deadline",
    course: "MATH301",
    description: "Return graded midterms to students within 7 days per department policy.",
    priority: "high",
    completed: false,
    location: "Office"
  },
  {
    title: "Faculty Mentor Training Workshop",
    date: "2026-05-02",
    time: "09:30",
    end_time: "12:00",
    type: "workshop",
    course: "General",
    description: "Required training for research mentors funded through NSF. Covers inclusive mentoring practices and IRB updates.",
    priority: "medium",
    completed: false,
    location: "Admin Building, Room 105"
  }
];

// ---------------------------------------------------------------------------
// FUTURE TASKS (Planning Board)
// ---------------------------------------------------------------------------
const mockFutureTasks = [
  {
    title: "Develop new CS elective: Introduction to Quantum Computing",
    semester: "Fall 2026",
    priority: "high",
    estimated_hours: 80
  },
  {
    title: "Submit NSF CAREER Year 3 project modification request",
    semester: "Fall 2026",
    priority: "urgent",
    estimated_hours: 20
  },
  {
    title: "Revise DATA401 course to include Large Language Model project track",
    semester: "Fall 2026",
    priority: "medium",
    estimated_hours: 40
  },
  {
    title: "Mentor undergraduate team for ACM ICPC regional competition",
    semester: "Fall 2026",
    priority: "medium",
    estimated_hours: 30
  },
  {
    title: "Write and submit journal paper on adaptive assessment systems",
    semester: "Spring 2027",
    priority: "high",
    estimated_hours: 120
  },
  {
    title: "Apply for university teaching innovation grant",
    semester: "Spring 2027",
    priority: "medium",
    estimated_hours: 25
  },
  {
    title: "Launch STEM K-12 outreach partnership with two new high schools",
    semester: "Spring 2027",
    priority: "low",
    estimated_hours: 35
  }
];

// =============================================================================
// SEED FUNCTION
// =============================================================================
async function seedMockData() {
  const { supabase } = window;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("You must be logged in to seed data.");
    return;
  }

  console.log("Starting mock data seed for user:", user.email);

  const uid = user.id;
  const now = new Date().toISOString();

  // Prepare records
  const notes = mockNotes.map(n => ({ ...n, user_id: uid, created_at: now, updated_at: now }));
  const meetings = mockMeetings.map(m => ({ ...m, user_id: uid, created_at: now, updated_at: now }));
  const supplies = mockSupplies.map(s => ({ ...s, user_id: uid }));
  const expenses = mockExpenses.map(e => ({ ...e, user_id: uid }));
  const achievements = mockAchievements.map(a => ({ ...a, user_id: uid, created_at: now, updated_at: now }));
  const fundingSources = mockFundingSources.map(f => ({ ...f, user_id: uid, created_at: now, updated_at: now }));
  const planningEvents = mockPlanningEvents.map(e => ({ ...e, user_id: uid, created_at: now }));
  const futureTasks = mockFutureTasks.map(t => ({ ...t, user_id: uid, created_at: now }));

  const results = await Promise.all([
    supabase.from('notes').insert(notes),
    supabase.from('meetings').insert(meetings),
    supabase.from('supplies').insert(supplies),
    supabase.from('expenses').insert(expenses),
    supabase.from('scholastic_achievements').insert(achievements),
    supabase.from('funding_sources').insert(fundingSources),
    supabase.from('planning_events').insert(planningEvents),
    supabase.from('future_tasks').insert(futureTasks),
  ]);

  const tableNames = ['notes', 'meetings', 'supplies', 'expenses', 'achievements', 'funding_sources', 'planning_events', 'future_tasks'];
  const errors = results
    .map((r, i) => r.error ? `${tableNames[i]}: ${r.error.message}` : null)
    .filter(Boolean);

  if (errors.length > 0) {
    console.error("Errors during seeding:", errors.join('\n'));
  } else {
    console.log("All mock data seeded successfully!");
    console.table(tableNames.map((name, i) => ({
      table: name,
      status: results[i].error ? 'ERROR' : 'OK',
      records: [notes, meetings, supplies, expenses, achievements, fundingSources, planningEvents, futureTasks][i].length
    })));
  }
}

// Call seedMockData() in the browser console when logged in.
