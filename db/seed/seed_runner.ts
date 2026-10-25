import fs from 'fs';
import path from 'path';
import { query } from '../../lib/db';
import { generateEmbedding, formatVectorForPg } from '../../lib/embeddings';

const DEFAULT_HASH = '$2b$10$Pld/1iCGiQECDlaEDYoEhOOPYgmuXY5VXgkpXXl0TTLn.RFsJDOZ6'; // password123

interface CandidateSeed {
  email: string;
  fullName: string;
  phone: string;
  location: string;
  education: string;
  yearsExperience: number;
  summary: string;
  resumeText: string;
  skills: { name: string; proficiency: number; yearsUsed: number }[];
}

const CANDIDATES_DATA: CandidateSeed[] = [
  {
    email: 'alex.morgan@example.com',
    fullName: 'Alex Morgan',
    phone: '+1 415-555-0101',
    location: 'San Francisco, CA',
    education: 'B.S. in Computer Science, UC Berkeley',
    yearsExperience: 6.5,
    summary: 'Senior Fullstack Engineer specializing in React, Next.js, TypeScript, and high-performance PostgreSQL architectures.',
    resumeText: 'Alex Morgan is an experienced fullstack software engineer with 6+ years designing scalable cloud-native web apps. Proficient in TypeScript, React, Next.js, Node.js microservices, PostgreSQL query optimization, and Redis caching. Led fullstack web redesign improving latency by 45%. Strong background in RESTful APIs and distributed systems.',
    skills: [
      { name: 'React', proficiency: 5, yearsUsed: 6.0 },
      { name: 'TypeScript', proficiency: 5, yearsUsed: 5.5 },
      { name: 'Next.js', proficiency: 5, yearsUsed: 4.0 },
      { name: 'Node.js', proficiency: 4, yearsUsed: 5.0 },
      { name: 'PostgreSQL', proficiency: 5, yearsUsed: 6.0 },
      { name: 'System Design', proficiency: 4, yearsUsed: 4.0 },
    ],
  },
  {
    email: 'priya.sharma@example.com',
    fullName: 'Priya Sharma',
    phone: '+1 415-555-0102',
    location: 'San Francisco, CA',
    education: 'M.S. in Artificial Intelligence, Stanford University',
    yearsExperience: 5.0,
    summary: 'Machine Learning Engineer focused on PyTorch deep learning models, LLM fine-tuning, and semantic vector embeddings.',
    resumeText: 'Priya Sharma is a machine learning researcher and engineer with expertise in PyTorch, Python, HuggingFace transformers, and vector databases. Deployed production neural search and recommendation pipelines processing millions of daily queries. Skilled in Pandas, NumPy, and GPU acceleration.',
    skills: [
      { name: 'Python', proficiency: 5, yearsUsed: 5.0 },
      { name: 'PyTorch', proficiency: 5, yearsUsed: 4.5 },
      { name: 'Pandas & NumPy', proficiency: 5, yearsUsed: 5.0 },
      { name: 'Problem Solving', proficiency: 5, yearsUsed: 5.0 },
      { name: 'Docker', proficiency: 4, yearsUsed: 3.5 },
    ],
  },
  {
    email: 'david.chen@example.com',
    fullName: 'David Chen',
    phone: '+1 512-555-0103',
    location: 'Austin, TX',
    education: 'B.S. in Software Engineering, UT Austin',
    yearsExperience: 7.0,
    summary: 'Lead Data Platform Engineer with deep expertise in Apache Kafka streaming, PostgreSQL data modeling, and Python pipelines.',
    resumeText: 'David Chen has 7 years of distributed data platform engineering experience. Architected event-driven architectures with Apache Kafka, real-time analytics streaming pipelines, and PostgreSQL data marts. Highly skilled in SQL optimization, indexing strategies, and large-scale data ingest pipelines.',
    skills: [
      { name: 'Apache Kafka', proficiency: 5, yearsUsed: 6.0 },
      { name: 'PostgreSQL', proficiency: 5, yearsUsed: 7.0 },
      { name: 'SQL Optimization', proficiency: 5, yearsUsed: 6.5 },
      { name: 'Python', proficiency: 4, yearsUsed: 5.0 },
      { name: 'System Design', proficiency: 4, yearsUsed: 4.5 },
    ],
  },
  {
    email: 'james.wilson@example.com',
    fullName: 'James Wilson',
    phone: '+1 512-555-0104',
    location: 'Austin, TX',
    education: 'B.S. in Computer Engineering, Georgia Tech',
    yearsExperience: 8.0,
    summary: 'Cloud Infrastructure and DevOps Architect specializing in Kubernetes, AWS, Terraform, and automated CI/CD pipelines.',
    resumeText: 'James Wilson is a seasoned Cloud Architect with 8 years orchestrating multi-region container clusters on AWS. Expert in Kubernetes, Docker, Terraform infrastructure-as-code, and resilient CI/CD pipelines. Led company-wide cloud transformation resulting in 99.99% availability and 35% cost reduction.',
    skills: [
      { name: 'Kubernetes', proficiency: 5, yearsUsed: 6.0 },
      { name: 'AWS', proficiency: 5, yearsUsed: 7.5 },
      { name: 'Docker', proficiency: 5, yearsUsed: 7.0 },
      { name: 'Terraform', proficiency: 5, yearsUsed: 5.0 },
      { name: 'CI/CD Pipelines', proficiency: 4, yearsUsed: 6.0 },
      { name: 'Linux Administration', proficiency: 5, yearsUsed: 8.0 },
    ],
  },
  {
    email: 'sophia.martinez@example.com',
    fullName: 'Sophia Martinez',
    phone: '+1 212-555-0105',
    location: 'New York, NY',
    education: 'M.S. in Computer Science, Columbia University',
    yearsExperience: 6.0,
    summary: 'High-throughput Backend and Database Engineer specializing in transactional financial ledgers and PostgreSQL optimization.',
    resumeText: 'Sophia Martinez is a backend database engineer with 6 years in fintech engineering. Specialized in PostgreSQL ACID transactions, stored procedures, execution plan tuning, and Redis caching. Engineered high-throughput transaction ledger maintaining strict consistency.',
    skills: [
      { name: 'PostgreSQL', proficiency: 5, yearsUsed: 6.0 },
      { name: 'SQL Optimization', proficiency: 5, yearsUsed: 5.5 },
      { name: 'Redis', proficiency: 4, yearsUsed: 4.5 },
      { name: 'Node.js', proficiency: 4, yearsUsed: 5.0 },
      { name: 'System Design', proficiency: 4, yearsUsed: 4.0 },
    ],
  },
  {
    email: 'liam.brown@example.com',
    fullName: 'Liam Brown',
    phone: '+1 206-555-0106',
    location: 'Seattle, WA',
    education: 'B.A. in Interactive Media & CS, University of Washington',
    yearsExperience: 5.5,
    summary: 'Senior Frontend Engineer crafting design systems and performant React and Next.js user interfaces.',
    resumeText: 'Liam Brown is a frontend specialist with 5+ years building enterprise web apps. Expert in React, Next.js, TypeScript, Tailwind CSS, and web accessibility standards. Created unified design system used by 40+ engineering squads.',
    skills: [
      { name: 'React', proficiency: 5, yearsUsed: 5.5 },
      { name: 'Next.js', proficiency: 5, yearsUsed: 4.0 },
      { name: 'TypeScript', proficiency: 5, yearsUsed: 5.0 },
      { name: 'Tailwind CSS', proficiency: 5, yearsUsed: 4.0 },
      { name: 'GraphQL', proficiency: 4, yearsUsed: 3.5 },
    ],
  },
  {
    email: 'emma.davis@example.com',
    fullName: 'Emma Davis',
    phone: '+1 206-555-0107',
    location: 'Seattle, WA',
    education: 'B.S. in Information Systems, Purdue University',
    yearsExperience: 1.5,
    summary: 'Junior Fullstack Developer with solid foundations in React, TypeScript, and modern JavaScript web development.',
    resumeText: 'Emma Davis is an ambitious junior developer eager to build maintainable web applications. Experienced in React, JavaScript, TypeScript, Tailwind CSS, and basic Node.js backend integration.',
    skills: [
      { name: 'React', proficiency: 4, yearsUsed: 2.0 },
      { name: 'TypeScript', proficiency: 3, yearsUsed: 1.5 },
      { name: 'Tailwind CSS', proficiency: 4, yearsUsed: 2.0 },
      { name: 'Node.js', proficiency: 3, yearsUsed: 1.5 },
    ],
  },
  {
    email: 'lucas.garcia@example.com',
    fullName: 'Lucas Garcia',
    phone: '+1 512-555-0108',
    location: 'Austin, TX',
    education: 'B.S. in Computer Science, Texas A&M',
    yearsExperience: 4.5,
    summary: 'Site Reliability and Linux Systems Engineer with focus on monitoring, Docker automation, and telemetry.',
    resumeText: 'Lucas Garcia has 4+ years keeping distributed systems healthy. Proficient in Linux administration, Docker container runtimes, Elasticsearch metrics, Python scripting, and incident root cause analysis.',
    skills: [
      { name: 'Linux Administration', proficiency: 5, yearsUsed: 5.0 },
      { name: 'Docker', proficiency: 4, yearsUsed: 4.0 },
      { name: 'Elasticsearch', proficiency: 4, yearsUsed: 3.5 },
      { name: 'Python', proficiency: 3, yearsUsed: 3.0 },
      { name: 'Problem Solving', proficiency: 4, yearsUsed: 4.0 },
    ],
  },
  {
    email: 'chloe.taylor@example.com',
    fullName: 'Chloe Taylor',
    phone: '+1 212-555-0109',
    location: 'New York, NY',
    education: 'B.S. in Software Engineering, NYU',
    yearsExperience: 5.0,
    summary: 'Backend Payments Software Engineer with Node.js, TypeScript, Kafka, and PostgreSQL experience.',
    resumeText: 'Chloe Taylor is a payments software engineer with 5 years experience creating secure transaction processing services. Expert in Node.js, TypeScript, Kafka message brokers, and relational data stores.',
    skills: [
      { name: 'Node.js', proficiency: 5, yearsUsed: 5.0 },
      { name: 'TypeScript', proficiency: 4, yearsUsed: 4.0 },
      { name: 'PostgreSQL', proficiency: 4, yearsUsed: 4.5 },
      { name: 'Apache Kafka', proficiency: 4, yearsUsed: 3.0 },
      { name: 'Problem Solving', proficiency: 4, yearsUsed: 4.0 },
    ],
  },
  {
    email: 'daniel.miller@example.com',
    fullName: 'Daniel Miller',
    phone: '+1 212-555-0110',
    location: 'New York, NY',
    education: 'Ph.D. in Computer Science, MIT',
    yearsExperience: 10.0,
    summary: 'Principal Distributed Systems Architect specializing in financial transaction consistency, leadership, and resilient databases.',
    resumeText: 'Daniel Miller is a Principal Architect with a decade of leadership in enterprise fintech platforms. Deep expertise in distributed consensus, PostgreSQL database internals, system design, and leading high-performing engineering organizations.',
    skills: [
      { name: 'System Design', proficiency: 5, yearsUsed: 10.0 },
      { name: 'PostgreSQL', proficiency: 5, yearsUsed: 9.0 },
      { name: 'Team Leadership', proficiency: 5, yearsUsed: 7.0 },
      { name: 'Agile & Scrum', proficiency: 4, yearsUsed: 8.0 },
      { name: 'Redis', proficiency: 4, yearsUsed: 6.0 },
    ],
  },
  {
    email: 'olivia.anderson@example.com',
    fullName: 'Olivia Anderson',
    phone: '+1 415-555-0111',
    location: 'San Francisco, CA',
    education: 'B.S. in Data Science, UC San Diego',
    yearsExperience: 3.5,
    summary: 'Data Scientist and Quantitative Analyst with Python, Pandas, NumPy, and SQL expertise.',
    resumeText: 'Olivia Anderson specializes in statistical data modeling and quantitative analysis. Proficient in Python, Pandas, NumPy, statistical hypothesis testing, and advanced SQL data extraction.',
    skills: [
      { name: 'Python', proficiency: 5, yearsUsed: 4.0 },
      { name: 'Pandas & NumPy', proficiency: 5, yearsUsed: 4.0 },
      { name: 'SQL Optimization', proficiency: 4, yearsUsed: 3.5 },
      { name: 'Problem Solving', proficiency: 4, yearsUsed: 4.0 },
    ],
  },
  {
    email: 'noah.thomas@example.com',
    fullName: 'Noah Thomas',
    phone: '+1 206-555-0112',
    location: 'Seattle, WA',
    education: 'B.S. in Computer Science, Western Washington University',
    yearsExperience: 6.0,
    summary: 'Lead UI Engineer and Frontend Architect with React, Node.js, and team leadership experience.',
    resumeText: 'Noah Thomas is a Lead UI engineer with 6 years guiding frontend direction. Skilled in React, Node.js, TypeScript, PostgreSQL integration, and leading sprint teams toward exceptional digital products.',
    skills: [
      { name: 'React', proficiency: 5, yearsUsed: 6.0 },
      { name: 'Node.js', proficiency: 4, yearsUsed: 5.0 },
      { name: 'TypeScript', proficiency: 4, yearsUsed: 5.0 },
      { name: 'Team Leadership', proficiency: 4, yearsUsed: 3.5 },
      { name: 'PostgreSQL', proficiency: 3, yearsUsed: 3.0 },
    ],
  },
  {
    email: 'ava.jackson@example.com',
    fullName: 'Ava Jackson',
    phone: '+1 415-555-0113',
    location: 'San Francisco, CA',
    education: 'M.S. in Machine Learning, Carnegie Mellon University',
    yearsExperience: 4.0,
    summary: 'AI Systems Engineer working on PyTorch neural models, vector embeddings, and Python inference pipelines.',
    resumeText: 'Ava Jackson is an AI researcher developing efficient inference runtimes for embedding models. Strong skills in PyTorch, Python, Docker containerization, and vector similarity algorithms.',
    skills: [
      { name: 'Python', proficiency: 5, yearsUsed: 4.0 },
      { name: 'PyTorch', proficiency: 4, yearsUsed: 3.5 },
      { name: 'Docker', proficiency: 3, yearsUsed: 3.0 },
      { name: 'Problem Solving', proficiency: 4, yearsUsed: 4.0 },
    ],
  },
  {
    email: 'william.white@example.com',
    fullName: 'William White',
    phone: '+1 512-555-0114',
    location: 'Austin, TX',
    education: 'B.S. in Electrical and Computer Engineering, Rice University',
    yearsExperience: 7.5,
    summary: 'Senior Cloud DevOps Engineer with AWS, Kubernetes, Terraform, and CI/CD pipelines.',
    resumeText: 'William White is an AWS Certified DevOps Professional with 7+ years designing fault-tolerant cloud infrastructures. Deep hands-on proficiency in Kubernetes, Terraform, Docker, and automation scripts.',
    skills: [
      { name: 'AWS', proficiency: 5, yearsUsed: 7.0 },
      { name: 'Kubernetes', proficiency: 5, yearsUsed: 5.5 },
      { name: 'Terraform', proficiency: 4, yearsUsed: 4.5 },
      { name: 'CI/CD Pipelines', proficiency: 4, yearsUsed: 5.0 },
      { name: 'Docker', proficiency: 4, yearsUsed: 6.0 },
    ],
  },
  {
    email: 'mia.harris@example.com',
    fullName: 'Mia Harris',
    phone: '+1 206-555-0115',
    location: 'Seattle, WA',
    education: 'B.S. in Human Centered Design, University of Washington',
    yearsExperience: 4.0,
    summary: 'Frontend Engineer focused on Next.js, React, accessible UI components, and Tailwind styling.',
    resumeText: 'Mia Harris builds reactive user interfaces with React, Next.js, Tailwind CSS, and TypeScript. Passionate about component reusability, responsive design, and frictionless UX.',
    skills: [
      { name: 'React', proficiency: 5, yearsUsed: 4.0 },
      { name: 'Next.js', proficiency: 4, yearsUsed: 3.0 },
      { name: 'Tailwind CSS', proficiency: 5, yearsUsed: 3.5 },
      { name: 'TypeScript', proficiency: 3, yearsUsed: 3.0 },
    ],
  },
  {
    email: 'benjamin.martin@example.com',
    fullName: 'Benjamin Martin',
    phone: '+1 212-555-0116',
    location: 'New York, NY',
    education: 'B.S. in Computer Science, Cornell University',
    yearsExperience: 5.5,
    summary: 'Backend Database Engineer experienced in SQL tuning, Redis caching, and Node.js APIs.',
    resumeText: 'Benjamin Martin is a backend engineer focused on database scaling and query optimization. Experienced with PostgreSQL, Redis caching layers, Node.js services, and system design.',
    skills: [
      { name: 'PostgreSQL', proficiency: 4, yearsUsed: 5.0 },
      { name: 'SQL Optimization', proficiency: 4, yearsUsed: 4.5 },
      { name: 'Redis', proficiency: 4, yearsUsed: 3.5 },
      { name: 'Node.js', proficiency: 4, yearsUsed: 4.5 },
    ],
  },
  {
    email: 'charlotte.lee@example.com',
    fullName: 'Charlotte Lee',
    phone: '+1 415-555-0117',
    location: 'San Francisco, CA',
    education: 'B.S. in Computer Science, UCLA',
    yearsExperience: 6.0,
    summary: 'Fullstack Software Engineer with React, Node.js, PostgreSQL, and cloud deployments.',
    resumeText: 'Charlotte Lee possesses 6 years of end-to-end fullstack development experience. Proficient in React, TypeScript, Node.js, PostgreSQL, and continuous deployment environments.',
    skills: [
      { name: 'React', proficiency: 5, yearsUsed: 5.5 },
      { name: 'Node.js', proficiency: 4, yearsUsed: 5.0 },
      { name: 'TypeScript', proficiency: 4, yearsUsed: 4.5 },
      { name: 'PostgreSQL', proficiency: 4, yearsUsed: 4.0 },
    ],
  },
  {
    email: 'henry.clark@example.com',
    fullName: 'Henry Clark',
    phone: '+1 512-555-0118',
    location: 'Austin, TX',
    education: 'B.S. in Information Technology, Texas State University',
    yearsExperience: 3.0,
    summary: 'Linux and DevOps Administrator with Docker, Linux systems, and cloud fundamentals.',
    resumeText: 'Henry Clark is a Linux enthusiast and junior DevOps engineer. Skilled in Linux administration, Docker container orchestration, shell scripting, and basic CI/CD pipeline automation.',
    skills: [
      { name: 'Linux Administration', proficiency: 4, yearsUsed: 3.5 },
      { name: 'Docker', proficiency: 4, yearsUsed: 3.0 },
      { name: 'CI/CD Pipelines', proficiency: 3, yearsUsed: 2.0 },
      { name: 'Problem Solving', proficiency: 3, yearsUsed: 3.0 },
    ],
  },
  {
    email: 'amelia.rodriguez@example.com',
    fullName: 'Amelia Rodriguez',
    phone: '+1 212-555-0119',
    location: 'New York, NY',
    education: 'B.S. in Mathematics and Economics, Fordham University',
    yearsExperience: 4.5,
    summary: 'Quantitative Data Analyst with Python modeling, SQL aggregation, and Pandas analytics.',
    resumeText: 'Amelia Rodriguez specializes in mathematical modeling, risk calculations, and automated data pipelines using Python, Pandas, NumPy, and SQL.',
    skills: [
      { name: 'Python', proficiency: 5, yearsUsed: 4.5 },
      { name: 'Pandas & NumPy', proficiency: 4, yearsUsed: 4.0 },
      { name: 'SQL Optimization', proficiency: 3, yearsUsed: 3.0 },
    ],
  },
  {
    email: 'ethan.walker@example.com',
    fullName: 'Ethan Walker',
    phone: '+1 206-555-0120',
    location: 'Seattle, WA',
    education: 'B.S. in Computer Science, Western Washington University',
    yearsExperience: 4.0,
    summary: 'Frontend Web Developer specializing in React, Next.js, Tailwind CSS, and state management.',
    resumeText: 'Ethan Walker is a front-end developer with 4 years creating modern single page applications. Proficient in React, Next.js, Tailwind CSS, and TypeScript.',
    skills: [
      { name: 'React', proficiency: 4, yearsUsed: 4.0 },
      { name: 'Next.js', proficiency: 4, yearsUsed: 3.0 },
      { name: 'Tailwind CSS', proficiency: 4, yearsUsed: 3.5 },
      { name: 'TypeScript', proficiency: 3, yearsUsed: 3.0 },
    ],
  },
];

async function runSeed() {
  console.log('🌱 Starting CareerLens Database Seeding Plan...');
  const seedDir = path.join(process.cwd(), 'db', 'seed');

  // Step 1: Run 01_skills.sql
  console.log('📚 Seeding 25 Skills catalog...');
  const skillsSql = fs.readFileSync(path.join(seedDir, '01_skills.sql'), 'utf-8');
  await query(skillsSql);

  // Step 2: Run 02_companies_recruiters.sql
  console.log('🏢 Seeding 4 Companies & 4 Recruiters...');
  const compRecSql = fs.readFileSync(path.join(seedDir, '02_companies_recruiters.sql'), 'utf-8');
  await query(compRecSql);

  // Step 3: Run 03_jobs.sql
  console.log('💼 Seeding 15 Jobs with weighted skills...');
  const jobsSql = fs.readFileSync(path.join(seedDir, '03_jobs.sql'), 'utf-8');
  await query(jobsSql);

  // Step 4: Seed 20 Candidates and candidate_skills
  console.log('👥 Seeding 20 Candidates and Skills...');
  const skillsRes = await query('SELECT skill_id, name FROM skills');
  const skillMap = new Map<string, number>(skillsRes.rows.map(r => [r.name, r.skill_id]));

  for (const c of CANDIDATES_DATA) {
    // 1. Create User
    const userRes = await query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'candidate')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING user_id`,
      [c.email, DEFAULT_HASH]
    );
    const userId = userRes.rows[0].user_id;

    // 2. Create or Update Candidate
    const candRes = await query(
      `INSERT INTO candidates (user_id, full_name, phone, location, education, years_experience, summary, resume_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         location = EXCLUDED.location,
         education = EXCLUDED.education,
         years_experience = EXCLUDED.years_experience,
         summary = EXCLUDED.summary,
         resume_text = EXCLUDED.resume_text
       RETURNING candidate_id`,
      [userId, c.fullName, c.phone, c.location, c.education, c.yearsExperience, c.summary, c.resumeText]
    );
    const candId = candRes.rows[0].candidate_id;

    // 3. Insert Skills
    for (const sk of c.skills) {
      const skillId = skillMap.get(sk.name);
      if (skillId) {
        await query(
          `INSERT INTO candidate_skills (candidate_id, skill_id, proficiency, years_used)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (candidate_id, skill_id) DO UPDATE SET
             proficiency = EXCLUDED.proficiency,
             years_used = EXCLUDED.years_used`,
          [candId, skillId, sk.proficiency, sk.yearsUsed]
        );
      }
    }
  }

  // Step 5: Seed 35 Vector Embeddings (15 jobs + 20 candidates)
  console.log('🧠 Generating 384-dimensional Vector Embeddings for Jobs & Candidates...');
  
  // Job embeddings
  const jobsRes = await query(`
    SELECT j.job_id, j.title, j.description,
           COALESCE(string_agg(s.name, ', '), '') AS skill_names
    FROM jobs j
    LEFT JOIN job_skills js ON js.job_id = j.job_id
    LEFT JOIN skills s ON s.skill_id = js.skill_id
    GROUP BY j.job_id, j.title, j.description
  `);

  for (const job of jobsRes.rows) {
    const text = `${job.title}. ${job.description} Skills required: ${job.skill_names}`;
    const vec = await generateEmbedding(text);
    const vecStr = formatVectorForPg(vec);

    await query(
      `INSERT INTO job_embeddings (job_id, embedding, model_name, updated_at)
       VALUES ($1, $2::vector, 'all-MiniLM-L6-v2', now())
       ON CONFLICT (job_id) DO UPDATE SET
         embedding = EXCLUDED.embedding,
         updated_at = now()`,
      [job.job_id, vecStr]
    );
  }

  // Candidate embeddings
  const candListRes = await query(`
    SELECT c.candidate_id, c.full_name, c.summary, c.resume_text,
           COALESCE(string_agg(s.name, ', '), '') AS skill_names
    FROM candidates c
    LEFT JOIN candidate_skills cs ON cs.candidate_id = c.candidate_id
    LEFT JOIN skills s ON s.skill_id = cs.skill_id
    GROUP BY c.candidate_id, c.full_name, c.summary, c.resume_text
  `);

  for (const cand of candListRes.rows) {
    const text = `${cand.summary || ''}. ${cand.resume_text}. Skills: ${cand.skill_names}`;
    const vec = await generateEmbedding(text);
    const vecStr = formatVectorForPg(vec);

    await query(
      `INSERT INTO resume_embeddings (candidate_id, embedding, model_name, updated_at)
       VALUES ($1, $2::vector, 'all-MiniLM-L6-v2', now())
       ON CONFLICT (candidate_id) DO UPDATE SET
         embedding = EXCLUDED.embedding,
         updated_at = now()`,
      [cand.candidate_id, vecStr]
    );
  }

  // Step 6: Seed 40 Applications with realistic history timeline & funnel distribution
  console.log('📝 Seeding 40 Applications with audit history...');

  // Funnel status distribution targets:
  // applied: 14, screening: 10, interview: 8, offer: 4, hired: 2, rejected: 2
  const statuses: ('applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected')[] = [
    // 2 Hired
    'hired', 'hired',
    // 4 Offer
    'offer', 'offer', 'offer', 'offer',
    // 8 Interview
    'interview', 'interview', 'interview', 'interview', 'interview', 'interview', 'interview', 'interview',
    // 10 Screening
    'screening', 'screening', 'screening', 'screening', 'screening', 'screening', 'screening', 'screening', 'screening', 'screening',
    // 2 Rejected
    'rejected', 'rejected',
    // 14 Applied
    'applied', 'applied', 'applied', 'applied', 'applied', 'applied', 'applied', 'applied', 'applied', 'applied', 'applied', 'applied', 'applied', 'applied'
  ];

  // We pair candidates and open jobs systematically
  const openJobsRes = await query("SELECT job_id FROM jobs WHERE status = 'open' ORDER BY job_id");
  const openJobIds = openJobsRes.rows.map(r => r.job_id);
  const candidatesRes = await query('SELECT candidate_id FROM candidates ORDER BY candidate_id');
  const candidateIds = candidatesRes.rows.map(r => r.candidate_id);

  let appCount = 0;
  // Generate 40 deterministic candidate-job pairs
  for (let i = 0; i < candidateIds.length; i++) {
    const candId = candidateIds[i];
    // Each candidate applies to 2 distinct jobs:
    const j1 = openJobIds[(i * 2) % openJobIds.length];
    const j2 = openJobIds[(i * 2 + 1) % openJobIds.length];

    for (const jId of [j1, j2]) {
      if (appCount >= 40) break;

      const finalStatus = statuses[appCount % statuses.length];
      const daysAgo = 30 - Math.floor(appCount * 0.7);

      // Compute match score using hybrid score function
      const scoreRes = await query('SELECT compute_hybrid_score($1, $2) AS score', [candId, jId]);
      const score = scoreRes.rows[0].score || 75.0;

      // Insert application
      const appRes = await query(
        `INSERT INTO applications (candidate_id, job_id, status, match_score, applied_at)
         VALUES ($1, $2, $3, $4, now() - ($5 || ' days')::interval)
         ON CONFLICT (candidate_id, job_id) DO UPDATE SET
           status = EXCLUDED.status,
           match_score = EXCLUDED.match_score
         RETURNING application_id`,
        [candId, jId, finalStatus, score, daysAgo]
      );
      const appId = appRes.rows[0].application_id;

      // Clean existing history for idempotent runs
      await query('DELETE FROM application_status_history WHERE application_id = $1', [appId]);

      // Insert Initial 'applied' history row
      await query(
        `INSERT INTO application_status_history (application_id, old_status, new_status, changed_at)
         VALUES ($1, NULL, 'applied', now() - ($2 || ' days')::interval)`,
        [appId, daysAgo]
      );

      // Add progression history according to finalStatus
      if (finalStatus !== 'applied') {
        const progression: { status: 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'; delta: number }[] = [];
        
        if (finalStatus === 'screening') {
          progression.push({ status: 'screening', delta: daysAgo - 4 });
        } else if (finalStatus === 'interview') {
          progression.push({ status: 'screening', delta: daysAgo - 4 });
          progression.push({ status: 'interview', delta: daysAgo - 8 });
        } else if (finalStatus === 'offer') {
          progression.push({ status: 'screening', delta: daysAgo - 4 });
          progression.push({ status: 'interview', delta: daysAgo - 8 });
          progression.push({ status: 'offer', delta: daysAgo - 12 });
        } else if (finalStatus === 'hired') {
          progression.push({ status: 'screening', delta: daysAgo - 5 });
          progression.push({ status: 'interview', delta: daysAgo - 10 });
          progression.push({ status: 'offer', delta: daysAgo - 15 });
          progression.push({ status: 'hired', delta: Math.max(1, daysAgo - 18) });
        } else if (finalStatus === 'rejected') {
          progression.push({ status: 'screening', delta: daysAgo - 4 });
          progression.push({ status: 'rejected', delta: Math.max(1, daysAgo - 7) });
        }

        let prev = 'applied';
        for (const step of progression) {
          await query(
            `INSERT INTO application_status_history (application_id, old_status, new_status, changed_at)
             VALUES ($1, $2, $3, now() - ($4 || ' days')::interval)`,
            [appId, prev, step.status, Math.max(1, step.delta)]
          );
          prev = step.status;
        }
      }

      appCount++;
    }
  }

  // Summary counts
  const finalCounts = await query(`
    SELECT 
      (SELECT COUNT(*) FROM skills) AS skills_count,
      (SELECT COUNT(*) FROM companies) AS companies_count,
      (SELECT COUNT(*) FROM recruiters) AS recruiters_count,
      (SELECT COUNT(*) FROM jobs) AS jobs_count,
      (SELECT COUNT(*) FROM candidates) AS candidates_count,
      (SELECT COUNT(*) FROM applications) AS applications_count,
      (SELECT COUNT(*) FROM application_status_history) AS history_count,
      (SELECT COUNT(*) FROM resume_embeddings) AS resume_emb_count,
      (SELECT COUNT(*) FROM job_embeddings) AS job_emb_count;
  `);

  console.log('🎉 Seeding successfully completed! Database counts:', finalCounts.rows[0]);
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Failed during seed:', err);
  process.exit(1);
});
