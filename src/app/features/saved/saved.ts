import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
} from '@ionic/angular/standalone';
import { JobService } from '../../core/services/job.service';
import { JobCardComponent } from '../dashboard/components/job-card/job-card';
import { EmptyStateComponent } from '../dashboard/components/empty-state/empty-state.component';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    JobCardComponent,
    EmptyStateComponent,
  ],
  template: `
    <!-- Header -->
    <ion-header class="ion-no-border">
      <div class="header-gradient">
        <ion-toolbar class="toolbar-transparent">
          <ion-title class="app-title">
            <img src="icon.png" alt="RapidWork" class="header-logo">
            RapidWork
          </ion-title>
        </ion-toolbar>
      </div>
    </ion-header>

    <ion-content class="saved-content">
      @if (jobService.savedJobs().length === 0) {
        <app-empty-state
          title="Sin ofertas guardadas"
          description="Aún no has guardado ninguna oferta de empleo"
          iconName="bookmark-outline"
          [suggestions]="[
            'Guarda tus ofertas favoritas para revisarlas después',
            'Compara múltiples posiciones deslizando'
          ]"
        ></app-empty-state>
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
    .header-gradient {
      background: linear-gradient(135deg, var(--sj-primary) 0%, var(--sj-primary-dark) 100%);
      padding: 20px 0;
      border-radius: 0 0 28px 28px;
      box-shadow: 0 8px 32px rgba(10, 102, 194, 0.25),
                  0 1px 0 rgba(255, 255, 255, 0.1) inset;
      position: relative;
    }

    .header-gradient::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
      border-radius: 0 0 28px 28px;
      pointer-events: none;
    }

    .toolbar-transparent {
      --background: transparent;
      --color: white;
      --padding-start: 20px;
      --padding-end: 20px;
    }

    .app-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 24px;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .saved-content {
      --background: var(--sj-background);
    }

    .jobs-list {
      background: transparent;
      padding: 16px;
    }
  `,
})
export class SavedPage {
  readonly jobService = inject(JobService);

  onToggleSave(jobId: string): void {
    this.jobService.toggleSaved(jobId);
  }

  onDismiss(jobId: string): void {
    this.jobService.dismissJob(jobId);
  }
}
