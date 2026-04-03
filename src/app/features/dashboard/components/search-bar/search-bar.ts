import { Component, Output, EventEmitter, Input, effect } from '@angular/core';
import { IonSearchbar, IonButton, IonIcon } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { searchOutline, optionsOutline } from 'ionicons/icons';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [IonSearchbar, IonButton, IonIcon, FormsModule],
  template: `
    <div class="search-container">
      <ion-searchbar
        [(ngModel)]="query"
        (ionInput)="onSearchInput($event)"
        placeholder="Buscar empleos..."
        class="custom-searchbar"
        debounce="300"
      ></ion-searchbar>
      <ion-button
        fill="clear"
        class="filter-btn"
        (click)="openFilters.emit()"
      >
        <ion-icon name="options-outline" slot="icon-only"></ion-icon>
      </ion-button>
    </div>
  `,
  styles: `
    .search-container {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: white;
    }

    .custom-searchbar {
      --background: var(--sj-surface-elevated);
      --border-radius: 12px;
      --padding-top: 8px;
      --padding-bottom: 8px;
      flex: 1;
    }

    .filter-btn {
      --padding-start: 8px;
      --padding-end: 8px;
      font-size: 20px;
      color: var(--sj-primary);
    }
  `
})
export class SearchBarComponent {
  @Input() query: string = '';
  @Output() queryChange = new EventEmitter<string>();
  @Output() openFilters = new EventEmitter<void>();

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(query => {
      this.queryChange.emit(query);
    });

    addIcons({ searchOutline, optionsOutline });
  }

  onSearchInput(event: any) {
    const query = event.target.value || '';
    this.searchSubject.next(query);
  }
}
