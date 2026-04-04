import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonFab,
  IonFabButton,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowUpOutline,
  refreshOutline,
  warningOutline,
} from 'ionicons/icons';

import { SearchService } from '../../core/services/search.service';
import { JobService } from '../../core/services/job.service';
import { TimeFilter } from '../../core/models/job.model';
import { JobsListComponent } from './components/jobs-list/jobs-list';
import { SearchBarComponent } from './components/search-bar-new/search-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonFab,
    IonFabButton,
    SearchBarComponent,
    JobsListComponent,
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

    <!-- Content -->
    <ion-content class="dashboard-content">
      <!-- Pull to Refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content
          pullingText="Desliza para actualizar"
          refreshingText="Actualizando..."
        ></ion-refresher-content>
      </ion-refresher>

      <!-- Search Bar -->
      <app-search-bar
        (search)="onSearch($event)"
      ></app-search-bar>

      <!-- Error Message -->
      <div *ngIf="searchService.error()" class="error-card">
        <ion-icon name="warning-outline"></ion-icon>
        <div>
          <p class="error-title">{{ searchService.error() }}</p>
          <p class="error-subtitle">Intenta nuevamente</p>
        </div>
      </div>

      <!-- Jobs List -->
      <app-jobs-list
        [jobs]="searchService.jobs()"
        [isLoading]="searchService.isLoading()"
        [hasMore]="false"
        (jobSave)="onToggleSave($event)"
        (jobDismiss)="onDismiss($event)"
        (jobApply)="onApply($event)"
      ></app-jobs-list>

      <!-- Results Info -->
      <div *ngIf="!searchService.isLoading() && searchService.jobs().length > 0" class="results-info">
        <span>{{ searchService.jobs().length }} trabajos encontrados</span>
      </div>
    </ion-content>

    <!-- Scroll to Top FAB -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed" *ngIf="searchService.jobs().length > 5">
      <ion-fab-button (click)="scrollToTop()" size="small">
        <ion-icon name="arrow-up-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  `,
  styles: `
    .header-gradient {
      background: linear-gradient(135deg, var(--sj-primary) 0%, var(--sj-primary-dark) 100%);
      padding: 20px 0;
      border-radius: 0 0 28px 28px;
      box-shadow: 0 8px 32px rgba(5, 150, 105, 0.25),
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

      .header-logo {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      }
    }

    .dashboard-content {
      --background: var(--sj-background);
    }

    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin: 20px 20px 0 20px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-radius: 16px;
      border: 1.5px solid #fca5a5;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .error-card ion-icon {
      font-size: 24px;
      color: #dc2626;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .error-title {
      margin: 0;
      font-weight: 700;
      color: #991b1b;
      font-size: 15px;
    }

    .error-subtitle {
      margin: 4px 0 0 0;
      font-size: 13px;
      color: #b91c1c;
    }

    .results-info {
      text-align: center;
      padding: 24px 16px;
      font-size: 13px;
      color: var(--sj-text-tertiary);
      font-weight: 500;
    }
  `
})
export class DashboardPage implements OnInit {
  readonly searchService = inject(SearchService);
  readonly jobService = inject(JobService);
  readonly toastController = inject(ToastController);
  readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({

      'arrow-up-outline': arrowUpOutline,
      'refresh-outline': refreshOutline,
      'warning-outline': warningOutline,
    });
  }

  ngOnInit(): void {
    console.log('[Dashboard] Initialized');
  }

  /**
   * Búsqueda principal
   */
  async onSearch(params: { query: string; location: string; timeFilter: TimeFilter }): Promise<void> {
    console.log('[Dashboard] onSearch:', params);
    await this.searchService.search(params.query, params.location, params.timeFilter);
    this.cdr.detectChanges();
  }

  /**
   * Refrescar búsqueda actual
   */
  async onRefresh(event: CustomEvent): Promise<void> {
    const params = this.searchService.searchParams();
    await this.searchService.search(params.query, params.location, params.timeFilter);
    this.cdr.detectChanges();
    (event.target as HTMLIonRefresherElement).complete();
    this.showToast('✨ Actualizado', 'success');
  }

  /**
   * Guardar/desguardar trabajo
   */
  onToggleSave(jobId: string): void {
    console.log('[Dashboard] Toggle save:', jobId);

    // Obtener estado actual ANTES de togglear
    const job = this.searchService.jobs().find(j => j.id === jobId);
    const currentSaved = job?.saved ?? false;
    const newSavedState = !currentSaved;

    // Actualizar en JobService
    this.jobService.toggleSaved(jobId);

    // Sincronizar en SearchService
    this.searchService.updateJobSavedState(jobId, newSavedState);

    this.cdr.detectChanges();

    const message = newSavedState ? '💾 Oferta guardada' : '🗑️ Oferta desmarcada';
    this.showToast(message, 'success');
  }

  /**
   * Descartar trabajo
   */
  onDismiss(jobId: string): void {
    console.log('[Dashboard] Dismiss:', jobId);
    this.showToast('✗ Oferta descartada', 'success');
  }

  /**
   * Marcar como aplicado
   */
  onApply(jobId: string): void {
    console.log('[Dashboard] Applied:', jobId);
    this.showToast('🎉 ¡Buena suerte!', 'success');
  }

  /**
   * Scroll al inicio
   */
  scrollToTop(): void {
    document.querySelector('ion-content')?.scrollToTop(500);
  }

  /**
   * Toast notification
   */
  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'primary' = 'primary'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
