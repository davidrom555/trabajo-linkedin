export interface UserProfile {
  id: string;
  fullName: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  languages: string[];
  location: string;
  email?: string;
  phone?: string;
  cvFileName?: string;
  cvUploadedAt?: Date;
  avatar?: string; // Base64 encoded image
  extractionReport?: ExtractionReport; // Phase 5: Validation metrics
}

export interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description: string;
  skills: string[];
  achievements?: string[];
  technologies?: string[];
}

export interface Education {
  type?: 'degree' | 'certification' | 'bootcamp' | 'course';
  degree: string;
  institution: string;
  field?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string;
  relevantCoursework?: string[];
  status?: 'completed' | 'in-progress' | 'expected';
}

export interface ExtractionReport {
  overallCompleteness: number; // 0-100 percentage
  timestamp: Date;
  sections: {
    skills: { found: number; confidence: number };
    experience: { found: number; completeness: number; achievements: number };
    education: { found: number; completeness: number; types: { degree: number; certification: number; bootcamp: number } };
    languages: { found: number; withLevels: boolean };
    summary: { found: boolean; confidence: number; length: number };
    contact: { email: boolean; phone: boolean; location: boolean };
  };
  warnings: string[];
  suggestions: string[];
}
