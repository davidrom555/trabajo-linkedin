import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, closeOutline, locationOutline } from 'ionicons/icons';
import { JobService } from '../../../../core/services/job.service';
import { CountriesService } from '../../../../core/services/countries.service';
import { LocationPickerModalComponent } from '../location-picker-modal/location-picker-modal.component';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, IonIcon, LocationPickerModalComponent],
  template: `
    <div class="search-container">
      <!-- Search Input -->
      <div class="search-bar">
        <ion-icon name="search-outline" class="search-icon"></ion-icon>
        <input
          #searchInput
          type="text"
          placeholder="Buscar: developer, angular..."
          class="search-input"
          (keyup)="onQueryChange($event)"
          (keyup.enter)="onSearch()"
        />
        <button
          *ngIf="query.length > 0"
          class="clear-btn"
          (click)="clearSearch()"
          type="button"
        >
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>

      <!-- Location Selector -->
      <div class="location-selector" (click)="showLocationModal()">
        <ion-icon name="location-outline"></ion-icon>
        <span>{{ getLocationDisplayName() }}</span>
      </div>
    </div>

    <!-- Location Modal -->
    <app-location-picker-modal
      *ngIf="isLocationModalOpen"
      [selectedLocation]="location"
      (locationSelected)="selectLocation($event)"
      (closed)="closeLocationModal()"
    ></app-location-picker-modal>
  `,
  styles: `
    .search-container {
      padding: 20px;
      background: var(--sj-surface);
      gap: 16px;
      display: flex;
      flex-direction: column;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: white;
      border-radius: 14px;
      border: 1.5px solid var(--sj-border);
      position: relative;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      &:focus-within {
        border-color: var(--sj-primary);
        box-shadow: 0 1px 8px rgba(5, 150, 105, 0.12);
      }
    }

    .search-icon {
      color: var(--sj-text-tertiary);
      font-size: 20px;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 16px;
      color: var(--sj-text-primary);
      background: transparent;
      font-weight: 400;
      letter-spacing: 0.3px;

      &::placeholder {
        color: var(--sj-text-tertiary);
      }
    }

    .clear-btn {
      background: none;
      border: none;
      padding: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sj-text-tertiary);
      font-size: 20px;
      flex-shrink: 0;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        background: var(--sj-surface-elevated);
        color: var(--sj-text-secondary);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .location-selector {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: white;
      border-radius: 14px;
      cursor: pointer;
      border: 1.5px solid var(--sj-border);
      font-size: 15px;
      color: var(--sj-text-primary);
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      &:hover {
        border-color: var(--sj-primary);
        box-shadow: 0 1px 8px rgba(5, 150, 105, 0.12);
        background: linear-gradient(135deg, rgba(5, 150, 105, 0.02) 0%, rgba(5, 150, 105, 0.01) 100%);
      }

      &:active {
        transform: scale(0.98);
      }
    }

    .location-selector ion-icon {
      font-size: 18px;
      color: var(--sj-primary);
      flex-shrink: 0;
    }
  `
})
export class SearchBarComponent {
  readonly jobService = inject(JobService);
  readonly countriesService = inject(CountriesService);

  @Output() search = new EventEmitter<{ query: string; location: string }>();

  query = '';
  location = '';
  isLocationModalOpen = false;

  constructor() {
    addIcons({ searchOutline, closeOutline, locationOutline });
    this.countriesService.loadCountries();
  }

  onQueryChange(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
  }

  onSearch(): void {
    // Si no hay query, usar 'developer' por defecto
    const query = this.query.trim() || 'developer';
    const location = this.location;

    console.log('[SearchBar] onSearch:', { query, location });
    this.search.emit({ query, location });
  }

  clearSearch(): void {
    this.query = '';
    // Mantener la ubicación seleccionada cuando limpias la búsqueda
    console.log('[SearchBar] clearSearch with location:', this.location);
    this.search.emit({ query: 'developer', location: this.location });
  }

  showLocationModal(): void {
    this.isLocationModalOpen = true;
  }

  closeLocationModal(): void {
    this.isLocationModalOpen = false;
  }

  selectLocation(code: string): void {
    this.location = code;
    this.closeLocationModal();

    // Buscar automáticamente con la nueva ubicación
    console.log('[SearchBar] selectLocation:', { code, query: this.query });
    this.onSearch();
  }

  getLocationDisplayName(): string {
    if (!this.location) {
      return '🌍 Todo el mundo';
    }

    // Buscar por código de país (ISO 3166-1 alpha-2)
    const country = this.countriesService.getCountryByCode(this.location);
    if (country) {
      return `${country.flagEmoji} ${country.name}`;
    }

    // Si no es un código de país, es un país personalizado
    const customCountries: { [key: string]: string } = {
      'Remote': '🌐 Remoto',
    };

    return customCountries[this.location] || '🌍 Todo el mundo';
  }
}
