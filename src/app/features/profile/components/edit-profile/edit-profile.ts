import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, addOutline, trashOutline } from 'ionicons/icons';
import { ProfileService } from '../../../../core/services/profile.service';
import { UserProfile } from '../../../../core/models/profile.model';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Editar Perfil</ion-title>
        <ion-button slot="end" fill="clear" (click)="closeModal()">
          <ion-icon name="close-outline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="form-container">
        <!-- Contact Section -->
        <div class="section">
          <h3 class="section-title">Contacto</h3>
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input [(ngModel)]="editedProfile.email" type="email"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Teléfono</ion-label>
              <ion-input [(ngModel)]="editedProfile.phone" type="tel"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Ubicación</ion-label>
              <ion-input [(ngModel)]="editedProfile.location"></ion-input>
            </ion-item>
          </ion-list>
        </div>

        <!-- Headline Section -->
        <div class="section">
          <h3 class="section-title">Titular Profesional</h3>
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Título / Rol</ion-label>
              <ion-input [(ngModel)]="editedProfile.headline"></ion-input>
            </ion-item>
          </ion-list>
        </div>

        <!-- Skills Section -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">Habilidades</h3>
            <ion-button size="small" fill="clear" (click)="addSkill()">
              <ion-icon name="add-outline"></ion-icon>
              Añadir
            </ion-button>
          </div>
          <div class="skills-list">
            @for (skill of editedProfile.skills; track skill; let i = $index) {
              <div class="skill-edit-item">
                <ion-input [(ngModel)]="editedProfile.skills[i]" placeholder="Habilidad"></ion-input>
                <ion-button size="small" fill="clear" color="danger" (click)="removeSkill(i)">
                  <ion-icon name="trash-outline"></ion-icon>
                </ion-button>
              </div>
            }
          </div>
        </div>

        <!-- Languages Section -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">Idiomas</h3>
            <ion-button size="small" fill="clear" (click)="addLanguage()">
              <ion-icon name="add-outline"></ion-icon>
              Añadir
            </ion-button>
          </div>
          <div class="languages-list">
            @for (lang of editedProfile.languages; track lang; let i = $index) {
              <div class="language-edit-item">
                <ion-input [(ngModel)]="editedProfile.languages[i]" placeholder="Idioma"></ion-input>
                <ion-button size="small" fill="clear" color="danger" (click)="removeLanguage(i)">
                  <ion-icon name="trash-outline"></ion-icon>
                </ion-button>
              </div>
            }
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="button-group">
          <ion-button expand="block" color="primary" (click)="saveChanges()">
            Guardar cambios
          </ion-button>
          <ion-button expand="block" fill="outline" (click)="closeModal()">
            Cancelar
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .form-container {
      padding: 16px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--sj-text-primary);
      margin: 0 0 12px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .skills-list,
    .languages-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .skill-edit-item,
    .language-edit-item {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .skill-edit-item ion-input,
    .language-edit-item ion-input {
      flex: 1;
    }

    .button-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 32px;
      padding-bottom: 24px;
    }

    ion-item {
      --padding-start: 0;
      --padding-end: 0;
    }
  `,
})
export class EditProfileComponent {
  readonly profileService = inject(ProfileService);
  readonly modalCtrl = inject(ModalController);
  readonly toastCtrl = inject(ToastController);

  editedProfile: UserProfile = {
    id: '',
    fullName: '',
    headline: '',
    summary: '',
    email: '',
    phone: '',
    location: '',
    skills: [],
    experience: [],
    education: [],
    languages: [],
    cvUploadedAt: new Date(),
    cvFileName: '',
    avatar: '',
  };

  constructor() {
    addIcons({ closeOutline, addOutline, trashOutline });
    this.loadProfile();
  }

  loadProfile(): void {
    const profile = this.profileService.profile();
    if (profile) {
      this.editedProfile = { ...profile };
    }
  }

  addSkill(): void {
    this.editedProfile.skills.push('');
  }

  removeSkill(index: number): void {
    this.editedProfile.skills.splice(index, 1);
  }

  addLanguage(): void {
    this.editedProfile.languages.push('');
  }

  removeLanguage(index: number): void {
    this.editedProfile.languages.splice(index, 1);
  }

  async saveChanges(): Promise<void> {
    // Filter empty skills and languages
    this.editedProfile.skills = this.editedProfile.skills.filter(s => s.trim());
    this.editedProfile.languages = this.editedProfile.languages.filter(l => l.trim());

    // Validate required fields
    if (!this.editedProfile.fullName.trim()) {
      await this.showToast('El nombre es requerido', 'danger');
      return;
    }

    try {
      this.profileService.updateProfile(this.editedProfile);
      await this.showToast('Perfil actualizado correctamente', 'success');
      await this.modalCtrl.dismiss();
    } catch (err) {
      await this.showToast('Error al guardar cambios', 'danger');
    }
  }

  async closeModal(): Promise<void> {
    await this.modalCtrl.dismiss();
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'primary'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
