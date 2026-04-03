import { Component, Output, EventEmitter, Input, ChangeDetectionStrategy } from '@angular/core';
import { IonButton, IonIcon, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { wifiOutline, briefcaseOutline, globeOutline, flashOutline, schoolOutline, trendingUpOutline, buildOutline } from 'ionicons/icons';

interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  action: string;
}

@Component({
  selector: 'app-quick-filters',
  standalone: true,
  imports: [IonButton, IonIcon, IonBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filters-container">
      <div class="filters-scroll">
        @for (filter of filters; track filter.id) {
          <button
            class="filter-chip"
            [class.active]="isFilterActive(filter.id)"
            (click)="selectFilter(filter.id)"
          >
            <ion-icon [name]="filter.icon"></ion-icon>
            <span>{{ filter.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .filters-container {
      padding: 0 16px;
      margin: 12px 0;
    }

    .filters-scroll {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding: 8px 0;

      &::-webkit-scrollbar {
        height: 4px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--sj-border-light);
        border-radius: 2px;
      }
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 20px;
      border: 1px solid var(--sj-border-light);
      background: white;
      color: var(--sj-text-secondary);
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
      cursor: pointer;
      transition: all 0.3s ease;

      ion-icon {
        font-size: 16px;
      }

      &:hover {
        border-color: var(--sj-primary);
        color: var(--sj-primary);
      }

      &.active {
        background: var(--sj-primary);
        color: white;
        border-color: var(--sj-primary);
      }
    }
  `
})
export class QuickFiltersComponent {
  @Input() activeFilter: string = '';
  @Output() filterSelect = new EventEmitter<string>();

  filters: QuickFilter[] = [
    { id: 'remote', label: 'Remoto', icon: 'wifi-outline', action: 'remote' },
    { id: 'fulltime', label: 'Tiempo Completo', icon: 'briefcase-outline', action: 'fulltime' },
    { id: 'global', label: 'Global', icon: 'globe-outline', action: 'global' },
    { id: 'trending', label: 'Trending', icon: 'flash-outline', action: 'trending' },
    { id: 'junior', label: 'Junior', icon: 'school-outline', action: 'junior' },
    { id: 'senior', label: 'Senior', icon: 'trending-up-outline', action: 'senior' },
    { id: 'startup', label: 'Startup', icon: 'build-outline', action: 'startup' },
  ];

  constructor() {
    addIcons({ wifiOutline, briefcaseOutline, globeOutline, flashOutline, schoolOutline, trendingUpOutline, buildOutline });
  }

  selectFilter(filterId: string) {
    this.filterSelect.emit(filterId);
  }

  isFilterActive(filterId: string): boolean {
    return this.activeFilter === filterId;
  }
}
