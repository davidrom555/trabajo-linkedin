import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, closeOutline, locationOutline } from 'ionicons/icons';
import { JobService } from '../../../../core/services/job.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, IonIcon],
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
        <span>{{ getLocationName() }}</span>
      </div>
    </div>

    <!-- Location Modal -->
    <div *ngIf="isLocationModalOpen" class="location-modal" (click)="closeLocationModal()">
      <div class="location-modal-content" (click)="$event.stopPropagation()">
        <h3>Seleccionar ubicación</h3>
        <button
          class="location-item"
          (click)="selectLocation('')"
          [class.selected]="location === ''"
        >
          🌍 Todo el mundo
        </button>
        <button
          class="location-item"
          (click)="selectLocation('Spain')"
          [class.selected]="location === 'Spain'"
        >
          🇪🇸 España
        </button>
        <button
          class="location-item"
          (click)="selectLocation('United States')"
          [class.selected]="location === 'United States'"
        >
          🇺🇸 Estados Unidos
        </button>
        <button
          class="location-item"
          (click)="selectLocation('United Kingdom')"
          [class.selected]="location === 'United Kingdom'"
        >
          🇬🇧 Reino Unido
        </button>
        <button
          class="location-item"
          (click)="selectLocation('Germany')"
          [class.selected]="location === 'Germany'"
        >
          🇩🇪 Alemania
        </button>
        <button
          class="location-item"
          (click)="selectLocation('France')"
          [class.selected]="location === 'France'"
        >
          🇫🇷 Francia
        </button>
        <button
          class="location-item"
          (click)="selectLocation('Remote')"
          [class.selected]="location === 'Remote'"
        >
          🌐 Remoto
        </button>
      </div>
    </div>
  `,
  styles: `
    .search-container {
      padding: 16px;
      background: var(--sj-surface);
      gap: 12px;
      display: flex;
      flex-direction: column;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: white;
      border-radius: 12px;
      border: 1px solid var(--sj-border);
      position: relative;
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

      &::placeholder {
        color: var(--sj-text-tertiary);
      }
    }

    .clear-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: var(--sj-text-tertiary);
      font-size: 20px;
      flex-shrink: 0;
    }

    .location-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid var(--sj-border);
      font-size: 14px;
      color: var(--sj-text-primary);
    }

    .location-selector ion-icon {
      font-size: 18px;
      color: var(--sj-primary);
    }

    .location-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: flex-end;
      z-index: 1000;
    }

    .location-modal-content {
      width: 100%;
      background: white;
      border-radius: 16px 16px 0 0;
      padding: 24px 16px;
      max-height: 70vh;
      overflow-y: auto;

      h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
      }
    }

    .location-item {
      display: block;
      width: 100%;
      padding: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-size: 16px;
      color: var(--sj-text-primary);
      border-bottom: 1px solid var(--sj-border);
      transition: background 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--sj-surface-elevated);
      }

      &.selected {
        background: var(--sj-primary-soft);
        color: var(--sj-primary);
        font-weight: 600;
      }
    }
  `
})
export class SearchBarComponent {
  readonly jobService = inject(JobService);

  @Output() search = new EventEmitter<{ query: string; location: string }>();

  query = '';
  location = '';
  isLocationModalOpen = false;

  constructor() {
    addIcons({ searchOutline, closeOutline, locationOutline });
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

  getLocationName(): string {
    const locationMap: { [key: string]: string } = {
      '': '🌍 Todo el mundo',
      'Spain': '🇪🇸 España',
      'United States': '🇺🇸 Estados Unidos',
      'United Kingdom': '🇬🇧 Reino Unido',
      'Germany': '🇩🇪 Alemania',
      'France': '🇫🇷 Francia',
      'Remote': '🌐 Remoto',
    };
    return locationMap[this.location] || '🌍 Todo el mundo';
  }
}
