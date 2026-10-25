import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CareerLens | Job, Skill and Recruitment Management System',
  description: 'DBMS Experiential Learning Level 3 Project - PES University. Hybrid skill matching with PostgreSQL 16 and pgvector.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="bg-white border-t border-slate-200 py-6 text-sm text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <span className="font-bold text-slate-800">CareerLens</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span>DBMS Experiential Learning • Level 3 Project</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-slate-600">PES University (CSE)</span>
            </div>
            <div className="text-xs text-slate-400 text-center md:text-right">
              <span>Team: Sai Harshith R (PES1UG24CS398) & Saathvik Shenoy Padubidri (PES1UG24CS394) • Sec 19</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
