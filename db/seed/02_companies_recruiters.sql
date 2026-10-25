-- ============================================================================
-- CareerLens: 4 Companies and 4 Recruiters
-- Passwords set to 'password123'
-- ============================================================================

-- 1. Insert Companies
INSERT INTO companies (name, industry, location, website) VALUES
('Nexus AI Labs', 'Artificial Intelligence & ML', 'San Francisco, CA', 'https://nexusai.example.com'),
('CloudScale Systems', 'Cloud Infrastructure & DevOps', 'Austin, TX', 'https://cloudscale.example.com'),
('FinTech Matrix', 'Financial Technology & Payments', 'New York, NY', 'https://fintechmatrix.example.com'),
('PixelCraft Studio', 'Web Applications & Design Systems', 'Seattle, WA', 'https://pixelcraft.example.com')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Recruiter Users
-- Note: users table uses user_role ENUM ('candidate', 'recruiter')
INSERT INTO users (email, password_hash, role) VALUES
('recruiter1@nexusai.com', '$2b$10$Pld/1iCGiQECDlaEDYoEhOOPYgmuXY5VXgkpXXl0TTLn.RFsJDOZ6', 'recruiter'),
('recruiter2@cloudscale.io', '$2b$10$Pld/1iCGiQECDlaEDYoEhOOPYgmuXY5VXgkpXXl0TTLn.RFsJDOZ6', 'recruiter'),
('recruiter3@fintechmatrix.com', '$2b$10$Pld/1iCGiQECDlaEDYoEhOOPYgmuXY5VXgkpXXl0TTLn.RFsJDOZ6', 'recruiter'),
('recruiter4@pixelcraft.dev', '$2b$10$Pld/1iCGiQECDlaEDYoEhOOPYgmuXY5VXgkpXXl0TTLn.RFsJDOZ6', 'recruiter')
ON CONFLICT (email) DO NOTHING;

-- 3. Link Recruiters to Companies
INSERT INTO recruiters (user_id, company_id, full_name, designation)
SELECT u.user_id, c.company_id, 'Sarah Jenkins', 'VP of Engineering Talent'
FROM users u, companies c
WHERE u.email = 'recruiter1@nexusai.com' AND c.name = 'Nexus AI Labs'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO recruiters (user_id, company_id, full_name, designation)
SELECT u.user_id, c.company_id, 'Marcus Vance', 'Principal Tech Recruiter'
FROM users u, companies c
WHERE u.email = 'recruiter2@cloudscale.io' AND c.name = 'CloudScale Systems'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO recruiters (user_id, company_id, full_name, designation)
SELECT u.user_id, c.company_id, 'Elena Rostova', 'Talent Acquisition Lead'
FROM users u, companies c
WHERE u.email = 'recruiter3@fintechmatrix.com' AND c.name = 'FinTech Matrix'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO recruiters (user_id, company_id, full_name, designation)
SELECT u.user_id, c.company_id, 'David Kim', 'Senior Engineering Partner'
FROM users u, companies c
WHERE u.email = 'recruiter4@pixelcraft.dev' AND c.name = 'PixelCraft Studio'
ON CONFLICT (user_id) DO NOTHING;
