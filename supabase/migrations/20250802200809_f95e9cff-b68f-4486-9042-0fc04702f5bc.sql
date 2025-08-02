-- Comprehensive Seed Data for Smart Professor Application
-- Note: This seed data will be inserted for the first authenticated user who logs in
-- Run this script manually in the SQL editor after logging in, replacing 'YOUR_USER_ID' with your actual user ID

-- Create a function to seed data for a specific user
CREATE OR REPLACE FUNCTION seed_demo_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Seed Notes & Commitments
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

  -- Continue with other tables...
  RAISE NOTICE 'Demo data seeded successfully for user %', target_user_id;
END;
$$;

-- Instructions for using this function:
-- 1. Log into your application first
-- 2. Run this query to get your user ID: SELECT auth.uid();
-- 3. Then run: SELECT seed_demo_data('your-user-id-here');

COMMENT ON FUNCTION seed_demo_data(UUID) IS 'Seeds comprehensive demo data for the Smart Professor application. Must be called with a valid user ID after authentication.';