import { Component, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonBadge,
  IonFab,
  IonFabButton,
  ActionSheetController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  schoolOutline,
  briefcaseOutline,
  locationOutline,
  languageOutline,
  ribbonOutline,
  mailOutline,
  callOutline,
  calendarOutline,
  createOutline,
  cameraOutline,
  documentOutline,
  trashOutline,
  shareOutline,
  downloadOutline,
  checkmarkCircleOutline,
  timeOutline,
  trendingUpOutline,
  starOutline,
  flagOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { ProfileService } from '../../core/services/profile.service';
import { CvUploadComponent } from './components/cv-upload/cv-upload';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,

    IonButton,
    IonButtons,
    IonBadge,


    IonFab,
    IonFabButton,
    CvUploadComponent,
  ],
  template: `
    <!-- Header -->
    <ion-header class="ion-no-border profile-header">
      <div class="header-bg">
        <ion-toolbar class="toolbar-transparent">
          <ion-title>Mi Perfil</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="showOptions()" class="options-btn">
              <ion-icon name="create-outline" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </div>
    </ion-header>

    <ion-content class="profile-content">
      @if (profileService.hasProfile()) {
        @let profile = profileService.profile()!;

        <!-- Profile Hero Section -->
        <div class="profile-hero">
          <!-- Avatar -->
          <div class="avatar-container">
            <div class="avatar">
              {{ profile.fullName.charAt(0).toUpperCase() }}
              <div class="avatar-status"></div>
            </div>
            <button class="edit-avatar-btn" (click)="changeAvatar()">
              <ion-icon name="camera-outline"></ion-icon>
            </button>
          </div>

          <!-- Name & Title -->
          <h1 class="profile-name">{{ profile.fullName }}</h1>
          <p class="profile-title">{{ profile.headline }}</p>

          <!-- Location -->
          <div class="profile-location">
            <ion-icon name="location-outline"></ion-icon>
            <span>{{ profile.location || 'Ubicación no especificada' }}</span>
          </div>

          <!-- Profile Stats -->
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-number">{{ profile.skills.length }}</span>
              <span class="stat-label">Skills</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">{{ profile.experience.length }}</span>
              <span class="stat-label">Exp.</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">{{ profile.languages.length }}</span>
              <span class="stat-label">Idiomas</span>
            </div>
          </div>
        </div>

        <!-- Completeness Card -->
        <div class="completeness-card">
          <div class="completeness-header">
            <div class="completeness-title">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>Perfil completo</span>
            </div>
            <span class="completeness-percent">{{ profileService.profileCompleteness() }}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" [style.width.%]="profileService.profileCompleteness()"></div>
          </div>
          <p class="completeness-hint">
            @if (profileService.profileCompleteness() < 100) {
              Completa tu perfil para mejores recomendaciones
            } @else {
              ¡Excelente! Tu perfil está completo 🎉
            }
          </p>
        </div>

        <!-- CV Upload Card -->
        <div class="section-card upload-card">
          <div class="card-header">
            <div class="card-title">
              <ion-icon name="document-outline" class="icon-primary"></ion-icon>
              <span>Currículum</span>
            </div>
          </div>
          <app-cv-upload (uploaded)="onCvUploaded()" />
        </div>

        <!-- About Section -->
        @if (profile.summary) {
          <div class="section-card about-card">
            <div class="card-header">
              <div class="card-title">
                <ion-icon name="person-outline" class="icon-primary"></ion-icon>
                <span>Sobre mí</span>
              </div>
            </div>
            <p class="summary-text">{{ profile.summary }}</p>
          </div>
        }

        <!-- Skills Section -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-title">
              <ion-icon name="ribbon-outline" class="icon-primary"></ion-icon>
              <span>Skills</span>
            </div>
            <ion-badge class="count-badge">{{ profile.skills.length }}</ion-badge>
          </div>
          <div class="skills-grid">
            @for (skill of profile.skills; track skill; let i = $index) {
              <div class="skill-item" [style.animation-delay]="i * 30 + 'ms'">
                <ion-icon name="checkmark-circle-outline" class="skill-check"></ion-icon>
                <span>{{ skill }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Experience Section -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-title">
              <ion-icon name="briefcase-outline" class="icon-primary"></ion-icon>
              <span>Experiencia</span>
            </div>
            <ion-badge class="count-badge">{{ profile.experience.length }}</ion-badge>
          </div>
          <div class="experience-timeline">
            @for (exp of profile.experience; track exp.company + exp.startDate; let i = $index) {
              <div class="timeline-item" [style.animation-delay]="i * 100 + 'ms'">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                  <h4 class="timeline-title">{{ exp.title }}</h4>
                  <p class="timeline-company">{{ exp.company }}</p>
                  <div class="timeline-meta">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>{{ formatDate(exp.startDate) }} - {{ exp.endDate ? formatDate(exp.endDate) : 'Presente' }}</span>
                  </div>
                  @if (exp.description) {
                    <p class="timeline-description">{{ exp.description }}</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Education Section -->
        @if (profile.education.length > 0) {
          <div class="section-card">
            <div class="card-header">
              <div class="card-title">
                <ion-icon name="school-outline" class="icon-primary"></ion-icon>
                <span>Educación</span>
              </div>
              <ion-badge class="count-badge">{{ profile.education.length }}</ion-badge>
            </div>
            <div class="education-list">
              @for (edu of profile.education; track edu.institution + edu.startDate) {
                <div class="education-item">
                  <div class="education-icon">
                    <ion-icon name="school-outline"></ion-icon>
                  </div>
                  <div class="education-content">
                    <h4 class="education-degree">{{ edu.degree }}</h4>
                    <p class="education-institution">{{ edu.institution }}</p>
                    <p class="education-field">{{ edu.field }}</p>
                    @if (edu.startDate) {
                      <p class="education-date">
                        <ion-icon name="calendar-outline"></ion-icon>
                        {{ formatDate(edu.startDate) }}
                        @if (edu.endDate) {
                          - {{ formatDate(edu.endDate) }}
                        }
                      </p>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Languages Section -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-title">
              <ion-icon name="language-outline" class="icon-primary"></ion-icon>
              <span>Idiomas</span>
            </div>
          </div>
          <div class="languages-list">
            @for (lang of profile.languages; track lang) {
              <div class="language-badge">
                <ion-icon name="flag-outline"></ion-icon>
                <span>{{ lang }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Contact Info -->
        <div class="section-card">
          <div class="card-header">
            <div class="card-title">
              <ion-icon name="mail-outline" class="icon-primary"></ion-icon>
              <span>Contacto</span>
            </div>
          </div>
          <div class="contact-list">
            @if (profile.email) {
              <div class="contact-item">
                <ion-icon name="mail-outline"></ion-icon>
                <span>{{ profile.email }}</span>
              </div>
            }
            @if (profile.phone) {
              <div class="contact-item">
                <ion-icon name="call-outline"></ion-icon>
                <span>{{ profile.phone }}</span>
              </div>
            }
            @if (!profile.email && !profile.phone) {
              <p class="contact-empty">Sin información de contacto</p>
            }
          </div>
        </div>

        <!-- Spacer for FAB -->
        <div class="fab-spacer"></div>

      } @else {
        <!-- Empty State -->
        <div class="empty-profile">
          <div class="empty-illustration">
            <ion-icon name="document-outline"></ion-icon>
          </div>
          <h2 class="empty-title">Crea tu perfil</h2>
          <p class="empty-subtitle">
            Sube tu CV o completa tu información manualmente para empezar a recibir ofertas personalizadas
          </p>
          <app-cv-upload (uploaded)="onCvUploaded()" />
        </div>
      }

      <!-- Edit FAB -->
      @if (profileService.hasProfile()) {
        <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="profile-fab">
          <ion-fab-button (click)="showOptions()">
            <ion-icon name="create-outline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      }
    </ion-content>
  `,
  styles: `
    /* Header */
    .profile-header {
      position: relative;
    }
    
    .header-bg {
      background: linear-gradient(135deg, var(--sj-primary) 0%, var(--sj-primary-dark) 100%);
      padding-bottom: 60px;
      border-radius: 0 0 32px 32px;
    }
    
    .toolbar-transparent {
      --background: transparent;
      --color: white;
    }
    
    .options-btn {
      --color: white;
    }
    
    /* Content */
    .profile-content {
      --background: var(--sj-background);
    }
    
    /* Profile Hero */
    .profile-hero {
      background: white;
      margin: -50px 16px 16px;
      padding: 24px;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      text-align: center;
      position: relative;
      z-index: 10;
    }
    
    /* Avatar */
    .avatar-container {
      position: relative;
      display: inline-block;
      margin-bottom: 16px;
    }
    
    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--sj-primary-soft) 0%, #a7f3d0 100%);
      color: var(--sj-primary-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
      position: relative;
    }
    
    .avatar-status {
      position: absolute;
      bottom: 6px;
      right: 6px;
      width: 18px;
      height: 18px;
      background: #10b981;
      border: 3px solid white;
      border-radius: 50%;
    }
    
    .edit-avatar-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--sj-primary);
      color: white;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      
      ion-icon {
        font-size: 16px;
      }
    }
    
    .profile-name {
      font-size: 24px;
      font-weight: 700;
      color: var(--sj-text-primary);
      margin: 0 0 4px;
    }
    
    .profile-title {
      font-size: 15px;
      color: var(--sj-text-secondary);
      margin: 0 0 12px;
    }
    
    .profile-location {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: var(--sj-text-tertiary);
      font-size: 14px;
      margin-bottom: 20px;
      
      ion-icon {
        font-size: 16px;
      }
    }
    
    /* Profile Stats */
    .profile-stats {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--sj-border-light);
    }
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: var(--sj-primary);
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--sj-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-divider {
      width: 1px;
      height: 40px;
      background: var(--sj-border);
    }
    
    /* Completeness Card */
    .completeness-card {
      background: white;
      margin: 0 16px 16px;
      padding: 20px;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .completeness-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .completeness-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: var(--sj-text-primary);
      
      ion-icon {
        color: var(--sj-primary);
        font-size: 18px;
      }
    }
    
    .completeness-percent {
      font-size: 18px;
      font-weight: 700;
      color: var(--sj-primary);
    }
    
    .progress-bar-container {
      height: 8px;
      background: var(--sj-surface-elevated);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--sj-primary) 0%, var(--sj-primary-light) 100%);
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    
    .completeness-hint {
      font-size: 13px;
      color: var(--sj-text-secondary);
      margin: 0;
    }
    
    /* Section Cards */
    .section-card {
      background: white;
      margin: 0 16px 16px;
      padding: 20px;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 700;
      color: var(--sj-text-primary);
      
      .icon-primary {
        color: var(--sj-primary);
        font-size: 20px;
      }
    }
    
    .count-badge {
      --background: var(--sj-primary-soft);
      --color: var(--sj-primary-dark);
      font-size: 12px;
      font-weight: 600;
    }
    
    /* Upload Card */
    .upload-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border: 2px dashed var(--sj-primary-light);
    }
    
    /* Summary */
    .about-card {
      margin-bottom: 12px !important;
    }

    .summary-text {
      font-size: 14px;
      line-height: 1.6;
      color: var(--sj-text-secondary);
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    /* Skills Grid */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .skill-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--sj-surface-elevated);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      color: var(--sj-text-primary);
      animation: scale-in 0.3s ease forwards;
      opacity: 0;
      
      .skill-check {
        font-size: 14px;
        color: var(--sj-primary);
      }
    }
    
    @keyframes scale-in {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    /* Experience Timeline */
    .experience-timeline {
      position: relative;
      padding-left: 28px;
    }
    
    .experience-timeline::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: var(--sj-border);
    }
    
    .timeline-item {
      position: relative;
      padding-bottom: 20px;
      animation: slide-in-left 0.5s ease forwards;
      opacity: 0;
    }
    
    @keyframes slide-in-left {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .timeline-marker {
      position: absolute;
      left: -24px;
      top: 4px;
      width: 12px;
      height: 12px;
      background: var(--sj-primary);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .timeline-content {
      padding-left: 4px;
    }
    
    .timeline-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--sj-text-primary);
      margin: 0 0 4px;
    }
    
    .timeline-company {
      font-size: 14px;
      color: var(--sj-primary);
      font-weight: 500;
      margin: 0 0 8px;
    }
    
    .timeline-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--sj-text-tertiary);
      margin-bottom: 8px;
      
      ion-icon {
        font-size: 14px;
      }
    }
    
    .timeline-description {
      font-size: 13px;
      color: var(--sj-text-secondary);
      line-height: 1.6;
      margin: 8px 0 0 0;
      padding: 10px;
      background: var(--sj-surface-elevated);
      border-radius: 8px;
    }
    
    /* Education */
    .education-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .education-item {
      display: flex;
      gap: 14px;
    }
    
    .education-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--sj-primary-soft);
      color: var(--sj-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    
    .education-content {
      flex: 1;
    }
    
    .education-degree {
      font-size: 15px;
      font-weight: 600;
      color: var(--sj-text-primary);
      margin: 0 0 4px;
    }
    
    .education-institution {
      font-size: 14px;
      color: var(--sj-text-secondary);
      margin: 0 0 2px;
    }
    
    .education-field {
      font-size: 13px;
      color: var(--sj-text-tertiary);
      margin: 0;
    }

    .education-date {
      font-size: 12px;
      color: var(--sj-text-tertiary);
      margin: 6px 0 0 0;
      display: flex;
      align-items: center;
      gap: 4px;

      ion-icon {
        font-size: 12px;
      }
    }
    
    /* Languages */
    .languages-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .language-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: var(--sj-surface-elevated);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      color: var(--sj-text-primary);
      
      ion-icon {
        color: var(--sj-primary);
        font-size: 14px;
      }
    }
    
    /* Contact */
    .contact-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .contact-empty {
      font-size: 13px;
      color: var(--sj-text-tertiary);
      margin: 0;
      font-style: italic;
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 14px;
      color: var(--sj-text-secondary);
      word-break: break-all;

      ion-icon {
        font-size: 18px;
        color: var(--sj-text-tertiary);
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
    
    /* FAB */
    .profile-fab {
      margin-bottom: 16px;
    }
    
    .fab-spacer {
      height: 80px;
    }
    
    /* Empty State */
    .empty-profile {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 32px;
      text-align: center;
    }
    
    .empty-illustration {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: var(--sj-surface-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      
      ion-icon {
        font-size: 56px;
        color: var(--sj-text-tertiary);
      }
    }
    
    .empty-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--sj-text-primary);
      margin: 0 0 8px;
    }
    
    .empty-subtitle {
      font-size: 15px;
      color: var(--sj-text-secondary);
      line-height: 1.5;
      margin: 0 0 32px;
    }
  `,
})
export class ProfilePage {
  readonly profileService = inject(ProfileService);
  readonly actionSheetCtrl = inject(ActionSheetController);
  readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
      'school-outline': schoolOutline,
      'briefcase-outline': briefcaseOutline,
      'location-outline': locationOutline,
      'language-outline': languageOutline,
      'ribbon-outline': ribbonOutline,
      'mail-outline': mailOutline,
      'call-outline': callOutline,
      'calendar-outline': calendarOutline,
      'create-outline': createOutline,
      'camera-outline': cameraOutline,
      'document-outline': documentOutline,
      'trash-outline': trashOutline,
      'share-outline': shareOutline,
      'download-outline': downloadOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'time-outline': timeOutline,
      'trending-up-outline': trendingUpOutline,
      'star-outline': starOutline,
      'flag-outline': flagOutline,
      'alert-circle-outline': alertCircleOutline,
    });
  }

  onCvUploaded(): void {
    this.showToast('✨ CV procesado correctamente', 'success');
  }

  async showOptions(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Opciones de perfil',
      buttons: [
        {
          text: 'Editar perfil',
          icon: 'create-outline',
          handler: () => this.editProfile(),
        },
        {
          text: 'Subir nuevo CV',
          icon: 'document-outline',
          handler: () => this.uploadCv(),
        },
        {
          text: 'Compartir perfil',
          icon: 'share-outline',
          handler: () => this.shareProfile(),
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  async changeAvatar(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Cambiar foto',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera-outline',
          handler: () => this.takePhoto(),
        },
        {
          text: 'Elegir de galería',
          icon: 'image-outline',
          handler: () => this.choosePhoto(),
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short' 
    });
  }

  private editProfile(): void {
    this.showToast('Editar perfil - Próximamente', 'primary');
  }

  private uploadCv(): void {
    this.showToast('Subir CV - Abrir selector', 'primary');
  }

  private shareProfile(): void {
    this.showToast('Perfil compartido', 'success');
  }

  private takePhoto(): void {
    this.showToast('Cámara - Próximamente', 'primary');
  }

  private choosePhoto(): void {
    this.showToast('Galería - Próximamente', 'primary');
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'primary'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
