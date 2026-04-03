import { Component, inject, output } from '@angular/core';
import {
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, documentTextOutline, checkmarkCircle } from 'ionicons/icons';
import { ProfileService } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-cv-upload',
  standalone: true,
  imports: [IonIcon, IonSpinner],
  template: `
    <div
      class="tw-border-2 tw-border-dashed tw-rounded-2xl tw-p-8 tw-text-center tw-transition-colors tw-cursor-pointer"
      [class]="
        profileService.hasProfile()
          ? 'tw-border-emerald-300 tw-bg-emerald-50'
          : isDragOver
            ? 'tw-border-emerald-400 tw-bg-emerald-50'
            : 'tw-border-gray-200 tw-bg-gray-50 hover:tw-border-emerald-300'
      "
      (click)="fileInput.click()"
      (dragover)="onDragOver($event)"
      (dragleave)="isDragOver = false"
      (drop)="onDrop($event)"
    >
      @if (profileService.isLoading()) {
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-3">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p class="tw-text-sm tw-text-gray-600 tw-m-0">Analizando tu CV con IA...</p>
        </div>
      } @else if (profileService.hasProfile()) {
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-2">
          <ion-icon name="checkmark-circle" class="tw-text-4xl tw-text-emerald-500"></ion-icon>
          <p class="tw-text-sm tw-font-medium tw-text-emerald-700 tw-m-0">CV procesado</p>
          <p class="tw-text-xs tw-text-gray-500 tw-m-0">
            {{ profileService.profile()?.cvFileName }}
          </p>
          <button
            class="tw-text-xs tw-text-emerald-600 tw-underline tw-mt-1"
            (click)="fileInput.click(); $event.stopPropagation()"
          >
            Subir otro CV
          </button>
        </div>
      } @else {
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-2">
          <div class="tw-w-14 tw-h-14 tw-rounded-2xl tw-bg-emerald-100 tw-flex tw-items-center tw-justify-center">
            <ion-icon name="cloud-upload-outline" class="tw-text-2xl tw-text-emerald-600"></ion-icon>
          </div>
          <p class="tw-text-sm tw-font-medium tw-text-gray-800 tw-m-0">
            Arrastra tu CV o toca para seleccionar
          </p>
          <p class="tw-text-xs tw-text-gray-400 tw-m-0">PDF, DOC, DOCX — Máx 10MB</p>
        </div>
      }
    </div>

    <input
      #fileInput
      type="file"
      accept=".pdf,.doc,.docx"
      class="tw-hidden"
      (change)="onFileSelected($event)"
    />
  `,
})
export class CvUploadComponent {
  readonly profileService = inject(ProfileService);
  readonly uploaded = output<void>();
  isDragOver = false;

  constructor() {
    addIcons({
      'cloud-upload-outline': cloudUploadOutline,
      'document-text-outline': documentTextOutline,
      'checkmark-circle': checkmarkCircle,
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  private async processFile(file: File): Promise<void> {
    if (file.size > 10 * 1024 * 1024) {
      // In production: show toast
      console.warn('File too large');
      return; 
    }
    await this.profileService.uploadCv(file);
    this.uploaded.emit();
  }
}
