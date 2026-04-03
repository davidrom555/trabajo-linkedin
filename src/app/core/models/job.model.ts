export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  remote: 'remote' | 'hybrid' | 'onsite';
  salary?: SalaryRange;
  description: string;
  requirements: string[];
  postedAt: Date;
  linkedinUrl: string;     // Can be any source URL (Remotive, Arbeitnow, etc.)
  source?: string;          // 'remotive' | 'arbeitnow' | 'linkedin'
  matchScore: number;       // 0–100
  matchBreakdown: MatchBreakdown;
  saved: boolean;
  applied: boolean;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface MatchBreakdown {
  skillsMatch: number;      // 0–100
  experienceMatch: number;  // 0–100
  locationMatch: number;    // 0–100
  seniorityMatch: number;   // 0–100
}

export type TimeFilter = '24h' | '48h' | '7d' | '30d' | 'all';
