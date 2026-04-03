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
}

export interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description: string;
  skills: string[];
}

export interface Education {
  degree: string;
  institution: string;
  field: string;
  startDate: string;
  endDate?: string;
}
