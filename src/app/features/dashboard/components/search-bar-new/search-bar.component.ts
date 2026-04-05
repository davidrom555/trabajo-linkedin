import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, closeOutline, locationOutline, timeOutline } from 'ionicons/icons';
import { JobService } from '../../../../core/services/job.service';
import { CountriesService } from '../../../../core/services/countries.service';
import { LocationPickerModalComponent } from '../location-picker-modal/location-picker-modal.component';
import { TimeFilter } from '../../../../core/models/job.model';

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
          [value]="query"
          placeholder="Buscar: developer, angular..."
          class="search-input"
          (input)="onQueryChange($event)"
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
        <span class="location-display">{{ getLocationDisplayName() }}</span>
        @if (getLocationFlagUrl()) {
          <img
            [src]="getLocationFlagUrl()"
            [alt]="getLocationName()"
            class="location-flag-image"
            loading="lazy"
            onerror="this.style.display='none'"
          />
        }
      </div>

      <!-- Time Filter -->
      <div class="time-filter">
        @for (t of timeFilters; track t.value) {
          <button
            type="button"
            class="time-chip"
            [class.active]="timeFilter === t.value"
            (click)="setTimeFilter(t.value)"
          >
            {{ t.label }}
          </button>
        }
      </div>

      <!-- Search Button -->
      <button class="search-button" (click)="onSearch()" type="button">
        Buscar
      </button>
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

    .location-display {
      flex: 1;
      text-align: center;
    }

    .location-flag-image {
      width: 24px;
      height: 18px;
      object-fit: cover;
      border-radius: 3px;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .time-filter {
      display: flex;
      gap: 8px;
      padding: 0 20px 16px;
      background: var(--sj-surface);
      overflow-x: auto;
    }

    .time-chip {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1.5px solid var(--sj-border);
      background: white;
      font-size: 13px;
      font-weight: 500;
      color: var(--sj-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .time-chip.active {
      background: var(--sj-primary);
      border-color: var(--sj-primary);
      color: white;
    }

    .time-chip:hover:not(.active) {
      border-color: var(--sj-primary);
      color: var(--sj-primary);
    }

    .search-button {
      width: 100%;
      padding: 14px 24px;
      margin-top: 8px;
      background: linear-gradient(135deg, var(--sj-primary) 0%, var(--sj-primary-dark) 100%);
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
      letter-spacing: 0.5px;

      &:hover {
        box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0px);
        box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
      }
    }
  `
})
export class SearchBarComponent {
  readonly jobService = inject(JobService);
  readonly countriesService = inject(CountriesService);

  @Output() search = new EventEmitter<{ query: string; location: string; timeFilter: TimeFilter }>();

  query = '';
  location = '';
  timeFilter: TimeFilter = 'all';
  isLocationModalOpen = false;

  readonly timeFilters: { value: TimeFilter; label: string }[] = [
    { value: '24h', label: 'Hoy' },
    { value: '7d', label: '7 días' },
    { value: '30d', label: '30 días' },
    { value: 'all', label: 'Todo' },
  ];

  constructor() {
    addIcons({ searchOutline, closeOutline, locationOutline, timeOutline });
    this.countriesService.loadCountries();
  }

  onQueryChange(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
  }

  onSearch(): void {
    // Si no hay query, usar 'developer' por defecto
    const query = this.query.trim() || 'developer';
    const location = this.location;
    const timeFilter = this.timeFilter;

    console.log('[SearchBar] onSearch:', { query, location, timeFilter });
    this.search.emit({ query, location, timeFilter });
  }

  clearSearch(): void {
    this.query = '';
    // Mantener la ubicación y filtro de tiempo seleccionados
    console.log('[SearchBar] clearSearch:', { location: this.location, timeFilter: this.timeFilter });
    this.search.emit({ query: 'developer', location: this.location, timeFilter: this.timeFilter });
  }

  setTimeFilter(filter: TimeFilter): void {
    this.timeFilter = filter;
    this.onSearch();
  }

  showLocationModal(): void {
    this.isLocationModalOpen = true;
  }

  closeLocationModal(): void {
    this.isLocationModalOpen = false;
  }

  selectLocation(code: string): void {
    const country = this.countriesService.getCountryByCode(code);
    this.location = country?.name || code;
    this.closeLocationModal();

    // Buscar automáticamente con la nueva ubicación
    console.log('[SearchBar] selectLocation:', { name: this.location, query: this.query });
    this.onSearch();
  }

  getLocationName(): string {
    if (!this.location) {
      return 'Todo el mundo';
    }

    const country = this.countriesService.getCountryByName(this.location);
    if (country) {
      return country.name;
    }

    const customCountries: { [key: string]: string } = {
      'Remote': 'Remoto',
    };

    return customCountries[this.location] || this.location || 'Todo el mundo';
  }

  getLocationDisplayName(): string {
    return this.getLocationName();
  }

  getLocationFlagUrl(): string {
    if (!this.location || this.location === '') {
      return '';
    }

    const country = this.countriesService.getCountryByName(this.location);
    if (country) {
      return country.flagUrl;
    }

    return '';
  }
}
