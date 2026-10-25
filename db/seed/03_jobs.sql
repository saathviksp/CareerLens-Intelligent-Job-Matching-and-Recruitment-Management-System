-- ============================================================================
-- CareerLens: 15 Seed Jobs across 6 Role Archetypes
-- With weighted mandatory and optional skills
-- ============================================================================

DO $$
DECLARE
    r1 INT; r2 INT; r3 INT; r4 INT;
    c1 INT; c2 INT; c3 INT; c4 INT;
    j_id INT;
BEGIN
    SELECT recruiter_id, company_id INTO r1, c1 FROM recruiters WHERE full_name = 'Sarah Jenkins';
    SELECT recruiter_id, company_id INTO r2, c2 FROM recruiters WHERE full_name = 'Marcus Vance';
    SELECT recruiter_id, company_id INTO r3, c3 FROM recruiters WHERE full_name = 'Elena Rostova';
    SELECT recruiter_id, company_id INTO r4, c4 FROM recruiters WHERE full_name = 'David Kim';

    -- 1. Job 1: Senior Fullstack Engineer (Nexus AI Labs)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r1, c1, 'Senior Fullstack Engineer', 
    'Build next-generation conversational AI interfaces and high-throughput microservices using React, Next.js, TypeScript, and Node.js. Experience with PostgreSQL schema design, indexing, and Redis caching required.',
    'San Francisco, CA', 140000, 190000, 2, CURRENT_DATE + INTERVAL '45 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('React', 5, true),
        ('TypeScript', 4, true),
        ('Node.js', 4, false),
        ('PostgreSQL', 5, true),
        ('System Design', 3, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 2. Job 2: Senior Machine Learning Engineer (Nexus AI Labs)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r1, c1, 'Senior Machine Learning Engineer',
    'Develop and deploy deep learning models and large language model pipelines using PyTorch and Python. Optimize inference latency and maintain vector search systems for multimodal information retrieval.',
    'San Francisco, CA', 160000, 220000, 2, CURRENT_DATE + INTERVAL '60 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('Python', 5, true),
        ('PyTorch', 5, true),
        ('Pandas & NumPy', 4, false),
        ('Docker', 3, false),
        ('Problem Solving', 4, true)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 3. Job 3: Staff Data Platform Engineer (Nexus AI Labs)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r1, c1, 'Staff Data Platform Engineer',
    'Architect distributed streaming pipelines using Apache Kafka, PostgreSQL, and Python. Lead data engineering initiatives, SQL optimization, and large-scale data lake integrations.',
    'Remote', 150000, 205000, 1, CURRENT_DATE + INTERVAL '30 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('Apache Kafka', 5, true),
        ('Python', 4, false),
        ('PostgreSQL', 5, true),
        ('SQL Optimization', 4, true),
        ('System Design', 4, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 4. Job 4: Cloud Infrastructure Engineer (CloudScale Systems)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r2, c2, 'Cloud Infrastructure Engineer',
    'Design, manage, and scale cloud environments on AWS using Kubernetes, Docker, and Terraform. Implement automated CI/CD pipelines and infrastructure as code across multi-region clusters.',
    'Austin, TX', 130000, 175000, 3, CURRENT_DATE + INTERVAL '40 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('Kubernetes', 5, true),
        ('Docker', 4, true),
        ('AWS', 5, true),
        ('Terraform', 4, false),
        ('Linux Administration', 3, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 5. Job 5: Principal DevOps Architect (CloudScale Systems)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r2, c2, 'Principal DevOps Architect',
    'Lead enterprise cloud migration and Kubernetes orchestration. Establish security standards, Linux administration practices, and zero-downtime deployment pipelines.',
    'Austin, TX', 170000, 230000, 1, CURRENT_DATE + INTERVAL '50 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('Kubernetes', 5, true),
        ('AWS', 5, true),
        ('CI/CD Pipelines', 4, true),
        ('System Design', 5, true),
        ('Team Leadership', 4, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 6. Job 6: Site Reliability Engineer (CloudScale Systems)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r2, c2, 'Site Reliability Engineer',
    'Ensure 99.99% uptime of mission-critical services. Automate incident remediation with Python and Linux administration, maintain telemetry in Elasticsearch, and manage container workloads.',
    'Austin, TX', 125000, 165000, 2, CURRENT_DATE + INTERVAL '25 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('Linux Administration', 5, true),
        ('Docker', 4, true),
        ('Python', 3, false),
        ('Elasticsearch', 4, false),
        ('Problem Solving', 4, true)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 7. Job 7: Senior Backend Database Engineer (FinTech Matrix)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r3, c3, 'Senior Backend Database Engineer',
    'Design high-concurrency transactional ledger systems in PostgreSQL. Implement ACID transactions, stored procedures, table partitioning, and low-latency caching with Redis.',
    'New York, NY', 155000, 210000, 2, CURRENT_DATE + INTERVAL '35 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('PostgreSQL', 5, true),
        ('SQL Optimization', 5, true),
        ('Redis', 4, false),
        ('Node.js', 4, true),
        ('System Design', 4, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 8. Job 8: FinTech Payments Backend Engineer (FinTech Matrix)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r3, c3, 'FinTech Payments Backend Engineer',
    'Develop real-time payment settlement gateways. Experience with Node.js, TypeScript, PostgreSQL, and event streaming with Apache Kafka required.',
    'New York, NY', 145000, 195000, 3, CURRENT_DATE + INTERVAL '45 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('Node.js', 5, true),
        ('TypeScript', 4, true),
        ('PostgreSQL', 4, true),
        ('Apache Kafka', 4, false),
        ('Problem Solving', 3, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 9. Job 9: Lead Financial Systems Architect (FinTech Matrix)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r3, c3, 'Lead Financial Systems Architect',
    'Architect distributed financial platforms with strict data consistency and regulatory compliance. Mentor senior engineering staff in system design, Agile methodologies, and database modeling.',
    'New York, NY', 185000, 250000, 1, CURRENT_DATE + INTERVAL '90 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('System Design', 5, true),
        ('PostgreSQL', 5, true),
        ('Team Leadership', 5, true),
        ('Agile & Scrum', 4, false),
        ('Redis', 3, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 10. Job 10: Quantitative Risk Developer (FinTech Matrix)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r3, c3, 'Quantitative Risk Developer',
    'Implement statistical risk models and volatility surface calculators using Python, Pandas & NumPy, and SQL. Analyze real-time portfolio risks.',
    'New York, NY', 150000, 200000, 1, CURRENT_DATE + INTERVAL '30 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('Python', 5, true),
        ('Pandas & NumPy', 5, true),
        ('SQL Optimization', 4, false),
        ('Problem Solving', 4, true)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 11. Job 11: Senior Frontend React Engineer (PixelCraft Studio)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r4, c4, 'Senior Frontend React Engineer',
    'Build reactive, accessible, pixel-perfect user experiences using React, Next.js, TypeScript, and Tailwind CSS. Craft scalable design systems and optimize Core Web Vitals.',
    'Seattle, WA', 135000, 175000, 2, CURRENT_DATE + INTERVAL '30 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('React', 5, true),
        ('Next.js', 5, true),
        ('TypeScript', 4, true),
        ('Tailwind CSS', 4, false),
        ('GraphQL', 3, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 12. Job 12: Lead UI/UX Fullstack Engineer (PixelCraft Studio)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r4, c4, 'Lead UI/UX Fullstack Engineer',
    'Spearhead design-engineering bridge for interactive web apps. Seamless integration between React frontend interfaces and Node.js / PostgreSQL backends.',
    'Seattle, WA', 150000, 195000, 1, CURRENT_DATE + INTERVAL '45 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('React', 5, true),
        ('Node.js', 4, true),
        ('TypeScript', 4, true),
        ('PostgreSQL', 3, false),
        ('Team Leadership', 4, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 13. Job 13: Web Performance & Frontend Architect (PixelCraft Studio)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r4, c4, 'Web Performance & Frontend Architect',
    'Audit and optimize runtime performance of large scale Single Page Applications and server-rendered Next.js platforms. Deep knowledge of browser rendering and modern tooling.',
    'Seattle, WA', 160000, 210000, 1, CURRENT_DATE + INTERVAL '60 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('React', 5, true),
        ('Next.js', 5, true),
        ('TypeScript', 4, true),
        ('System Design', 4, false),
        ('Problem Solving', 4, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 14. Job 14: Junior Fullstack Web Developer (PixelCraft Studio)
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r4, c4, 'Junior Fullstack Web Developer',
    'Collaborate on client features using React, TypeScript, Tailwind CSS, and Node.js. Great opportunity for eager engineers with foundational knowledge in web standards.',
    'Seattle, WA', 75000, 105000, 2, CURRENT_DATE + INTERVAL '20 days', 'open')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('React', 4, true),
        ('TypeScript', 3, false),
        ('Tailwind CSS', 4, false),
        ('Node.js', 3, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

    -- 15. Job 15: Closed Position - Legacy Systems Migration (FinTech Matrix)
    -- Intentionally closed to test Q1/Q5 filtering and T9 closed job application rejection
    INSERT INTO jobs (recruiter_id, company_id, title, description, location, salary_min, salary_max, openings, deadline, status)
    VALUES (r3, c3, 'Legacy Database Migration Specialist (Closed)',
    'Migrate legacy mainframe databases to PostgreSQL 16. Implement schema normalization and ETL scripts.',
    'New York, NY', 130000, 170000, 1, CURRENT_DATE + INTERVAL '10 days', 'closed')
    RETURNING job_id INTO j_id;

    INSERT INTO job_skills (job_id, skill_id, weight, is_mandatory)
    SELECT j_id, skill_id, weight, is_man FROM (VALUES
        ('PostgreSQL', 5, true),
        ('SQL Optimization', 4, true),
        ('Python', 3, false)
    ) AS s(name, weight, is_man) JOIN skills ON skills.name = s.name;

END $$;
