import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { closeOutline, searchOutline } from 'ionicons/icons';

interface LocationOption {
  code: string;
  name: string;
  region: string;
  flag: string;
}

@Component({
  selector: 'app-location-picker-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  template: `
    <div class="location-modal-backdrop" (click)="close()">
      <div class="location-modal" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <h2>Seleccionar Ubicación</h2>
          <button class="close-btn" (click)="close()">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <!-- Search Input -->
        <div class="search-container">
          <ion-icon name="search-outline" class="search-icon"></ion-icon>
          <input
            type="text"
            placeholder="Buscar país..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch()"
            class="search-input"
          />
        </div>

        <!-- Locations List Grouped by Region -->
        <div class="locations-scroll">
          <ng-container *ngFor="let region of groupedLocations$ | keyvalue">
            <div class="region-group" *ngIf="region.value.length > 0">
              <div class="region-header">{{ region.key }}</div>

              <button
                *ngFor="let location of region.value"
                class="location-item"
                [class.selected]="location.code === selectedLocation"
                (click)="selectLocation(location.code)"
              >
                <span class="flag">{{ location.flag }}</span>
                <span class="name">{{ location.name }}</span>
                <span
                  *ngIf="location.code === selectedLocation"
                  class="checkmark"
                >
                  ✓
                </span>
              </button>
            </div>
          </ng-container>

          <!-- Global Option -->
          <div class="region-group">
            <button
              class="location-item global-option"
              [class.selected]="selectedLocation === ''"
              (click)="selectLocation('')"
            >
              <span class="flag">🌍</span>
              <span class="name">Todo el mundo</span>
              <span *ngIf="selectedLocation === ''" class="checkmark">✓</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .location-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-end;
      z-index: 1000;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .location-modal {
      width: 100%;
      background: white;
      border-radius: 24px 24px 0 0;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--sj-border);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--sj-text-primary);
      }
    }

    .close-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: var(--sj-surface-elevated);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sj-text-secondary);
      font-size: 24px;
      transition: all 0.2s;

      &:hover {
        background: var(--sj-border);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      border-bottom: 1px solid var(--sj-border);
      flex-shrink: 0;
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

    .locations-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 16px 0;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--sj-border);
        border-radius: 3px;

        &:hover {
          background: var(--sj-text-tertiary);
        }
      }
    }

    .region-group {
      padding: 8px 0;

      &:last-child {
        padding-bottom: 20px;
      }
    }

    .region-header {
      padding: 12px 24px 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--sj-text-tertiary);
    }

    .location-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--sj-text-primary);
      font-size: 15px;
      transition: all 0.15s;
      position: relative;

      &:hover {
        background: var(--sj-surface-elevated);
      }

      &.selected {
        background: var(--sj-primary-soft);
        color: var(--sj-primary);
        font-weight: 500;
      }

      &:active {
        background: var(--sj-primary-soft);
        transform: scale(0.98);
      }

      .flag {
        font-size: 20px;
        width: 28px;
        text-align: center;
        flex-shrink: 0;
      }

      .name {
        flex: 1;
        text-align: left;
      }

      .checkmark {
        color: var(--sj-primary);
        font-weight: 700;
        font-size: 18px;
        flex-shrink: 0;
        animation: scaleIn 0.2s ease-out;
      }

      @keyframes scaleIn {
        from {
          transform: scale(0);
        }
        to {
          transform: scale(1);
        }
      }
    }

    .global-option {
      border-top: 1px solid var(--sj-border);
      margin-top: 8px;
      padding-top: 16px;
    }
  `
})
export class LocationPickerModalComponent {
  @Input() selectedLocation: string = '';
  @Output() locationSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  searchQuery = '';

  private allLocations: LocationOption[] = [
    // Europa
    { code: 'Spain', name: 'España', region: 'Europa', flag: '🇪🇸' },
    { code: 'United Kingdom', name: 'Reino Unido', region: 'Europa', flag: '🇬🇧' },
    { code: 'Germany', name: 'Alemania', region: 'Europa', flag: '🇩🇪' },
    { code: 'France', name: 'Francia', region: 'Europa', flag: '🇫🇷' },
    { code: 'Italy', name: 'Italia', region: 'Europa', flag: '🇮🇹' },
    { code: 'Portugal', name: 'Portugal', region: 'Europa', flag: '🇵🇹' },
    { code: 'Netherlands', name: 'Países Bajos', region: 'Europa', flag: '🇳🇱' },

    // Americas
    { code: 'United States', name: 'Estados Unidos', region: 'Americas', flag: '🇺🇸' },
    { code: 'Canada', name: 'Canadá', region: 'Americas', flag: '🇨🇦' },
    { code: 'Mexico', name: 'México', region: 'Americas', flag: '🇲🇽' },
    { code: 'Brazil', name: 'Brasil', region: 'Americas', flag: '🇧🇷' },
    { code: 'Argentina', name: 'Argentina', region: 'Americas', flag: '🇦🇷' },
    { code: 'Chile', name: 'Chile', region: 'Americas', flag: '🇨🇱' },
    { code: 'Colombia', name: 'Colombia', region: 'Americas', flag: '🇨🇴' },

    // Asia
    { code: 'India', name: 'India', region: 'Asia', flag: '🇮🇳' },
    { code: 'Japan', name: 'Japón', region: 'Asia', flag: '🇯🇵' },
    { code: 'Singapore', name: 'Singapur', region: 'Asia', flag: '🇸🇬' },

    // Remote
    { code: 'Remote', name: 'Remoto / Anywhere', region: 'Especial', flag: '🌐' },
  ];

  get groupedLocations$(): Map<string, LocationOption[]> {
    const filtered = this.searchQuery.trim()
      ? this.allLocations.filter(
          (loc) =>
            loc.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            loc.code.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      : this.allLocations;

    const grouped = new Map<string, LocationOption[]>();
    const regions = ['Europa', 'Americas', 'Asia', 'Especial'];

    for (const region of regions) {
      const items = filtered.filter((loc) => loc.region === region);
      if (items.length > 0) {
        grouped.set(region, items);
      }
    }

    return grouped;
  }

  constructor() {
    addIcons({ closeOutline, searchOutline });
  }

  onSearch(): void {
    // El getter se actualiza automáticamente con el nuevo searchQuery
  }

  selectLocation(code: string): void {
    this.locationSelected.emit(code);
    this.close();
  }

  close(): void {
    this.closed.emit();
  }
}
