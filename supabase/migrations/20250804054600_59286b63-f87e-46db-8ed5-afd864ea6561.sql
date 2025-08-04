-- Fix security issue: Set search_path for the seed function
DROP FUNCTION IF EXISTS seed_demo_data(UUID);

CREATE OR REPLACE FUNCTION seed_demo_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    funding_source_id UUID;
BEGIN
  -- Insert user profile
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name, email, phone, department, position, bio, office_location)
  VALUES (
    target_user_id,
    'Dr. Sarah Johnson',
    'Sarah',
    'Johnson', 
    'sarah.johnson@university.edu',
    '+1-555-0123',
    'Computer Science',
    'Associate Professor',
    'Associate Professor specializing in Machine Learning and Data Science. Teaching CS101, CS202, and CS404.',
    'Science Building, Room 302'
  ) ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    bio = EXCLUDED.bio,
    office_location = EXCLUDED.office_location;

  -- Insert notification preferences
  INSERT INTO public.notification_preferences (user_id, email_notifications, task_reminders, meeting_alerts, low_supply_alerts, funding_alerts, email_frequency, reminder_time)
  VALUES (
    target_user_id,
    true,
    true,
    true,
    true,
    true,
    'daily',
    '09:00'
  ) ON CONFLICT (user_id) DO UPDATE SET
    email_notifications = EXCLUDED.email_notifications,
    task_reminders = EXCLUDED.task_reminders,
    meeting_alerts = EXCLUDED.meeting_alerts,
    low_supply_alerts = EXCLUDED.low_supply_alerts,
    funding_alerts = EXCLUDED.funding_alerts;

  -- Seed Notes & Commitments (varied types, statuses, and timestamps)
  INSERT INTO public.notes (user_id, title, content, type, course, student_name, tags, priority, status, due_date, starred, created_at, updated_at) VALUES
  (target_user_id, 'Project Extension Promise', 'Promised 2-week extension for final project to students who attended the workshop due to technical difficulties during class.', 'commitment', 'CS101', NULL, ARRAY['extension', 'project', 'promise'], 'high', 'active', '2025-03-15 23:59:59', true, '2025-01-20 10:30:00', '2025-01-20 10:30:00'),
  (target_user_id, 'Research Mentoring Commitment', 'Committed to reviewing Jane Smith''s research proposal on neural networks by Friday and providing detailed feedback.', 'commitment', 'Research', 'Jane Smith', ARRAY['research', 'mentoring', 'deadline'], 'urgent', 'active', '2025-02-07 17:00:00', true, '2025-02-03 14:15:00', '2025-02-03 14:15:00'),
  (target_user_id, 'Lab Equipment Order', 'Need to order 5 more Raspberry Pi kits for the robotics lab. Budget approved, just need to process the order by Monday.', 'note', 'CS202', NULL, ARRAY['supplies', 'lab', 'order'], 'medium', 'active', '2025-02-10 09:00:00', false, '2025-02-05 11:20:00', '2025-02-05 11:20:00'),
  (target_user_id, 'Midterm Format Change', 'Agreed to change midterm format to include more practical coding problems after student feedback survey results.', 'commitment', 'CS101', NULL, ARRAY['exam', 'format', 'student-feedback'], 'medium', 'completed', NULL, false, '2025-01-15 09:45:00', '2025-01-25 16:30:00'),
  (target_user_id, 'Office Hours Reminder', 'Remember to announce extended office hours during finals week. Students have requested additional support.', 'reminder', 'All Courses', NULL, ARRAY['office-hours', 'finals', 'announcement'], 'low', 'active', '2025-03-01 10:00:00', false, '2025-01-30 13:00:00', '2025-01-30 13:00:00'),
  (target_user_id, 'Conference Paper Deadline', 'Submit paper on "AI in Education" to SIGCSE 2025. Draft is 80% complete, need to finalize results section.', 'reminder', 'Research', NULL, ARRAY['conference', 'paper', 'deadline'], 'urgent', 'active', '2025-02-15 23:59:59', true, '2025-01-10 08:00:00', '2025-02-01 14:45:00'),
  (target_user_id, 'Student Accommodation', 'Promised to provide extended time on exams for Michael Brown due to documented learning disability.', 'commitment', 'CS404', 'Michael Brown', ARRAY['accommodation', 'exam', 'accessibility'], 'high', 'active', NULL, false, '2025-01-22 11:30:00', '2025-01-22 11:30:00'),
  (target_user_id, 'Lecture Recording', 'Promised to post recording of today''s lecture due to technical issues with the projector during class.', 'commitment', 'CS202', NULL, ARRAY['lecture', 'recording', 'technical-issues'], 'high', 'completed', NULL, true, '2025-01-28 15:20:00', '2025-01-29 09:15:00'),
  (target_user_id, 'Guest Speaker Follow-up', 'Follow up with Dr. Martinez about guest lecture on cybersecurity. Need to confirm date and technical requirements.', 'note', 'CS404', NULL, ARRAY['guest-speaker', 'cybersecurity', 'coordination'], 'medium', 'active', '2025-02-20 12:00:00', false, '2025-02-01 16:45:00', '2025-02-01 16:45:00'),
  (target_user_id, 'Grade Appeal Process', 'Review Emily Davis''s grade appeal for CS101 midterm. Schedule meeting to discuss her concerns about question 5.', 'note', 'CS101', 'Emily Davis', ARRAY['grade-appeal', 'meeting', 'review'], 'high', 'active', '2025-02-12 15:00:00', false, '2025-02-08 10:20:00', '2025-02-08 10:20:00'),
  (target_user_id, 'Curriculum Update Planning', 'Plan updates to CS202 curriculum to include more modern frameworks. Research industry trends and update lab exercises.', 'note', 'CS202', NULL, ARRAY['curriculum', 'update', 'planning'], 'low', 'active', '2025-04-01 12:00:00', false, '2025-01-18 14:30:00', '2025-01-18 14:30:00'),
  (target_user_id, 'Summer Research Program', 'Committed to mentoring 3 undergraduate students in the summer research program. Need to prepare project proposals.', 'commitment', 'Research', NULL, ARRAY['summer', 'research', 'mentoring'], 'medium', 'active', '2025-03-15 17:00:00', false, '2025-01-25 11:00:00', '2025-01-25 11:00:00');

  -- Seed Meetings (scheduled, past, cancelled with varied attendees)
  INSERT INTO public.meetings (user_id, title, description, type, status, start_date, start_time, end_time, location, attendees, agenda, notes, action_items, is_recurring, recurring_pattern, reminder_minutes, created_at, updated_at) VALUES
  (target_user_id, 'Academic Advisory - Jane Smith', 'Discuss research progress and upcoming thesis proposal', 'one_on_one', 'completed', '2025-01-25', '14:00:00', '15:00:00', 'Office 302', 
   '[{"name": "Jane Smith", "email": "jane.smith@student.edu", "status": "accepted", "required": true}]'::jsonb,
   'Review thesis outline, discuss methodology, timeline planning',
   'Jane presented excellent progress on neural network research. Methodology is sound and timeline realistic.',
   '[{"id": "1", "description": "Submit literature review by next Friday", "assignee": "Jane Smith", "due_date": "2025-02-07", "completed": false, "created_at": "2025-01-25T14:30:00Z"}]'::jsonb,
   false, NULL, 15, '2025-01-20 09:00:00', '2025-01-25 15:30:00'),

  (target_user_id, 'Department Meeting', 'Monthly faculty meeting to discuss curriculum changes', 'committee', 'completed', '2025-01-30', '10:00:00', '11:30:00', 'Conference Room A',
   '[{"name": "Dr. Anderson", "email": "anderson@university.edu", "status": "accepted", "required": true}, {"name": "Prof. Williams", "email": "williams@university.edu", "status": "accepted", "required": true}, {"name": "Dr. Chen", "email": "chen@university.edu", "status": "declined", "required": false}]'::jsonb,
   'Curriculum updates, budget review, new hiring discussion',
   'Approved CS curriculum updates. Budget looks good for next semester. Need to start hiring process for new position.',
   '[{"id": "2", "description": "Finalize job posting for new faculty position", "assignee": "Dr. Anderson", "due_date": "2025-02-15", "completed": false, "created_at": "2025-01-30T11:00:00Z"}]'::jsonb,
   true, 'monthly', 30, '2025-01-25 08:30:00', '2025-01-30 12:00:00'),

  (target_user_id, 'Project Guidance - Michael Brown', 'Review senior project progress and provide guidance', 'one_on_one', 'scheduled', '2025-02-08', '15:30:00', '16:15:00', 'Lab 204',
   '[{"name": "Michael Brown", "email": "michael.brown@student.edu", "status": "accepted", "required": true}]'::jsonb,
   'Discuss machine learning project implementation, address any challenges',
   NULL, '[]'::jsonb, false, NULL, 15, '2025-02-05 10:20:00', '2025-02-05 10:20:00'),

  (target_user_id, 'Office Hours - Multiple Students', 'Regular office hours for CS101 students', 'office_hours', 'completed', '2025-02-01', '13:00:00', '15:00:00', 'Office 302',
   '[{"name": "Emily Davis", "email": "emily.davis@student.edu", "status": "accepted", "required": false}, {"name": "Robert Wilson", "email": "robert.wilson@student.edu", "status": "accepted", "required": false}]'::jsonb,
   'Help with assignment questions, review concepts from last lecture',
   'Helped 4 students with various questions. Most common issue was understanding recursion concepts.',
   '[]'::jsonb, true, 'weekly', 10, '2025-01-28 12:00:00', '2025-02-01 15:30:00'),

  (target_user_id, 'Thesis Defense - Sarah Kim', 'PhD thesis defense on Natural Language Processing', 'committee', 'scheduled', '2025-02-15', '09:00:00', '11:00:00', 'Auditorium B',
   '[{"name": "Sarah Kim", "email": "sarah.kim@phd.edu", "status": "accepted", "required": true}, {"name": "Dr. Thompson", "email": "thompson@university.edu", "status": "accepted", "required": true}, {"name": "Prof. Lee", "email": "lee@university.edu", "status": "pending", "required": true}]'::jsonb,
   'Thesis presentation, Q&A session, deliberation',
   NULL, '[]'::jsonb, false, NULL, 60, '2025-01-15 14:00:00', '2025-01-15 14:00:00'),

  (target_user_id, 'Grant Review Meeting', 'Review NSF grant proposal before submission', 'group', 'cancelled', '2025-02-03', '14:00:00', '16:00:00', 'Online (Zoom)',
   '[{"name": "Dr. Martinez", "email": "martinez@university.edu", "status": "declined", "required": true}, {"name": "Prof. Taylor", "email": "taylor@university.edu", "status": "accepted", "required": false}]'::jsonb,
   'Review grant proposal, discuss budget allocations, finalize submission',
   'Meeting cancelled due to Dr. Martinez being unavailable. Rescheduled to next week.',
   '[]'::jsonb, false, NULL, 30, '2025-01-28 11:00:00', '2025-02-02 16:45:00');

  -- Seed Supplies (various categories and stock levels)
  INSERT INTO public.supplies (user_id, name, category, course, current_count, total_count, threshold, cost, last_restocked) VALUES
  (target_user_id, 'Whiteboard Markers (Blue)', 'Office Supplies', 'All Courses', 8, 50, 10, 2.99, '2025-01-15 10:00:00'),
  (target_user_id, 'Whiteboard Markers (Red)', 'Office Supplies', 'All Courses', 15, 50, 10, 2.99, '2025-01-15 10:00:00'),
  (target_user_id, 'Raspberry Pi 4 Kits', 'Lab Equipment', 'CS202', 3, 15, 5, 75.00, '2024-12-10 14:30:00'),
  (target_user_id, 'Arduino Uno Boards', 'Lab Equipment', 'CS202', 12, 20, 8, 35.00, '2025-01-20 09:15:00'),
  (target_user_id, 'USB Flash Drives (32GB)', 'Lab Equipment', 'CS101', 25, 40, 15, 12.50, '2025-01-05 11:20:00'),
  (target_user_id, 'Lab Manuals - Physics 304', 'Books', 'PHYS304', 18, 30, 10, 24.99, '2024-12-15 13:45:00'),
  (target_user_id, 'Graph Paper Notepads', 'Office Supplies', 'MATH201', 22, 50, 15, 3.49, '2025-01-25 08:30:00'),
  (target_user_id, 'Printer Paper (Reams)', 'Office Supplies', 'All Courses', 5, 20, 8, 8.99, '2025-01-10 16:00:00'),
  (target_user_id, 'Ethernet Cables (Cat6)', 'Lab Equipment', 'CS404', 7, 25, 10, 15.99, '2024-11-30 10:45:00'),
  (target_user_id, 'Sticky Notes (Assorted)', 'Office Supplies', 'All Courses', 30, 100, 25, 1.99, '2025-01-28 12:15:00'),
  (target_user_id, 'Breadboards', 'Lab Equipment', 'CS202', 4, 30, 12, 8.50, '2024-12-20 14:20:00'),
  (target_user_id, 'Resistor Kits', 'Lab Equipment', 'CS202', 15, 25, 8, 12.99, '2025-01-12 09:30:00');

  -- Seed Expenses (categorized with receipts and varied amounts)
  INSERT INTO public.expenses (user_id, description, amount, date, category, course, receipt) VALUES
  (target_user_id, 'Conference Registration - SIGCSE 2025', 299.99, '2025-01-20 10:30:00', 'Professional Development', 'Research', true),
  (target_user_id, 'Lab Equipment - Raspberry Pi Kits', 450.00, '2024-12-10 14:30:00', 'Equipment', 'CS202', true),
  (target_user_id, 'Reference Books - Machine Learning Textbooks', 156.45, '2025-01-15 11:20:00', 'Materials', 'CS404', true),
  (target_user_id, 'Workshop Refreshments', 87.50, '2025-01-18 15:45:00', 'Events', 'CS101', false),
  (target_user_id, 'Printer Ink Cartridges', 64.99, '2025-01-25 09:15:00', 'Office Supplies', 'All Courses', true),
  (target_user_id, 'Software License - MATLAB', 500.00, '2025-01-08 13:00:00', 'Software', 'MATH201', true),
  (target_user_id, 'Travel - Industry Conference', 1250.75, '2024-12-15 16:30:00', 'Travel', 'Professional Development', true),
  (target_user_id, 'Lab Safety Equipment', 125.30, '2025-01-22 10:45:00', 'Safety', 'CS202', true),
  (target_user_id, 'Guest Speaker Honorarium', 200.00, '2025-01-30 14:20:00', 'Events', 'CS404', false),
  (target_user_id, 'Office Furniture - Ergonomic Chair', 399.99, '2025-01-12 11:00:00', 'Office Supplies', 'All Courses', true);

  -- Seed Shopping List Items
  INSERT INTO public.shopping_list (user_id, name, quantity, priority, notes, purchased) VALUES
  (target_user_id, 'Raspberry Pi 4 Model B', 10, 'high', 'Needed for CS202 lab expansion next semester', false),
  (target_user_id, 'Whiteboard Markers (Assorted Colors)', 20, 'medium', 'Running low on blue and red markers', false),
  (target_user_id, 'USB-C Cables', 15, 'medium', 'For new laptop connectivity in lab', false),
  (target_user_id, 'Backup Hard Drives (2TB)', 3, 'high', 'For critical data backup in research lab', false),
  (target_user_id, 'Coffee for Faculty Lounge', 5, 'low', 'French roast preferred', true),
  (target_user_id, 'Presentation Remote', 2, 'medium', 'Wireless with laser pointer', false);

  -- Seed Planning Events (semester plans, course schedules, calendar events)
  INSERT INTO public.planning_events (user_id, title, description, type, course, date, time, end_time, priority, completed, location, created_at) VALUES
  (target_user_id, 'CS101 - Introduction to Programming', 'Lecture on basic programming concepts', 'lecture', 'CS101', '2025-02-03', '09:00', '10:30', 'high', false, 'Room 101', '2025-01-15 08:00:00'),
  (target_user_id, 'CS101 - Variables and Data Types', 'Continue with variables, data types, and basic operators', 'lecture', 'CS101', '2025-02-05', '09:00', '10:30', 'high', false, 'Room 101', '2025-01-15 08:00:00'),
  (target_user_id, 'CS202 - Lab Session', 'Hands-on Raspberry Pi programming', 'lab', 'CS202', '2025-02-04', '14:00', '16:00', 'high', false, 'Lab 204', '2025-01-15 08:00:00'),
  (target_user_id, 'CS404 - Cybersecurity Seminar', 'Guest lecture by Dr. Martinez on network security', 'seminar', 'CS404', '2025-02-10', '11:00', '12:30', 'medium', false, 'Auditorium A', '2025-01-20 10:00:00'),
  (target_user_id, 'Faculty Senate Meeting', 'Monthly faculty governance meeting', 'meeting', NULL, '2025-02-07', '15:00', '17:00', 'medium', false, 'Conference Room B', '2025-01-25 09:00:00'),
  (target_user_id, 'Research Group Meeting', 'Weekly AI research group discussion', 'meeting', 'Research', '2025-02-06', '13:00', '14:00', 'high', false, 'Research Lab', '2025-01-15 08:00:00'),
  (target_user_id, 'CS101 - Midterm Exam', 'First midterm examination', 'exam', 'CS101', '2025-02-12', '09:00', '11:00', 'urgent', false, 'Room 101', '2025-01-15 08:00:00'),
  (target_user_id, 'CS202 - Project Presentations', 'Student presentations of semester projects', 'presentation', 'CS202', '2025-02-14', '13:00', '16:00', 'high', false, 'Lab 204', '2025-01-20 11:00:00'),
  (target_user_id, 'Department Social Event', 'Monthly faculty and staff gathering', 'social', NULL, '2025-02-08', '17:30', '19:00', 'low', false, 'Faculty Lounge', '2025-01-28 14:00:00'),
  (target_user_id, 'CS404 - Final Project Due', 'Final project submission deadline', 'deadline', 'CS404', '2025-02-20', '23:59', '23:59', 'urgent', false, 'Online Submission', '2025-01-15 08:00:00');

  -- Seed Future Planning (semester-wide planning)
  INSERT INTO public.future_planning (user_id, title, description, semester, priority, estimated_hours, created_at) VALUES
  (target_user_id, 'Curriculum Modernization - CS202', 'Update CS202 curriculum to include modern web frameworks and cloud computing concepts', 'Fall 2025', 'high', 40, '2025-01-15 09:00:00'),
  (target_user_id, 'Research Grant Application - NSF', 'Prepare and submit NSF grant application for AI in Education research', 'Summer 2025', 'urgent', 60, '2025-01-10 14:30:00'),
  (target_user_id, 'Lab Equipment Upgrade', 'Plan and execute comprehensive lab equipment upgrade including new workstations', 'Fall 2025', 'medium', 25, '2025-01-20 11:15:00'),
  (target_user_id, 'Industry Partnership Development', 'Establish partnerships with local tech companies for student internships', 'Spring 2025', 'medium', 30, '2025-01-12 16:45:00'),
  (target_user_id, 'Conference Organization', 'Organize regional computer science education conference', 'Summer 2025', 'low', 80, '2025-01-25 08:30:00'),
  (target_user_id, 'Online Course Development', 'Develop online version of CS101 for distance learning', 'Fall 2025', 'high', 50, '2025-01-18 13:20:00');

  -- Seed Funding Sources (grants with realistic amounts and statuses)
  INSERT INTO public.funding_sources (user_id, name, type, total_amount, remaining_amount, start_date, end_date, status, description, restrictions, contact_person, contact_email, reporting_requirements, created_at, updated_at) VALUES
  (target_user_id, 'NSF Educational Innovation Grant', 'grant', 85000.00, 62500.00, '2024-09-01', '2026-08-31', 'active', 'Grant for developing innovative AI-based educational tools and methodologies', 'Must be used for educational technology development and student support', 'Dr. Patricia Chen', 'p.chen@nsf.gov', 'Quarterly progress reports and annual financial statements', '2024-08-15 10:00:00', '2025-01-30 14:30:00'),
  (target_user_id, 'University Research Excellence Fund', 'budget_allocation', 25000.00, 18750.00, '2025-01-01', '2025-12-31', 'active', 'Annual research fund allocation for faculty research activities', 'Equipment purchases over $5000 require committee approval', 'Dr. Robert Williams', 'r.williams@university.edu', 'Semester expense reports', '2024-12-01 09:00:00', '2025-01-15 11:20:00'),
  (target_user_id, 'Industry Partnership - TechCorp', 'donation', 50000.00, 45000.00, '2024-10-15', '2025-10-14', 'active', 'Corporate partnership funding for lab equipment and student projects', 'Preference for projects involving machine learning and data science', 'Ms. Jennifer Martinez', 'j.martinez@techcorp.com', 'Bi-annual project showcases and impact reports', '2024-10-01 15:30:00', '2025-01-20 09:45:00'),
  (target_user_id, 'State Education Development Grant', 'grant', 120000.00, 95000.00, '2024-07-01', '2026-06-30', 'active', 'State funding for computer science education enhancement and outreach programs', 'Must include K-12 outreach component and diversity initiatives', 'Dr. Lisa Thompson', 'l.thompson@state.edu', 'Annual reports and quarterly budget updates', '2024-06-15 13:45:00', '2025-01-25 16:15:00'),
  (target_user_id, 'Alumni Association Research Fund', 'donation', 15000.00, 0.00, '2024-05-01', '2025-04-30', 'depleted', 'Alumni-funded research initiative for emerging technologies', 'Must acknowledge alumni contributors in publications', 'Mr. David Lee', 'd.lee@alumni.university.edu', 'Final report upon completion', '2024-04-20 11:00:00', '2025-01-28 14:00:00'),
  (target_user_id, 'Conference Travel Support', 'budget_allocation', 8000.00, 3200.00, '2025-01-01', '2025-12-31', 'active', 'Annual allocation for conference attendance and professional development', 'International travel requires additional approval', 'Department Secretary', 'admin@cs.university.edu', 'Monthly expense submissions', '2024-12-20 10:30:00', '2025-01-30 12:15:00');

  -- Get funding source IDs for expenditures
  SELECT id INTO funding_source_id FROM public.funding_sources WHERE name = 'NSF Educational Innovation Grant' AND user_id = target_user_id LIMIT 1;

  -- Seed Funding Expenditures (linked to funding sources)
  INSERT INTO public.funding_expenditures (user_id, funding_source_id, amount, description, category, expenditure_date, receipt_number, approved_by, notes, created_at, updated_at) VALUES
  (target_user_id, funding_source_id, 12500.00, 'High-performance laptops for AI research lab', 'Equipment', '2024-11-15', 'REC-2024-1115-001', 'Dr. Patricia Chen', 'Purchased 5 Dell Precision laptops with GPU acceleration', '2024-11-15 14:20:00', '2024-11-15 14:20:00'),
  (target_user_id, funding_source_id, 10000.00, 'Graduate student stipend - Fall 2024', 'Personnel', '2024-12-01', 'PAY-2024-1201-GS1', 'Dr. Patricia Chen', 'Research assistant stipend for Sarah Kim', '2024-12-01 09:00:00', '2024-12-01 09:00:00');

  -- More expenditures and other data...
  SELECT id INTO funding_source_id FROM public.funding_sources WHERE name = 'University Research Excellence Fund' AND user_id = target_user_id LIMIT 1;
  
  INSERT INTO public.funding_expenditures (user_id, funding_source_id, amount, description, category, expenditure_date, receipt_number, approved_by, notes, created_at, updated_at) VALUES
  (target_user_id, funding_source_id, 3750.00, 'MATLAB and specialized software licenses', 'Software', '2025-01-08', 'LIC-2025-0108-SW1', 'Dr. Robert Williams', 'Annual renewal of research software suite', '2025-01-08 11:30:00', '2025-01-08 11:30:00'),
  (target_user_id, funding_source_id, 2500.00, 'Conference presentation materials and booth setup', 'Travel', '2025-01-20', 'CONF-2025-0120-MT1', 'Dr. Robert Williams', 'SIGCSE 2025 conference participation', '2025-01-20 16:45:00', '2025-01-20 16:45:00');

  -- Seed Platform Feedback (various categories and sentiments)
  INSERT INTO public.feedback (user_id, subject, description, category, priority, status, admin_response, resolved_at, created_at, updated_at) VALUES
  (target_user_id, 'Dashboard Loading Performance', 'The analytics dashboard takes too long to load when viewing semester-wide data. Sometimes it times out completely. This affects daily workflow efficiency.', 'technical', 'high', 'in_progress', 'We are investigating the performance issue and optimizing database queries. A fix should be deployed within the next sprint.', NULL, '2025-01-22 10:30:00', '2025-01-28 14:15:00'),
  (target_user_id, 'Feature Request: Bulk Note Operations', 'It would be very helpful to have bulk operations for notes - such as bulk tagging, bulk status changes, and bulk archiving. Currently doing these one by one is time-consuming.', 'feature_request', 'medium', 'under_review', 'Great suggestion! This has been added to our product roadmap for Q2 2025. We will prioritize based on user demand.', NULL, '2025-01-25 14:20:00', '2025-01-30 09:45:00'),
  (target_user_id, 'Mobile App Suggestion', 'A mobile app or better mobile web interface would be incredibly useful for quick note-taking during meetings and checking schedules on the go.', 'feature_request', 'medium', 'open', NULL, NULL, '2025-01-28 11:45:00', '2025-01-28 11:45:00'),
  (target_user_id, 'Calendar Integration Issue', 'The Outlook calendar sync sometimes creates duplicate events. This happened twice last week and required manual cleanup.', 'technical', 'medium', 'resolved', 'Fixed in latest update. Implemented better duplicate detection logic. Please let us know if you continue to see this issue.', '2025-02-01 16:30:00', '2025-01-30 09:15:00', '2025-02-01 16:30:00'),
  (target_user_id, 'Excellent Supply Management Features', 'The supply tracking and shopping list features have been incredibly helpful for lab management. The low-stock alerts have prevented several potential issues.', 'general', 'low', 'closed', 'Thank you for the positive feedback! We are glad the supply management features are working well for you.', '2025-02-02 10:00:00', '2025-02-01 15:30:00', '2025-02-02 10:00:00');

  -- Seed Admin Communications (announcements and messages)
  INSERT INTO public.admin_communications (admin_id, title, content, description, category, priority, is_published, published_at, expires_at, created_at, updated_at) VALUES
  (target_user_id, 'System Maintenance Scheduled', 'The learning management system will be offline for maintenance on Saturday, February 10th from 2:00 AM - 6:00 AM EST. Please plan accordingly and save your work before this time.', 'Scheduled system maintenance notification', 'system', 'high', true, '2025-02-01 09:00:00', '2025-02-10 06:00:00', '2025-02-01 09:00:00', '2025-02-01 09:00:00'),
  (target_user_id, 'New Lab Safety Protocols', 'Updated lab safety protocols are now in effect. All faculty and students must complete the new safety training module before accessing lab facilities. Training materials available on the department website.', 'Important safety protocol updates', 'policy', 'urgent', true, '2025-01-25 14:30:00', '2025-03-01 23:59:59', '2025-01-25 14:30:00', '2025-01-25 14:30:00'),
  (target_user_id, 'Spring Semester Registration Reminder', 'Registration for Spring 2025 courses ends on February 15th. Students should meet with their academic advisors to finalize course selections. Late registration fees apply after the deadline.', 'Course registration deadline reminder', 'academic', 'normal', true, '2025-01-30 10:00:00', '2025-02-15 23:59:59', '2025-01-30 10:00:00', '2025-01-30 10:00:00');

  -- Seed some notifications for the user
  INSERT INTO public.notifications (user_id, title, content, type, priority, metadata, created_at, updated_at) VALUES
  (target_user_id, 'Low Supply Alert', 'Raspberry Pi 4 Kits are running low (3 remaining, threshold: 5). Consider adding to shopping list.', 'system', 'medium', '{"supply_id": null, "category": "lab_equipment"}'::jsonb, '2025-02-05 09:00:00', '2025-02-05 09:00:00'),
  (target_user_id, 'Upcoming Meeting Reminder', 'Meeting with Michael Brown scheduled for tomorrow at 3:30 PM in Lab 204.', 'reminder', 'high', '{"meeting_id": null, "reminder_type": "24_hours"}'::jsonb, '2025-02-07 15:30:00', '2025-02-07 15:30:00'),
  (target_user_id, 'Funding Report Due Soon', 'NSF Grant quarterly report is due in 5 days (February 15th). Please submit before deadline.', 'deadline', 'high', '{"report_type": "quarterly", "funding_source": "NSF Educational Innovation Grant"}'::jsonb, '2025-02-10 10:00:00', '2025-02-10 10:00:00');

  RAISE NOTICE 'Comprehensive demo data seeded successfully for user %', target_user_id;
END;
$$;