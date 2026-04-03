import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Job, MatchBreakdown, TimeFilter } from '../models/job.model';
import { UserProfile } from '../models/profile.model';
import { ProfileService } from './profile.service';
import { LinkedInApiService } from './linkedin-api.service';

interface JobFilters {
  timeFilter: TimeFilter;
  searchQuery: string;
  remoteOnly: boolean;
  minSalary: number | null;
  sources: string[];
  location: string;
}

interface ApiStatus {
  adzuna: boolean;
  rapidapi: boolean;
  remotive: boolean;
  arbeitnow: boolean;
}

// Lista de países soportados por la API
export const SUPPORTED_COUNTRIES = [
  { code: '', name: 'Cualquier ubicación', flag: '🌍' },
  { code: 'Spain', name: 'España', flag: '🇪🇸' },
  { code: 'United States', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'United Kingdom', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'Germany', name: 'Alemania', flag: '🇩🇪' },
  { code: 'France', name: 'Francia', flag: '🇫🇷' },
  { code: 'Italy', name: 'Italia', flag: '🇮🇹' },
  { code: 'Portugal', name: 'Portugal', flag: '🇵🇹' },
  { code: 'Netherlands', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'Canada', name: 'Canadá', flag: '🇨🇦' },
  { code: 'Mexico', name: 'México', flag: '🇲🇽' },
  { code: 'Argentina', name: 'Argentina', flag: '🇦🇷' },
  { code: 'Brazil', name: 'Brasil', flag: '🇧🇷' },
  { code: 'Chile', name: 'Chile', flag: '🇨🇱' },
  { code: 'Colombia', name: 'Colombia', flag: '🇨🇴' },
  { code: 'Australia', name: 'Australia', flag: '🇦🇺' },
  { code: 'India', name: 'India', flag: '🇮🇳' },
  { code: 'Japan', name: 'Japón', flag: '🇯🇵' },
  { code: 'Singapore', name: 'Singapur', flag: '🇸🇬' },
  { code: 'Remote', name: 'Remoto / Anywhere', flag: '🌐' },
];

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly profileService = inject(ProfileService);
  private readonly linkedInApi = inject(LinkedInApiService);

  // ── State Signals ──────────────────────────────────────
  private readonly _jobs = signal<Job[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _timeFilter = signal<TimeFilter>('all');
  private readonly _searchQuery = signal('');
  private readonly _remoteOnly = signal(false);
  private readonly _minSalary = signal<number | null>(null);
  private readonly _selectedSources = signal<string[]>(['all']);
  private readonly _location = signal<string>('');
  private readonly _error = signal<string | null>(null);
  private readonly _lastFetchTime = signal<Date | null>(null);
  private readonly _apiStatus = signal<ApiStatus | null>(null);

  // ── Persisted State ────────────────────────────────────
  private readonly SAVED_JOBS_KEY = 'smartjob_saved_jobs';
  private readonly FILTERS_KEY = 'smartjob_filters';

  // ── Public Readonly Signals ────────────────────────────
  readonly isLoading = this._isLoading.asReadonly();
  readonly timeFilter = this._timeFilter.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly remoteOnly = this._remoteOnly.asReadonly();
  readonly minSalary = this._minSalary.asReadonly();
  readonly selectedSources = this._selectedSources.asReadonly();
  readonly location = this._location.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastFetchTime = this._lastFetchTime.asReadonly();
  readonly apiStatus = this._apiStatus.asReadonly();
  readonly supportedCountries = SUPPORTED_COUNTRIES;

  constructor() {
    // Cargar filtros guardados
    this.loadSavedFilters();
    
    // Verificar estado de APIs
    this.checkApiStatus();
    
    // Efecto para guardar filtros cuando cambien
    effect(() => {
      const filters: JobFilters = {
        timeFilter: this._timeFilter(),
        searchQuery: this._searchQuery(),
        remoteOnly: this._remoteOnly(),
        minSalary: this._minSalary(),
        sources: this._selectedSources(),
        location: this._location(),
      };
      localStorage.setItem(this.FILTERS_KEY, JSON.stringify(filters));
    });
  }

  /** All jobs with match scores calculated */
  readonly jobs = computed(() => {
    const profile = this.profileService.profile();
    const rawJobs = this._jobs();

    if (!profile) return rawJobs;

    return rawJobs.map((job) => {
      const breakdown = this.calculateMatchBreakdown(job, profile);
      const matchScore = this.calculateOverallScore(breakdown);
      return { ...job, matchScore, matchBreakdown: breakdown };
    });
  });

  /** Jobs filtered by all active filters */
  readonly filteredJobs = computed(() => {
    const jobs = this.jobs();
    const filter = this._timeFilter();
    const query = this._searchQuery().toLowerCase().trim();
    const remoteOnly = this._remoteOnly();
    const minSalary = this._minSalary();
    const now = Date.now();

    const cutoffMs: Record<TimeFilter, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '48h': 48 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };

    let timeFiltered = 0;
    let queryFiltered = 0;
    let remoteFiltered = 0;
    let salaryFiltered = 0;

    const result = jobs
      .filter((job) => {
        // Filtro de tiempo - solo si NO es 'all' y la fecha es válida
        if (filter !== 'all') {
          const postedDate = new Date(job.postedAt);
          // Verificar que la fecha sea válida
          if (!isNaN(postedDate.getTime())) {
            const age = now - postedDate.getTime();
            // Si el job es más viejo que el filtro, excluirlo
            if (age > cutoffMs[filter]) {
              timeFiltered++;
              return false;
            }
          }
        }

        // Filtro de búsqueda
        if (query && query.length > 0) {
          const jobText = `${job.title} ${job.company} ${job.location}`.toLowerCase();
          if (!jobText.includes(query)) {
            queryFiltered++;
            return false;
          }
        }

        // Filtro de remoto
        if (remoteOnly && job.remote === 'onsite') {
          remoteFiltered++;
          return false;
        }

        // Filtro de salario
        if (minSalary && job.salary) {
          const minSalaryValue = minSalary * 1000;
          if (job.salary.max < minSalaryValue) {
            salaryFiltered++;
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.matchScore - a.matchScore);
    
    return result;
  });

  /** Saved jobs - loaded from localStorage and merged with current jobs */
  readonly savedJobs = computed(() => {
    const savedIds = this.getSavedJobIds();
    return this.jobs().filter((j) => savedIds.has(j.id) || j.saved);
  });

  /** Stats for the dashboard header */
  readonly stats = computed(() => {
    const jobs = this.filteredJobs();
    const total = jobs.length;
    const highMatch = jobs.filter((j) => j.matchScore >= 75).length;
    const avgScore =
      total > 0
        ? Math.round(jobs.reduce((sum, j) => sum + j.matchScore, 0) / total)
        : 0;
    const remoteCount = jobs.filter((j) => j.remote === 'remote').length;

    return { total, highMatch, avgScore, remoteCount };
  });

  /** Available job sources with status */
  readonly availableSources = computed(() => {
    const status = this._apiStatus();
    return [
      { id: 'all', name: 'Todas', icon: 'globe-outline', active: true },
      { id: 'adzuna', name: 'Adzuna', icon: 'search-outline', active: status?.adzuna ?? true },
      { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', active: status?.rapidapi ?? true },
      { id: 'jsearch', name: 'JSearch', icon: 'flash-outline', active: status?.rapidapi ?? true },
      { id: 'remotive', name: 'Remotive', icon: 'wifi-outline', active: true },
      { id: 'arbeitnow', name: 'Arbeitnow', icon: 'business-outline', active: true },
    ];
  });

  // ── Actions ────────────────────────────────────────────

  async loadJobs(forceRefresh = false): Promise<void> {
    const profile = this.profileService.profile();
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Usar la ubicación seleccionada o la del perfil
      const location = this._location() || profile?.location || '';
      
      // Determinar keywords: usar búsqueda manual o skills del perfil
      const keywords = this._searchQuery() 
        ? [this._searchQuery()]
        : profile?.skills ?? ['developer'];
      
      // Determinar fuentes a usar
      const sources = this._selectedSources();
      const sourceParam = sources.includes('all') ? undefined : sources;

      const jobs = await this.linkedInApi.fetchJobs(
        keywords,
        location,
        this._timeFilter(),
        { sources: sourceParam, useCache: !forceRefresh }
      );

      // Fusionar con estado de guardados
      const savedIds = this.getSavedJobIds();
      const jobsWithSavedState = jobs.map(job => ({
        ...job,
        saved: savedIds.has(job.id)
      }));

      this._jobs.set(jobsWithSavedState);
      this._lastFetchTime.set(new Date());
    } catch (e: any) {
      console.error('Error loading jobs:', e);
      this._error.set(e.message || 'Error al cargar ofertas. Intenta de nuevo.');
    } finally {
      this._isLoading.set(false);
    }
  }

  async searchWithLocation(query: string, location: string): Promise<void> {
    this._searchQuery.set(query);
    this._location.set(location);
    await this.loadJobs(true);
  }

  async checkApiStatus(): Promise<void> {
    try {
      const health = await this.linkedInApi.healthCheck();
      this._apiStatus.set({
        adzuna: health.apis.adzuna.configured,
        rapidapi: health.apis.rapidapi.configured,
        remotive: health.apis.remotive.configured,
        arbeitnow: health.apis.arbeitnow.configured,
      });
    } catch (e) {
      console.warn('Could not check API status:', e);
      this._apiStatus.set({
        adzuna: false,
        rapidapi: false,
        remotive: true,
        arbeitnow: true,
      });
    }
  }

  setTimeFilter(filter: TimeFilter): void {
    this._timeFilter.set(filter);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  setLocation(location: string): void {
    this._location.set(location);
  }

  setRemoteOnly(value: boolean): void {
    this._remoteOnly.set(value);
  }

  setMinSalary(value: number | null): void {
    this._minSalary.set(value);
  }

  setSelectedSources(sources: string[]): void {
    this._selectedSources.set(sources);
  }

  toggleSaved(jobId: string): void {
    // Actualizar en memoria
    this._jobs.update((jobs) =>
      jobs.map((j) => (j.id === jobId ? { ...j, saved: !j.saved } : j))
    );

    // Actualizar localStorage
    const savedIds = this.getSavedJobIds();
    if (savedIds.has(jobId)) {
      savedIds.delete(jobId);
    } else {
      savedIds.add(jobId);
    }
    localStorage.setItem(this.SAVED_JOBS_KEY, JSON.stringify([...savedIds]));
  }

  markApplied(jobId: string): void {
    this._jobs.update((jobs) =>
      jobs.map((j) => (j.id === jobId ? { ...j, applied: true } : j))
    );
  }

  dismissJob(jobId: string): void {
    this._jobs.update((jobs) => jobs.filter((j) => j.id !== jobId));
  }

  clearError(): void {
    this._error.set(null);
  }

  clearFilters(): void {
    this._timeFilter.set('7d');
    this._searchQuery.set('');
    this._location.set('');
    this._remoteOnly.set(false);
    this._minSalary.set(null);
    this._selectedSources.set(['all']);
  }

  // ─── MÉTODOS PRIVADOS ───────────────────────────────────

  private getSavedJobIds(): Set<string> {
    try {
      const saved = localStorage.getItem(this.SAVED_JOBS_KEY);
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        return new Set(ids);
      }
    } catch {
      // Ignorar errores de localStorage
    }
    return new Set();
  }

  private loadSavedFilters(): void {
    try {
      const saved = localStorage.getItem(this.FILTERS_KEY);
      if (saved) {
        const filters: JobFilters = JSON.parse(saved);
        this._timeFilter.set(filters.timeFilter || '7d');
        this._searchQuery.set(filters.searchQuery || '');
        this._location.set(filters.location || '');
        this._remoteOnly.set(filters.remoteOnly || false);
        this._minSalary.set(filters.minSalary || null);
        this._selectedSources.set(filters.sources || ['all']);
      }
    } catch {
      // Ignorar errores
    }
  }

  // ── Matching Algorithm ─────────────────────────────────

  private calculateMatchBreakdown(job: Job, profile: UserProfile): MatchBreakdown {
    return {
      skillsMatch: this.scoreSkills(job, profile),
      experienceMatch: this.scoreExperience(job, profile),
      locationMatch: this.scoreLocation(job, profile),
      seniorityMatch: this.scoreSeniority(job, profile),
    };
  }

  private calculateOverallScore(breakdown: MatchBreakdown): number {
    const score =
      breakdown.skillsMatch * 0.4 +
      breakdown.experienceMatch * 0.25 +
      breakdown.locationMatch * 0.15 +
      breakdown.seniorityMatch * 0.2;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private scoreSkills(job: Job, profile: UserProfile): number {
    if (job.requirements.length === 0 || profile.skills.length === 0) return 50;

    const profileSkills = new Set(profile.skills.map((s) => s.toLowerCase()));
    const matches = job.requirements.filter((r) =>
      profileSkills.has(r.toLowerCase())
    );

    const coverage = matches.length / job.requirements.length;
    return Math.round(coverage * 100);
  }

  private scoreExperience(job: Job, profile: UserProfile): number {
    const totalYears = profile.experience.reduce((sum, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      return sum + (end.getTime() - start.getTime()) / (365.25 * 24 * 3600000);
    }, 0);

    const title = job.title.toLowerCase();
    let requiredYears = 3;
    if (title.includes('senior')) requiredYears = 5;
    if (title.includes('staff') || title.includes('lead')) requiredYears = 7;
    if (title.includes('principal') || title.includes('manager'))
      requiredYears = 10;

    if (totalYears >= requiredYears) return 100;
    if (totalYears >= requiredYears * 0.7) return 75;
    if (totalYears >= requiredYears * 0.5) return 50;
    return 30;
  }

  private scoreLocation(job: Job, profile: UserProfile): number {
    if (job.remote === 'remote') return 100;

    const jobLoc = job.location.toLowerCase();
    const profLoc = profile.location.toLowerCase();

    if (jobLoc === profLoc) return 100;

    const jobCountry = jobLoc.split(',').pop()?.trim() ?? '';
    const profCountry = profLoc.split(',').pop()?.trim() ?? '';

    if (jobCountry && jobCountry === profCountry) return 80;
    if (job.remote === 'hybrid') return 60;
    return 40;
  }

  private scoreSeniority(job: Job, profile: UserProfile): number {
    const seniorityLevels: Record<string, number> = {
      junior: 1,
      mid: 2,
      senior: 3,
      staff: 4,
      lead: 4,
      principal: 5,
      manager: 5,
      director: 6,
    };

    const extractLevel = (title: string): number => {
      const lower = title.toLowerCase();
      for (const [key, level] of Object.entries(seniorityLevels)) {
        if (lower.includes(key)) return level;
      }
      return 2;
    };

    const jobLevel = extractLevel(job.title);
    const profileLevel = Math.max(
      ...profile.experience.map((e) => extractLevel(e.title)),
      2
    );

    const diff = Math.abs(jobLevel - profileLevel);
    if (diff === 0) return 100;
    if (diff === 1) return 75;
    if (diff === 2) return 45;
    return 20;
  }
}
