import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Job, TimeFilter } from '../models/job.model';

interface JobSearchResponse {
  jobs: Job[];
  total: number;
  returned: number;
  sources?: string[];
  errors?: Array<{ source: string; error: string }>;
  cached?: boolean;
}

interface RemoteJobsResponse {
  jobs: Job[];
  total: number;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  apis: {
    adzuna: { configured: boolean; name: string; requestsPerMonth: number };
    rapidapi: { configured: boolean; name: string; requestsPerMonth: number };
    remotive: { configured: boolean; name: string; requestsPerMonth: string };
    arbeitnow: { configured: boolean; name: string; requestsPerMonth: string };
  };
  cache: { entries: number; ttlMinutes: number };
  version: string;
}

@Injectable({ providedIn: 'root' })
export class LinkedInApiService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE = '/api';

  // Caché en memoria para sesión actual
  private readonly memoryCache = new Map<string, { data: Job[]; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutos

  /**
   * Busca empleos desde múltiples fuentes
   */
  async fetchJobs(
    keywords: string[],
    location: string,
    timeFilter: TimeFilter,
    options: { sources?: string[]; useCache?: boolean } = {}
  ): Promise<Job[]> {
    const query = keywords.slice(0, 5).join(' ') || 'developer';
    const limit = 50;
    const sources = options.sources?.join(',') || 'all';

    // Clave de caché
    const cacheKey = `${query}_${location}_${timeFilter}_${sources}`;
    
    // Verificar caché en memoria
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('[LinkedInApi] Usando caché en memoria');
        return cached;
      }
    }

    try {
      // Intentar backend proxy
      const response = await firstValueFrom(
        this.http.get<JobSearchResponse>(
          `${this.API_BASE}/jobs/search`,
          {
            params: {
              q: query,
              location: location || '',
              limit: limit.toString(),
              sources: sources,
            },
          }
        )
      );

      console.log(`[LinkedInApi] ✓ ${response.jobs.length} jobs from ${response.sources?.join(', ') || 'unknown'}`);
      
      if (response.errors && response.errors.length > 0) {
        console.warn('[LinkedInApi] Algunas fuentes fallaron:', response.errors);
      }

      // Normalizar fechas
      const jobs = response.jobs.map((job: any) => this.normalizeJob(job));
      
      // Guardar en caché
      this.setCache(cacheKey, jobs);
      
      return jobs;
    } catch (proxyError) {
      console.warn('[LinkedInApi] Backend proxy error:', proxyError);
      
      // Si es error 503 (servicio no disponible), intentar APIs directas
      if (proxyError instanceof HttpErrorResponse && proxyError.status === 503) {
        console.log('[LinkedInApi] Intentando APIs directas...');
        return this.fetchDirectly(query, limit);
      }
      
      throw proxyError;
    }
  }

  /**
   * Busca trabajos específicamente en Adzuna
   */
  async fetchAdzunaJobs(query: string, location: string = '', page: number = 1): Promise<Job[]> {
    const response = await firstValueFrom(
      this.http.get<JobSearchResponse>(
        `${this.API_BASE}/jobs/adzuna`,
        {
          params: {
            q: query,
            location: location,
            page: page.toString(),
          },
        }
      )
    );

    return response.jobs.map((job: any) => this.normalizeJob(job));
  }

  /**
   * Busca trabajos remotos específicamente
   */
  async fetchRemoteJobs(query: string, limit: number = 20): Promise<Job[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<RemoteJobsResponse>(
          `${this.API_BASE}/jobs/remote`,
          {
            params: { q: query, limit: limit.toString() },
          }
        )
      );

      return response.jobs.map((job: any) => this.normalizeJob(job));
    } catch (error) {
      console.warn('[LinkedInApi] Error fetching remote jobs:', error);
      return this.fetchRemotiveDirect(query, limit);
    }
  }

  /**
   * Obtiene sugerencias de skills
   */
  async getSkillSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await firstValueFrom(
        this.http.get<{ skills: string[] }>(
          `${this.API_BASE}/skills/suggest`,
          { params: { q: query } }
        )
      );
      return response.skills;
    } catch {
      return [];
    }
  }

  /**
   * Obtiene categorías de empleo disponibles
   */
  async getCategories(): Promise<Array<{ id: string; name: string; icon: string }>> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ categories: Array<{ id: string; name: string; icon: string }> }>(
          `${this.API_BASE}/categories`
        )
      );
      return response.categories;
    } catch {
      return [];
    }
  }

  /**
   * Health check del servidor con información detallada
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await firstValueFrom(
      this.http.get<HealthResponse>(`${this.API_BASE}/health`)
    );
    return response;
  }

  /**
   * Limpia la caché del servidor
   */
  async clearServerCache(): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.API_BASE}/cache/clear`, {})
    );
  }

  // ─── MÉTODOS PRIVADOS ─────────────────────────────────────

  private normalizeJob(job: any): Job {
    // Ensure postedAt is a valid Date
    let postedAt: Date;
    if (job.postedAt) {
      const parsed = new Date(job.postedAt);
      postedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      postedAt = new Date();
    }

    return {
      ...job,
      postedAt,
      linkedinUrl: job.linkedinUrl || job.sourceUrl || job.url || '',
      source: job.source || 'unknown',
      matchScore: job.matchScore || 0,
      matchBreakdown: job.matchBreakdown || {
        skillsMatch: 0,
        experienceMatch: 0,
        locationMatch: 0,
        seniorityMatch: 0,
      },
      saved: job.saved || false,
      applied: job.applied || false,
    };
  }

  private getFromCache(key: string): Job[] | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: Job[]): void {
    this.memoryCache.set(key, { data, timestamp: Date.now() });
    
    // Limpiar entradas antiguas si hay muchas
    if (this.memoryCache.size > 50) {
      const now = Date.now();
      for (const [k, v] of this.memoryCache.entries()) {
        if (now - v.timestamp > this.CACHE_TTL) {
          this.memoryCache.delete(k);
        }
      }
    }
  }

  /** Fallback: call APIs directly when backend proxy is down */
  private async fetchDirectly(query: string, limit: number): Promise<Job[]> {
    console.log('[LinkedInApi] Using direct API fallback...');
    
    const results = await Promise.allSettled([
      this.fetchRemotiveDirect(query, limit),
    ]);

    let jobs: Job[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        jobs.push(...result.value);
      }
    }

    return jobs
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
      .slice(0, limit);
  }

  /** Direct call to Remotive API (CORS-friendly) */
  private async fetchRemotiveDirect(query: string, limit: number): Promise<Job[]> {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=${limit}`;

    const response = await firstValueFrom(
      this.http.get<{ jobs: RemotiveJob[] }>(url)
    );

    return (response.jobs || []).map((raw) => this.normalizeRemotiveJob(raw));
  }

  private normalizeRemotiveJob(raw: RemotiveJob): Job {
    // Ensure postedAt is a valid Date
    let postedAt: Date;
    if (raw.publication_date) {
      const parsed = new Date(raw.publication_date);
      postedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      postedAt = new Date();
    }

    return {
      id: `remotive-${raw.id}`,
      title: raw.title || '',
      company: raw.company_name || '',
      companyLogo: raw.company_logo || undefined,
      location: raw.candidate_required_location || 'Remote',
      remote: 'remote',
      salary: this.parseSalary(raw.salary || ''),
      description: this.stripHtml(raw.description || ''),
      requirements: this.extractRequirements(raw.description || '', raw.tags || []),
      postedAt,
      linkedinUrl: raw.url || '',
      source: 'remotive',
      matchScore: 0,
      matchBreakdown: {
        skillsMatch: 0,
        experienceMatch: 0,
        locationMatch: 0,
        seniorityMatch: 0,
      },
      saved: false,
      applied: false,
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseSalary(
    raw: string
  ): { min: number; max: number; currency: string } | undefined {
    if (!raw || !raw.trim()) return undefined;
    const numbers = raw.match(/[\d,]+/g);
    if (!numbers || numbers.length === 0) return undefined;
    const vals = numbers
      .map((n) => parseInt(n.replace(/,/g, ''), 10))
      .filter(Boolean);
    if (vals.length === 0) return undefined;
    const currency = raw.includes('€')
      ? 'EUR'
      : raw.includes('£')
        ? 'GBP'
        : 'USD';
    return {
      min: Math.min(...vals),
      max: vals.length > 1 ? Math.max(...vals) : Math.min(...vals),
      currency,
    };
  }

  private readonly KNOWN_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Node.js', 'Express', 'NestJS',
    'Django', 'Flask', 'FastAPI', 'Spring', 'Laravel', '.NET', 'Rails',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'GraphQL', 'REST', 'HTML', 'CSS', 'SCSS', 'Tailwind',
    'Git', 'Linux', 'Agile', 'Scrum', 'SQL',
    'Machine Learning', 'TensorFlow', 'PyTorch',
    'React Native', 'Flutter', 'Ionic',
    'Figma', 'Kafka', 'Spark',
  ];

  private extractRequirements(description: string, tags: string[]): string[] {
    const text = this.stripHtml(description).toLowerCase();
    const found = new Set<string>(tags.map((t) => t.trim()).filter(Boolean));

    for (const skill of this.KNOWN_SKILLS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) {
        found.add(skill);
      }
    }

    return [...found].slice(0, 15);
  }
}

/** Remotive API response shape */
interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  company_logo: string;
  candidate_required_location: string;
  salary: string;
  description: string;
  tags: string[];
  publication_date: string;
  url: string;
  category: string;
  job_type: string;
}
