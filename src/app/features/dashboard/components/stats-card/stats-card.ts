import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trendingUpOutline, flashOutline, globeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [IonCard, IonCardContent, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-card class="stats-card">
      <ion-card-content>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon trending">
              <ion-icon name="trending-up-outline"></ion-icon>
            </div>
            <div class="stat-content">
              <p class="stat-label">Total de Ofertas</p>
              <p class="stat-value">{{ totalJobs }}</p>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon flash">
              <ion-icon name="flash-outline"></ion-icon>
            </div>
            <div class="stat-content">
              <p class="stat-label">Top Match</p>
              <p class="stat-value">{{ topScore }}%</p>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon globe">
              <ion-icon name="globe-outline"></ion-icon>
            </div>
            <div class="stat-content">
              <p class="stat-label">Promedio Score</p>
              <p class="stat-value">{{ avgScore }}%</p>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon remote">
              <ion-icon name="wifi-outline"></ion-icon>
            </div>
            <div class="stat-content">
              <p class="stat-label">Ofertas Remoto</p>
              <p class="stat-value">{{ remoteCount }}</p>
            </div>
          </div>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: `
    .stats-card {
      margin: 12px 16px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;

      &.trending {
        background: rgba(5, 150, 105, 0.1);
        color: #059669;
      }

      &.flash {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
      }

      &.globe {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      &.remote {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 11px;
      color: var(--sj-text-tertiary);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--sj-text-primary);
      margin: 0;
    }
  `
})
export class StatsCardComponent {
  @Input() totalJobs: number = 0;
  @Input() topScore: number = 0;
  @Input() avgScore: number = 0;
  @Input() remoteCount: number = 0;

  constructor() {
    addIcons({ trendingUpOutline, flashOutline, globeOutline });
  }
}
