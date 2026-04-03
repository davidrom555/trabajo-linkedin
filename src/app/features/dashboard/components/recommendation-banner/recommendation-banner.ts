import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IonCard, IonCardContent, IonButton, IonIcon, IonBadge, IonChip } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, sparklesOutline, checkmarkOutline } from 'ionicons/icons';
import { Job } from '../../../../core/models/job.model';

@Component({
  selector: 'app-recommendation-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonCard, IonCardContent, IonButton, IonIcon, IonBadge, IonChip, CommonModule],
  template: `
    @if (topJob && topJob.matchScore >= 70) {
      <div class="recommendation-container">
        <ion-card class="recommendation-card">
          <div class="recommendation-badge">
            <ion-icon name="sparkles-outline" class="sparkle-icon"></ion-icon>
            <span>TOP MATCH</span>
          </div>

          <ion-card-content class="recommendation-content">
            <div class="match-score">
              <div class="score-circle">{{ topJob.matchScore }}%</div>
            </div>

            <div class="job-info">
              <h3 class="job-title">{{ topJob.title }}</h3>
              <p class="job-company">{{ topJob.company }}</p>

              <div class="job-meta">
                <span class="meta-item">
                  <ion-icon name="location-outline"></ion-icon>
                  {{ topJob.location }}
                </span>
                @if (topJob.remote) {
                  <span class="meta-item remote">
                    <ion-icon name="wifi-outline"></ion-icon>
                    {{ topJob.remote === 'remote' ? 'Remoto' : 'Híbrido' }}
                  </span>
                }
              </div>

              <div class="matching-skills">
                <p class="matching-label">
                  <ion-icon name="checkmark-outline"></ion-icon>
                  {{ matchingSkillsCount }} skills coinciden
                </p>
                <div class="skills-preview">
                  @for (skill of topJob.matchBreakdown | keyvalue | slice:0:3; track skill.key) {
                    <span class="skill-tag">{{ skill.value }}%</span>
                  }
                </div>
              </div>
            </div>

            <div class="action-buttons">
              <ion-button
                expand="block"
                class="apply-btn"
                (click)="viewJob.emit(topJob.id)"
              >
                <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
                Ver Oportunidad
              </ion-button>
              <ion-button
                expand="block"
                fill="outline"
                (click)="save.emit(topJob.id)"
              >
                Guardar
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    }
  `,
  styles: `
    .recommendation-container {
      padding: 12px 16px;
      margin-bottom: 8px;
    }

    .recommendation-card {
      background: linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
      border: 2px solid var(--sj-primary-light);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }

    .recommendation-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: linear-gradient(135deg, var(--sj-primary) 0%, #10b981 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 0 16px 0 16px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sparkle-icon {
      font-size: 14px;
      animation: sparkle 2s ease-in-out infinite;
    }

    @keyframes sparkle {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .recommendation-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding-top: 24px;
    }

    .match-score {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .score-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--sj-primary) 0%, #10b981 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    }

    .job-info {
      flex: 1;
      min-width: 0;
    }

    .job-title {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 700;
      color: var(--sj-text-primary);
    }

    .job-company {
      margin: 0 0 12px;
      font-size: 14px;
      color: var(--sj-text-secondary);
    }

    .job-meta {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .meta-item {
      font-size: 12px;
      color: var(--sj-text-tertiary);
      display: flex;
      align-items: center;
      gap: 4px;

      ion-icon {
        font-size: 14px;
      }

      &.remote {
        color: var(--sj-primary);
        font-weight: 600;
      }
    }

    .matching-skills {
      background: white;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .matching-label {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--sj-primary);
      display: flex;
      align-items: center;
      gap: 4px;

      ion-icon {
        font-size: 14px;
      }
    }

    .skills-preview {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .skill-tag {
      font-size: 11px;
      background: var(--sj-primary-soft);
      color: var(--sj-primary-dark);
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      ion-button {
        flex: 1;
        min-width: 100px;
      }
    }

    .apply-btn {
      --background: var(--sj-primary);
      --color: white;
    }
  `
})
export class RecommendationBannerComponent {
  @Input() topJob: Job | null = null;
  @Output() viewJob = new EventEmitter<string>();
  @Output() save = new EventEmitter<string>();

  get matchingSkillsCount(): number {
    if (!this.topJob) return 0;
    const breakdown = this.topJob.matchBreakdown;
    return Object.values(breakdown).filter(score => score > 0).length;
  }

  constructor() {
    addIcons({ arrowForwardOutline, sparklesOutline, checkmarkOutline });
  }
}
