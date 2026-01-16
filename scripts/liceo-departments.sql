-- =====================================================
-- LICEO DE CAGAYAN UNIVERSITY DEPARTMENTS
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Clear existing departments (optional - comment out if you want to keep existing)
-- DELETE FROM departments;

-- Insert Liceo de Cagayan University Departments
INSERT INTO departments (code, name, description, is_active, created_at) VALUES

-- Academic Colleges
('cit', 'College of Information Technology', 'CIT - Bachelor of Science in Information Technology, Computer Science', true, NOW()),
('sbma', 'School of Business Management and Accountancy', 'SBMA - Business Administration, Accountancy, Management', true, NOW()),
('cas', 'College of Arts and Sciences', 'CAS - Liberal Arts, Sciences, General Education', true, NOW()),
('coe', 'College of Education', 'COE - Teacher Education, Elementary & Secondary Education', true, NOW()),
('ceng', 'College of Engineering', 'Engineering programs including Civil, Mechanical, Electrical', true, NOW()),
('ccj', 'College of Criminal Justice', 'CCJ - Criminology and Criminal Justice Education', true, NOW()),
('con', 'College of Nursing', 'CON - Bachelor of Science in Nursing', true, NOW()),
('cod', 'College of Dentistry', 'COD - Doctor of Dental Medicine', true, NOW()),
('chm', 'College of Hospitality Management', 'CHM - Hotel and Restaurant Management, Tourism', true, NOW()),
('cma', 'College of Maritime Education', 'Maritime programs including Marine Transportation, Marine Engineering', true, NOW()),
('law', 'College of Law', 'Juris Doctor / Bachelor of Laws program', true, NOW()),
('grad', 'Graduate School', 'Masters and Doctoral programs', true, NOW()),

-- Administrative Offices
('registrar', 'Office of the Registrar', 'Student records, enrollment, academic documents', true, NOW()),
('finance', 'Finance Office', 'Tuition, fees, financial transactions', true, NOW()),
('accounting', 'Accounting Office', 'Financial records, budgeting, auditing', true, NOW()),
('cashier', 'Cashier Office', 'Payment processing, receipts', true, NOW()),
('hr', 'Human Resources', 'Employee management, recruitment, benefits', true, NOW()),
('osa', 'Office of Student Affairs', 'Student services, organizations, activities', true, NOW()),
('guidance', 'Guidance and Counseling Office', 'Student counseling, career guidance', true, NOW()),
('library', 'Library Services', 'Library resources, research assistance', true, NOW()),
('clinic', 'University Clinic', 'Health services, medical assistance', true, NOW()),
('security', 'Security Office', 'Campus security, safety protocols', true, NOW()),
('facilities', 'Facilities Management', 'Building maintenance, utilities, grounds', true, NOW()),
('it_services', 'IT Services / MIS', 'Technology support, network, systems', true, NOW()),
('admission', 'Admissions Office', 'Student admission, entrance exams', true, NOW()),
('scholarship', 'Scholarship Office', 'Scholarships, financial aid, grants', true, NOW()),
('alumni', 'Alumni Affairs Office', 'Alumni relations, networking, events', true, NOW()),
('research', 'Research and Extension Office', 'Research programs, community extension', true, NOW()),
('nstp', 'NSTP Office', 'National Service Training Program', true, NOW()),
('sports', 'Sports Development Office', 'Athletics, sports programs', true, NOW()),
('cultural', 'Cultural Affairs Office', 'Cultural programs, arts, performances', true, NOW()),
('president', 'Office of the President', 'University administration, executive office', true, NOW()),
('vpaa', 'VP for Academic Affairs', 'Academic policies, curriculum', true, NOW()),
('vpaf', 'VP for Administration and Finance', 'Administrative and financial operations', true, NOW())

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- SELECT * FROM departments ORDER BY name;
