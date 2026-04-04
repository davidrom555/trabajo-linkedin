import { Injectable, inject, signal } from '@angular/core';
import { Job, TimeFilter } from '../models/job.model';
import { LinkedInApiService } from './linkedin-api.service';
import { JobService } from './job.service';

interface SearchParams {
  query: string;
  location: string;
  timeFilter: TimeFilter;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly linkedInApi = inject(LinkedInApiService);
  private readonly jobService = inject(JobService);

  // Estado simple
  private readonly _jobs = signal<Job[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _searchParams = signal<SearchParams>({ query: '', location: '', timeFilter: 'all' });

  // Solo readonly
  readonly jobs = this._jobs.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly searchParams = this._searchParams.asReadonly();

  /**
   * Ejecutar búsqueda limpia con filtros
   */
  async search(query: string, location: string = '', timeFilter: TimeFilter = 'all'): Promise<void> {
    console.log('[SearchService] NUEVA BÚSQUEDA:', { query, location, timeFilter });

    // 1. Limpiar estado anterior INMEDIATAMENTE
    this._jobs.set([]);
    this._error.set(null);
    this._isLoading.set(true);
    this._searchParams.set({ query, location, timeFilter });

    try {
      // 2. Sin caché - siempre traer datos frescos
      const jobs = await this.linkedInApi.fetchJobs(
        query ? [query] : ['developer'],
        location,
        'all',
        { sources: undefined, useCache: false }
      );

      console.log('[SearchService] ✓ Jobs obtenidos:', jobs.length);

      // 3. Aplicar filtro de fecha client-side
      let filteredJobs = jobs;
      if (timeFilter !== 'all') {
        const cutoffMs: Record<TimeFilter, number> = {
          '24h': 24 * 60 * 60 * 1000,
          '48h': 48 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
          'all': Infinity,
        };
        const now = Date.now();
        filteredJobs = jobs.filter(job => {
          const posted = typeof job.postedAt === 'string' ? new Date(job.postedAt) : job.postedAt;
          return posted && !isNaN(posted.getTime()) && (now - posted.getTime()) <= cutoffMs[timeFilter];
        });
        console.log('[SearchService] Filtro fecha aplicado:', { before: jobs.length, after: filteredJobs.length, timeFilter });
      }

      // 4. Establecer datos en SearchService
      this._jobs.set(filteredJobs);

      // 5. Sincronizar con JobService para que savedJobs() funcione correctamente
      this.jobService.syncJobs(filteredJobs);
    } catch (error: any) {
      console.error('[SearchService] ✗ Error:', error.message);
      this._error.set(error.message || 'Error en búsqueda');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Limpiar búsqueda
   */
  clear(): void {
    console.log('[SearchService] LIMPIAR búsqueda');
    this._jobs.set([]);
    this._error.set(null);
    this._searchParams.set({ query: '', location: '', timeFilter: 'all' });
  }

  /**
   * Actualizar el estado guardado de un trabajo específico
   */
  updateJobSavedState(jobId: string, isSaved: boolean): void {
    console.log('[SearchService] Actualizar estado guardado:', { jobId, isSaved });
    this._jobs.update(jobs =>
      jobs.map(job =>
        job.id === jobId ? { ...job, saved: isSaved } : job
      )
    );
  }
}
