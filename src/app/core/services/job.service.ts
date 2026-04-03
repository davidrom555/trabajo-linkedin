import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Job, TimeFilter } from '../models/job.model';
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

  // ── Search State Management ────────────────────────────
  private _currentSearchId = signal<string>('');
  private _loadJobsPromise: Promise<void> | null = null;


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
    // Cargar filtros guardados (excepto timeFilter, que siempre es 'all')
    this.loadSavedFilters();

    // Verificar estado de APIs
    this.checkApiStatus();
    
    // Efecto para guardar filtros cuando cambien
    effect(() => {
      const filters: JobFilters = {
        timeFilter: 'all', // NO guardar timeFilter - siempre es 'all'
        searchQuery: this._searchQuery(),
        remoteOnly: false, // NO guardar remoteOnly - siempre es false
        minSalary: this._minSalary(),
        sources: this._selectedSources(),
        location: this._location(),
      };
      localStorage.setItem(this.FILTERS_KEY, JSON.stringify(filters));
    });
    
    // NOTA: El efecto automático de carga de trabajos fue DESACTIVADO
    // El usuario debe elegir manualmente cuándo buscar trabajos relacionados con su perfil
    // Esto evita múltiples llamadas automáticas a la API
  }

  /** All jobs */
  readonly jobs = computed(() => {
    return this._jobs();
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
          // Convertir a Date si es necesario
          const postedDate = typeof job.postedAt === 'string'
            ? new Date(job.postedAt)
            : job.postedAt;

          // Verificar que la fecha sea válida
          if (postedDate && !isNaN(postedDate.getTime())) {
            const age = now - postedDate.getTime();
            // Si el job es más viejo que el filtro, excluirlo
            if (age > cutoffMs[filter]) {
              timeFiltered++;
              return false;
            }
          } else {
            // Si la fecha es inválida pero el filtro es restrictivo, incluir el job
            // para no perder resultados por fechas corrupta
            console.warn('[JobService] Invalid date for job:', job.id, job.postedAt);
          }
        }

        // Filtro de búsqueda - busca en título, empresa, ubicación, descripción y requisitos
        if (query && query.length > 0) {
          const jobText = `${job.title} ${job.company} ${job.location} ${job.description} ${job.requirements.join(' ')}`.toLowerCase();
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

    console.log('[JobService] Filtered results:', {
      total: jobs.length,
      filtered: result.length,
      timeFilter: filter,
      query,
      remoteOnly,
      minSalary,
      excluded: { timeFiltered, queryFiltered, remoteFiltered, salaryFiltered }
    });

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
      { id: 'all', name: 'LinkedIn', icon: 'logo-linkedin', active: status?.rapidapi ?? true },
      { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', active: status?.rapidapi ?? true },
    ];
  });

  // ── Actions ────────────────────────────────────────────

  async loadJobs(forceRefresh = false): Promise<void> {
    // Generar ID único para esta búsqueda
    const searchId = `${Date.now()}-${Math.random()}`;
    this._currentSearchId.set(searchId);

    console.log('[JobService] NEW SEARCH:', {
      searchId,
      query: this._searchQuery(),
      location: this._location(),
      forceRefresh
    });

    // Limpiar datos anteriores INMEDIATAMENTE
    this._jobs.set([]);
    this._error.set(null);
    this._isLoading.set(true);

    // Prevenir llamadas concurrentes
    if (this._loadJobsPromise) {
      console.log('[JobService] Load already in progress, cancelling old search...');
      return this._loadJobsPromise;
    }

    // Crear la promesa de carga
    this._loadJobsPromise = this._doLoadJobs(searchId, forceRefresh);

    try {
      await this._loadJobsPromise;
    } finally {
      // Limpiar la promesa al finalizar (éxito o error)
      this._loadJobsPromise = null;
    }
  }

  private async _doLoadJobs(searchId: string, forceRefresh = false): Promise<void> {
    try {
      // Usar la ubicación seleccionada
      const location = this._location() || '';

      // Determinar keywords: usar búsqueda manual o default
      const keywords = this._searchQuery()
        ? [this._searchQuery()]
        : ['developer'];

      // Determinar fuentes a usar
      const sources = this._selectedSources();
      const sourceParam = sources.includes('all') ? undefined : sources;

      console.log('[JobService] Fetching jobs:', { searchId, keywords, location });

      // IMPORTANTE: Forzar sin caché en búsquedas nuevas
      const jobs = await this.linkedInApi.fetchJobs(
        keywords,
        location,
        this._timeFilter(),
        { sources: sourceParam, useCache: false } // ← SIEMPRE sin caché para búsquedas nuevas
      );

      // Validar que esta búsqueda es la actual
      if (searchId !== this._currentSearchId()) {
        console.log('[JobService] Ignoring old search results:', { searchId, currentSearchId: this._currentSearchId() });
        return; // Ignorar si es una búsqueda antigua
      }

      // Fusionar con estado de guardados
      const savedIds = this.getSavedJobIds();
      const jobsWithSavedState = jobs.map(job => ({
        ...job,
        saved: savedIds.has(job.id)
      }));

      console.log('[JobService] Setting jobs:', { searchId, count: jobsWithSavedState.length });
      this._jobs.set(jobsWithSavedState);
      this._lastFetchTime.set(new Date());
    } catch (e: any) {
      // Validar que aún es la búsqueda actual
      if (searchId === this._currentSearchId()) {
        console.error('Error loading jobs:', e);
        this._error.set(e.message || 'Error al cargar ofertas. Intenta de nuevo.');
      }
    } finally {
      // Solo desactivar loading si es la búsqueda actual
      if (searchId === this._currentSearchId()) {
        this._isLoading.set(false);
      }
    }
  }

  async searchWithLocation(query: string, location: string): Promise<void> {
    console.log('[JobService] searchWithLocation:', { query, location });
    this._searchQuery.set(query);
    this._location.set(location);
    await this.loadJobs(true); // forceRefresh = true para ignorar caché
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

  /**
   * Sincronizar jobs desde SearchService (mantiene saved state)
   */
  syncJobs(jobs: Job[]): void {
    const savedIds = this.getSavedJobIds();
    const jobsWithSavedState = jobs.map(job => ({
      ...job,
      saved: savedIds.has(job.id) || job.saved
    }));
    this._jobs.set(jobsWithSavedState);
  }

  toggleSaved(jobId: string): void {
    console.log('[JobService] toggleSaved called for:', jobId);

    // 1. Leer estado actual de localStorage
    const savedIds = this.getSavedJobIds();
    const isCurrentlySaved = savedIds.has(jobId);

    // 2. Alternar estado
    if (isCurrentlySaved) {
      savedIds.delete(jobId);
      console.log('[JobService] Removing from saved:', jobId);
    } else {
      savedIds.add(jobId);
      console.log('[JobService] Adding to saved:', jobId);
    }

    // 3. Guardar en localStorage
    const savedArray = Array.from(savedIds);
    localStorage.setItem(this.SAVED_JOBS_KEY, JSON.stringify(savedArray));
    console.log('[JobService] Saved to localStorage:', savedArray);

    // 4. Actualizar estado en memoria
    this._jobs.update((jobs) =>
      jobs.map((j) =>
        j.id === jobId ? { ...j, saved: !isCurrentlySaved } : j
      )
    );

    console.log('[JobService] Updated jobs state, new saved:', !isCurrentlySaved);
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
        // NO restaurar timeFilter - siempre comenzar con 'all' (sin filtro de fecha)
        // NO restaurar remoteOnly - siempre comenzar con false (mostrar todos)
        this._searchQuery.set(filters.searchQuery || '');
        this._location.set(filters.location || '');
        // this._remoteOnly.set(filters.remoteOnly || false); ← ELIMINADO
        this._minSalary.set(filters.minSalary || null);
        this._selectedSources.set(filters.sources || ['all']);
      }
    } catch {
      // Ignorar errores
    }
  }


}
