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
  compassOutline,
  arrowUpOutline,
  refreshOutline,
  warningOutline,
} from 'ionicons/icons';

import { SearchService } from '../../core/services/search.service';
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
            <ion-icon name="compass-outline"></ion-icon>
            SmartJob
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
      padding: 16px 0;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3);
    }

    .toolbar-transparent {
      --background: transparent;
      --color: white;
    }

    .app-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 22px;

      ion-icon {
        font-size: 26px;
      }
    }

    .dashboard-content {
      --background: var(--sj-surface);
    }

    .error-card {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 16px;
      padding: 16px;
      background: #fee2e2;
      border-radius: 12px;
      border-left: 4px solid #ef4444;

      ion-icon {
        font-size: 24px;
        color: #ef4444;
        flex-shrink: 0;
      }

      .error-title {
        margin: 0;
        font-weight: 600;
        color: #7f1d1d;
        font-size: 14px;
      }

      .error-subtitle {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: #b91c1c;
      }
    }

    .results-info {
      text-align: center;
      padding: 16px;
      font-size: 12px;
      color: var(--sj-text-tertiary);
    }
  `
})
export class DashboardPage implements OnInit {
  readonly searchService = inject(SearchService);
  readonly toastController = inject(ToastController);
  readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({
      'compass-outline': compassOutline,
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
  async onSearch(params: { query: string; location: string }): Promise<void> {
    console.log('[Dashboard] onSearch:', params);
    await this.searchService.search(params.query, params.location);
    this.cdr.detectChanges();
  }

  /**
   * Refrescar búsqueda actual
   */
  async onRefresh(event: CustomEvent): Promise<void> {
    const params = this.searchService.searchParams();
    await this.searchService.search(params.query, params.location);
    this.cdr.detectChanges();
    (event.target as HTMLIonRefresherElement).complete();
    this.showToast('✨ Actualizado', 'success');
  }

  /**
   * Guardar/desguardar trabajo
   */
  onToggleSave(jobId: string): void {
    console.log('[Dashboard] Toggle save:', jobId);
    this.showToast('💾 Oferta guardada', 'success');
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
