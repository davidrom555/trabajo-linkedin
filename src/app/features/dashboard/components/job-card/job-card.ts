import { Component, input, output, computed, inject, signal } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonItemSliding,
  IonItem,
  IonItemOptions,
  IonItemOption,
  IonBadge,
  IonRippleEffect,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  timeOutline,
  bookmarkOutline,
  bookmark,
  openOutline,
  closeCircleOutline,
  cashOutline,
  laptopOutline,
  businessOutline,
  globeOutline,
  checkmarkCircleOutline,
  shareOutline,
  copyOutline,
  checkmarkOutline,
  trendingUpOutline,
 briefcaseOutline,
} from 'ionicons/icons';
import { Job } from '../../../../core/models/job.model';
import { MatchScoreRingComponent } from '../match-score-ring/match-score-ring';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [
    IonCard,
    IonCardContent,
    IonIcon,
    IonItemSliding,
    IonItem,
    IonItemOptions,
    IonItemOption,

    MatchScoreRingComponent,
  ],
  template: `
    <ion-item-sliding #slidingItem class="job-card-container">
      <!-- Swipe left: Guardar -->
      <ion-item-options side="start" class="save-options">
        <ion-item-option
          [color]="job().saved ? 'medium' : 'success'"
          (click)="onSave($event)"
          class="swipe-action save-action"
          expandable="true"
        >
          <div class="swipe-action-content">
            <ion-icon [name]="job().saved ? 'bookmark' : 'bookmark-outline'"></ion-icon>
            <span>{{ job().saved ? 'Guardado' : 'Guardar' }}</span>
          </div>
        </ion-item-option>
      </ion-item-options>

      <ion-item lines="none" class="job-item">
        <ion-card 
          class="job-card" 
          [class.saved]="job().saved"
          [class.applied]="job().applied"
          (click)="onCardClick()"
          button
          detail="false"
        >
          <ion-card-content class="job-card-content">
            <!-- Header: Logo + Info + Match Score -->
            <div class="job-header">
              <!-- Company Logo -->
              <div class="company-logo" [style.background]="getLogoGradient()">
                {{ job().company.charAt(0).toUpperCase() }}
                @if (job().companyLogo) {
                  <img [src]="job().companyLogo" [alt]="job().company" loading="lazy">
                }
              </div>

              <!-- Job Info -->
              <div class="job-info">
                <h3 class="job-title">{{ job().title }}</h3>
                <p class="company-name">{{ job().company }}</p>
                
                <!-- Badges row -->
                <div class="badges-row">
                  <span class="badge source-badge" [class]="'source-' + job().source">
                    <ion-icon [name]="getSourceIcon()"></ion-icon>
                    {{ sourceLabel() }}
                  </span>
                  
                  @if (job().remote !== 'onsite') {
                    <span class="badge remote-badge">
                      <ion-icon name="laptop-outline"></ion-icon>
                      {{ remoteLabel() }}
                    </span>
                  }
                  
                  @if (job().applied) {
                    <span class="badge applied-badge">
                      <ion-icon name="checkmark-circle-outline"></ion-icon>
                      Aplicado
                    </span>
                  }
                </div>
              </div>

              <!-- Match Score -->
              <div class="match-container">
                <app-match-score-ring
                  [score]="job().matchScore"
                  [size]="52"
                  [strokeWidth]="5"
                />
                <span class="match-label">Match</span>
              </div>
            </div>

            <!-- Details Row -->
            <div class="job-details">
              <div class="detail-item">
                <ion-icon name="location-outline"></ion-icon>
                <span>{{ job().location }}</span>
              </div>
              
              <div class="detail-item">
                <ion-icon name="time-outline"></ion-icon>
                <span>{{ timeAgo() }}</span>
              </div>
              
              @if (job().salary) {
                <div class="detail-item salary">
                  <ion-icon name="cash-outline"></ion-icon>
                  <span>{{ salaryText() }}</span>
                </div>
              }
            </div>

            <!-- Skills -->
            @if (visibleRequirements().length > 0) {
              <div class="skills-container">
                @for (skill of visibleRequirements(); track skill) {
                  <span 
                    class="skill-tag"
                    [class.matching]="isMatchingSkill(skill)"
                  >
                    {{ skill }}
                  </span>
                }
                @if (job().requirements.length > 5) {
                  <span class="skill-tag more">
                    +{{ job().requirements.length - 5 }}
                  </span>
                }
              </div>
            }

            <!-- Action Bar -->
            <div class="action-bar">
              <button
                class="action-btn save-btn"
                [class.active]="job().saved"
                (click)="onSave($event)"
                type="button"
              >
                <ion-icon [name]="job().saved ? 'bookmark' : 'bookmark-outline'"></ion-icon>
                <span>{{ job().saved ? 'Guardado' : 'Guardar' }}</span>
              </button>

              <button
                class="action-btn share-btn"
                (click)="onCopyLink($event)"
                type="button"
              >
                <ion-icon [name]="copied() ? 'checkmark-outline' : 'copy-outline'"></ion-icon>
                <span>{{ copied() ? 'Copiado' : 'Copiar' }}</span>
              </button>

              <button
                class="action-btn apply-btn"
                type="button"
                (click)="onApplyClick($event)"
              >
                <span>Ver oferta</span>
                <ion-icon name="open-outline"></ion-icon>
              </button>
            </div>
          </ion-card-content>
        </ion-card>
      </ion-item>

      <!-- Swipe right: Descartar -->
      <ion-item-options side="end" class="dismiss-options">
        <ion-item-option 
          color="danger" 
          (click)="onDismiss($event)"
          class="swipe-action dismiss-action"
          expandable="true"
        >
          <div class="swipe-action-content">
            <ion-icon name="close-circle-outline"></ion-icon>
            <span>Descartar</span>
          </div>
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  `,
  styles: `
    /* Container */
    .job-card-container {
      margin-bottom: 16px;
      overflow: visible;
    }
    
    /* Job Card */
    .job-card {
      width: 100%;
      margin: 0;
      border-radius: 16px;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
                  0 2px 6px rgba(0, 0, 0, 0.04);
      border: 1px solid #e5e7eb;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .job-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12),
                  0 8px 24px rgba(0, 0, 0, 0.06);
      border-color: #d1d5db;
      transform: translateY(-2px);
    }

    .job-card:active {
      transform: scale(0.98);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    .job-card.saved {
      border-color: var(--sj-primary);
      background: linear-gradient(135deg, rgba(5, 150, 105, 0.01) 0%, rgba(5, 150, 105, 0.005) 100%);
      box-shadow: 0 0 0 2px var(--sj-primary-soft),
                  0 4px 16px rgba(5, 150, 105, 0.12);
    }

    .job-card.applied {
      opacity: 0.9;
    }
    
    /* Card Content */
    .job-card-content {
      padding: 20px;
    }

    /* Header */
    .job-header {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: flex-start;
    }
    
    /* Company Logo */
    .company-logo {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--sj-primary-soft) 0%, #a7f3d0 100%);
      color: var(--sj-primary-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 22px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(5, 150, 105, 0.15);
    }
    
    .company-logo img {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    /* Job Info */
    .job-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .job-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--sj-text-primary);
      line-height: 1.3;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .company-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--sj-text-secondary);
      margin: 0;
    }
    
    /* Badges */
    .badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }
    
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .badge ion-icon {
      font-size: 12px;
    }

    .source-badge {
      background: #eff6ff;
      color: #1e40af;
      border-color: #dbeafe;
    }

    .source-badge.source-linkedin {
      background: #dbeafe;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }

    .source-badge.source-remotive {
      background: #f0fdf4;
      color: #15803d;
      border-color: #dcfce7;
    }

    .remote-badge {
      background: #f0f9ff;
      color: #0369a1;
      border-color: #e0f2fe;
    }

    .applied-badge {
      background: #f0fdf4;
      color: #065f46;
      border-color: #dcfce7;
    }
    
    /* Match Container */
    .match-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    
    .match-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--sj-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Job Details */
    .job-details {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 0;
      border-top: 1px solid var(--sj-border-light);
      border-bottom: 1px solid var(--sj-border-light);
      margin-bottom: 12px;
    }
    
    .detail-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--sj-text-secondary);
    }
    
    .detail-item ion-icon {
      font-size: 16px;
      color: var(--sj-text-tertiary);
    }
    
    .detail-item.salary {
      color: var(--sj-primary);
      font-weight: 600;
    }
    
    /* Skills */
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .skill-tag {
      padding: 6px 12px;
      background: var(--sj-surface-elevated);
      color: var(--sj-text-secondary);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--sj-border);
      transition: all 0.2s ease;
    }
    
    .skill-tag.matching {
      background: var(--sj-primary-soft);
      color: var(--sj-primary-dark);
      border-color: var(--sj-primary-light);
    }
    
    .skill-tag.more {
      background: transparent;
      color: var(--sj-text-tertiary);
      border-style: dashed;
    }
    
    /* Action Bar */
    .action-bar {
      display: flex;
      gap: 10px;
      margin-top: 4px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      flex: 1;
      background: white;
    }

    .action-btn:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .action-btn:active {
      transform: scale(0.95);
    }

    .save-btn {
      background: white;
      color: var(--sj-text-secondary);
      border: 1px solid #e5e7eb;
    }

    .save-btn.active {
      background: var(--sj-primary-soft);
      color: var(--sj-primary);
      border-color: var(--sj-primary-light);
    }

    .save-btn.active:hover {
      background: var(--sj-primary-soft);
    }

    .share-btn {
      background: white;
      color: var(--sj-text-secondary);
      border: 1px solid #e5e7eb;
    }

    .apply-btn {
      background: var(--sj-primary);
      color: white;
      flex: 1.5;
      border: none;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .apply-btn:hover {
      background: var(--sj-primary-dark);
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    }
    
    /* Swipe Actions */
    .swipe-action {
      border-radius: 20px;
      margin: 4px 8px;
    }
    
    .save-action {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    
    .dismiss-action {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    
    .swipe-action-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    
    /* Item styling */
    .job-item {
      --padding-start: 0;
      --padding-end: 0;
      --inner-padding-end: 0;
      --background: transparent;
    }
    
    /* Ripple effect */
    ion-ripple-effect {
      color: var(--sj-primary);
    }
  `,
})
export class JobCardComponent {
  private readonly toastController = inject(ToastController);

  readonly job = input.required<Job>();
  readonly save = output<string>();
  readonly dismiss = output<string>();
  readonly apply = output<string>();

  constructor() {
    addIcons({
      'location-outline': locationOutline,
      'time-outline': timeOutline,
      'bookmark-outline': bookmarkOutline,
      bookmark,
      'open-outline': openOutline,
      'close-circle-outline': closeCircleOutline,
      'cash-outline': cashOutline,
      'laptop-outline': laptopOutline,
      'business-outline': businessOutline,
      'globe-outline': globeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'share-outline': shareOutline,
      'copy-outline': copyOutline,
      'checkmark-outline': checkmarkOutline,
      'trending-up-outline': trendingUpOutline,
      'briefcase-outline': briefcaseOutline,
    });
  }

  readonly remoteLabel = computed(() => {
    const labels: Record<string, string> = {
      remote: 'Remoto',
      hybrid: 'Híbrido',
      onsite: 'Presencial',
    };
    return labels[this.job().remote] ?? this.job().remote;
  });

  readonly salaryText = computed(() => {
    const s = this.job().salary;
    if (!s) return '';
    const fmt = (n: number) =>
      n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
    return `${fmt(s.min)}-${fmt(s.max)} ${s.currency}`;
  });

  readonly sourceLabel = computed(() => {
    const labels: Record<string, string> = {
      remotive: 'Remotive',
      arbeitnow: 'Arbeitnow',
      linkedin: 'LinkedIn',
      jsearch: 'JSearch',
      adzuna: 'Adzuna',
    };
    return labels[this.job().source ?? ''] ?? 'Web';
  });

  readonly timeAgo = computed(() => {
    const diff = Date.now() - new Date(this.job().postedAt).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Ahora';
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'hace 1 día';
    return `hace ${days} días`;
  });

  readonly visibleRequirements = computed(() => {
    return this.job().requirements.slice(0, 5);
  });

  private copiedSignal = signal(false);
  readonly copied = this.copiedSignal.asReadonly();

  isMatchingSkill(skill: string): boolean {
    return false;
  }

  getSourceIcon(): string {
    const icons: Record<string, string> = {
      linkedin: 'business-outline',
      remotive: 'laptop-outline',
      arbeitnow: 'business-outline',
      jsearch: 'globe-outline',
      adzuna: 'search-outline',
      remoteok: 'wifi-outline',
    };
    return icons[this.job().source ?? ''] ?? 'globe-outline';
  }

  getLogoGradient(): string {
    const gradients = [
      'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
      'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    ];
    // Use company name char code to pick consistent gradient
    const index = this.job().company.charCodeAt(0) % gradients.length;
    return gradients[index];
  }

  onSave(event: Event): void {
    event.stopPropagation();
    this.save.emit(this.job().id);
  }

  onDismiss(event: Event): void {
    event.stopPropagation();
    this.dismiss.emit(this.job().id);
  }

  onCopyLink(event: Event): void {
    event.stopPropagation();

    if (!this.job().linkedinUrl) {
      console.warn('[JobCard] No linkedinUrl available');
      return;
    }

    navigator.clipboard.writeText(this.job().linkedinUrl).then(
      () => {
        console.log('[JobCard] URL copied successfully');
        this.copiedSignal.set(true);
        setTimeout(() => this.copiedSignal.set(false), 2000);
        this.showToast('📋 Enlace copiado', 'success');
      },
      (error) => {
        console.error('[JobCard] Copy failed:', error);
        this.showToast('Error al copiar', 'danger');
      }
    );
  }

  onApplyClick(event: Event): void {
    event.stopPropagation();
    this.apply.emit(this.job().id);
    if (this.job().linkedinUrl) {
      window.open(this.job().linkedinUrl, '_blank', 'noopener,noreferrer');
    }
  }

  onApply(event: Event): void {
    this.apply.emit(this.job().id);
  }

  onCardClick(): void {
    // Open job details or external link
    if (this.job().linkedinUrl) {
      window.open(this.job().linkedinUrl, '_blank', 'noopener,noreferrer');
    }
  }

  private showToast(message: string, color: 'success' | 'danger' = 'success'): void {
    this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    }).then(toast => {
      toast.present().catch(err => console.error('[JobCard] Toast present error:', err));
    }).catch(err => console.error('[JobCard] Toast create error:', err));
  }
}
