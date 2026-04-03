import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  IonSpinner,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Job } from '../../../../core/models/job.model';
import { JobCardComponent } from '../job-card/job-card';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [
    IonSpinner,
    CommonModule,
    JobCardComponent,
    ScrollingModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="jobs-list-container">
      @if (isLoading) {
        <div class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando empleos...</p>
        </div>
      } @else if (jobs.length === 0) {
        <app-empty-state
          title="No hay ofertas disponibles"
          description="No encontramos ofertas que coincidan con tu búsqueda. Intenta con términos diferentes."
          iconName="document-text-outline"
          [suggestions]="[
            'Prueba palabras clave más generales',
            'Ajusta tus filtros de ubicación',
            'Revisa tu conexión a internet'
          ]"
        ></app-empty-state>
      } @else {
        <cdk-virtual-scroll-viewport class="jobs-list-viewport" [itemSize]="jobItemHeight">
          <div class="jobs-list">
            @for (job of jobs; track job.id; let i = $index) {
              <div class="job-item" [style.animation-delay]="i * 50 + 'ms'">
                <app-job-card
                  [job]="job"
                  (save)="jobSave.emit($event)"
                  (dismiss)="jobDismiss.emit($event)"
                  (apply)="jobApply.emit($event)"
                ></app-job-card>
              </div>
            }
          </div>
        </cdk-virtual-scroll-viewport>

        @if (hasMore && !isLoading) {
          <div class="load-more-container">
            <button class="load-more-btn" (click)="loadMore.emit()">
              Cargar más empleos
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .jobs-list-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px;
      height: 100%;
    }

    .jobs-list-viewport {
      flex: 1;
      overflow-y: auto;
      position: relative;
    }

    .jobs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;

      ion-spinner {
        margin-bottom: 16px;
      }

      p {
        color: var(--sj-text-secondary);
        margin: 0;
      }
    }

    .jobs-list {
      --padding-start: 0;
      --padding-end: 0;
    }

    .job-item {
      animation: fade-in-up 0.5s ease forwards;
      opacity: 0;
    }

    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .load-more-container {
      display: flex;
      justify-content: center;
      padding: 32px 16px;
    }

    .load-more-btn {
      padding: 12px 32px;
      border-radius: 20px;
      border: 1px solid var(--sj-primary);
      background: white;
      color: var(--sj-primary);
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: var(--sj-primary);
        color: white;
      }

      &:active {
        transform: scale(0.98);
      }
    }
  `
})
export class JobsListComponent {
  @Input() jobs: Job[] = [];
  @Input() isLoading: boolean = false;
  @Input() hasMore: boolean = false;

  @Output() jobSave = new EventEmitter<string>();
  @Output() jobDismiss = new EventEmitter<string>();
  @Output() jobApply = new EventEmitter<string>();
  @Output() loadMore = new EventEmitter<void>();

  jobItemHeight = 320; // Approximate height of a job card in pixels
}
}
