import { Component, Output, EventEmitter, Input, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { closeOutline, searchOutline } from 'ionicons/icons';
import { CountriesService, Country } from '../../../../core/services/countries.service';


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
          @if (countriesService.isLoading()) {
            <div class="loading-message">Cargando países...</div>
          } @else {
            <ng-container *ngFor="let region of countriesService.countriesByRegion() | keyvalue">
              <div class="region-group" *ngIf="region.value.length > 0">
                <div class="region-header">{{ translateRegion(region.key) }}</div>

                <button
                  *ngFor="let country of getFilteredCountries(region.value)"
                  class="location-item"
                  [class.selected]="country.code === selectedLocation"
                  (click)="selectLocation(country.code)"
                >
                  <span class="flag">{{ country.flagEmoji }}</span>
                  <span class="name">{{ country.name }}</span>
                  <span
                    *ngIf="country.code === selectedLocation"
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
          }
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
        font-size: 22px;
        width: 32px;
        text-align: center;
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
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

    .loading-message {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--sj-text-secondary);
      font-size: 14px;
    }
  `
})
export class LocationPickerModalComponent implements OnInit {
  readonly countriesService = inject(CountriesService);

  @Input() selectedLocation: string = '';
  @Output() locationSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  searchQuery = '';

  getFilteredCountries(countries: Country[]): Country[] {
    const query = this.searchQuery.trim().toLowerCase();
    return query
      ? countries.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.code.toLowerCase().includes(query)
        )
      : countries;
  }

  constructor() {
    addIcons({ closeOutline, searchOutline });
  }

  ngOnInit(): void {
    this.countriesService.loadCountries();
  }

  translateRegion(region: string): string {
    const regionMap: { [key: string]: string } = {
      'Europe': 'Europa',
      'Americas': 'América',
      'Asia': 'Asia',
      'Africa': 'África',
      'Oceania': 'Oceanía',
    };
    return regionMap[region] || region;
  }

  onSearch(): void {
    // El computed se actualiza automáticamente
  }

  selectLocation(code: string): void {
    this.locationSelected.emit(code);
    this.close();
  }

  close(): void {
    this.closed.emit();
  }
}
