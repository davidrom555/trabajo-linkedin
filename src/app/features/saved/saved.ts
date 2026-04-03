import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookmarkOutline } from 'ionicons/icons';
import { JobService } from '../../core/services/job.service';
import { JobCardComponent } from '../dashboard/components/job-card/job-card';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonIcon,
    JobCardComponent,
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="saved-toolbar">
        <ion-title class="tw-font-bold tw-text-lg">Guardados</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="saved-content">
      @if (jobService.savedJobs().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-container">
            <ion-icon name="bookmark-outline" class="empty-icon"></ion-icon>
          </div>
          <h3 class="empty-title">
            Sin ofertas guardadas
          </h3>
          <p class="empty-subtitle">
            Desliza a la izquierda en una oferta para guardarla aquí.
          </p>
        </div>
      } @else {
        <ion-list lines="none" class="jobs-list">
          @for (job of jobService.savedJobs(); track job.id) {
            <app-job-card
              [job]="job"
              (save)="onToggleSave($event)"
              (dismiss)="onDismiss($event)"
            />
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: `
    .saved-toolbar {
      --background: var(--sj-surface);
      --color: var(--sj-text-primary);
    }
    
    .saved-content {
      --background: var(--sj-background);
    }
    
    .jobs-list {
      background: transparent;
      padding: 16px;
    }
    
    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 32px;
      text-align: center;
    }
    
    .empty-icon-container {
      width: 80px;
      height: 80px;
      border-radius: 24px;
      background: var(--sj-surface);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    
    .empty-icon {
      font-size: 36px;
      color: var(--sj-text-tertiary);
    }
    
    .empty-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--sj-text-primary);
      margin: 0 0 8px;
    }
    
    .empty-subtitle {
      font-size: 14px;
      color: var(--sj-text-secondary);
      margin: 0;
      line-height: 1.5;
    }
  `,
})
export class SavedPage {
  readonly jobService = inject(JobService);
  constructor() {
    addIcons({ 'bookmark-outline': bookmarkOutline });
  }

  onToggleSave(jobId: string): void {
    this.jobService.toggleSaved(jobId);
  }

  onDismiss(jobId: string): void {
    this.jobService.dismissJob(jobId);
  }
}
