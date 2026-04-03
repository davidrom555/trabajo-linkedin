import { Injectable, inject, signal } from '@angular/core';
import { Job } from '../models/job.model';
import { LinkedInApiService } from './linkedin-api.service';
import { JobService } from './job.service';

interface SearchParams {
  query: string;
  location: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly linkedInApi = inject(LinkedInApiService);
  private readonly jobService = inject(JobService);

  // Estado simple
  private readonly _jobs = signal<Job[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _searchParams = signal<SearchParams>({ query: '', location: '' });

  // Solo readonly
  readonly jobs = this._jobs.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly searchParams = this._searchParams.asReadonly();

  /**
   * Ejecutar búsqueda limpia
   */
  async search(query: string, location: string = ''): Promise<void> {
    console.log('[SearchService] NUEVA BÚSQUEDA:', { query, location });

    // 1. Limpiar estado anterior INMEDIATAMENTE
    this._jobs.set([]);
    this._error.set(null);
    this._isLoading.set(true);
    this._searchParams.set({ query, location });

    try {
      // 2. Sin caché - siempre traer datos frescos
      const jobs = await this.linkedInApi.fetchJobs(
        query ? [query] : ['developer'],
        location,
        'all',
        { sources: undefined, useCache: false }
      );

      console.log('[SearchService] ✓ Jobs obtenidos:', jobs.length);

      // 3. Establecer datos en SearchService
      this._jobs.set(jobs);

      // 4. Sincronizar con JobService para que savedJobs() funcione correctamente
      this.jobService.syncJobs(jobs);
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
    this._searchParams.set({ query: '', location: '' });
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
