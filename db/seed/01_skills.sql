-- ============================================================================
-- CareerLens: 25 Seed Skills Catalog
-- Categories: Web, Database, DevOps, Data, Soft
-- ============================================================================

INSERT INTO skills (name, category) VALUES
-- Web (6)
('React', 'Web'),
('Next.js', 'Web'),
('TypeScript', 'Web'),
('Node.js', 'Web'),
('Tailwind CSS', 'Web'),
('GraphQL', 'Web'),

-- Database (4)
('PostgreSQL', 'Database'),
('Redis', 'Database'),
('MongoDB', 'Database'),
('Elasticsearch', 'Database'),

-- DevOps & Cloud (6)
('Docker', 'DevOps'),
('Kubernetes', 'DevOps'),
('AWS', 'DevOps'),
('CI/CD Pipelines', 'DevOps'),
('Linux Administration', 'DevOps'),
('Terraform', 'DevOps'),

-- Data & ML (5)
('Python', 'Data'),
('Apache Kafka', 'Data'),
('PyTorch', 'Data'),
('Pandas & NumPy', 'Data'),
('SQL Optimization', 'Data'),

-- Soft Skills & Architecture (4)
('System Design', 'Soft'),
('Agile & Scrum', 'Soft'),
('Problem Solving', 'Soft'),
('Team Leadership', 'Soft')
ON CONFLICT (name) DO NOTHING;
