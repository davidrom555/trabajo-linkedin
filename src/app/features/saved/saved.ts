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
    <ion-header class="ion-no-border">
      <ion-toolbar class="saved-toolbar">
        <ion-title class="tw-font-bold tw-text-lg">Guardados</ion-title>
      </ion-toolbar>
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
    :host ::ng-deep ion-header {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .saved-toolbar {
      --background: var(--sj-surface);
      --color: var(--sj-text-primary);
      --padding-start: 20px;
      --padding-end: 20px;
    }

    .saved-toolbar ion-title {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
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
