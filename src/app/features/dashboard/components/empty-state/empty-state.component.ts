import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  searchOutline,
  filterOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IonIcon, IonCard, IonCardContent],
  template: `
    <div class="empty-state-container">
      <div class="empty-state-card">
        <div class="empty-icon-wrapper">
          <ion-icon [name]="iconName" class="empty-icon"></ion-icon>
        </div>

        <div class="empty-content">
          <h2 class="empty-title">{{ title }}</h2>
          <p class="empty-description">{{ description }}</p>

          <div class="empty-suggestions" *ngIf="suggestions && suggestions.length > 0">
            <p class="suggestions-label">Sugerencias:</p>
            <ul class="suggestions-list">
              <li *ngFor="let suggestion of suggestions">{{ suggestion }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .empty-state-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: 40px 20px;
      background: linear-gradient(180deg, var(--sj-surface) 0%, var(--sj-surface-elevated) 100%);
    }

    .empty-state-card {
      text-align: center;
      max-width: 400px;
    }

    .empty-icon-wrapper {
      margin-bottom: 24px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .empty-icon {
      font-size: 64px;
      color: var(--sj-primary);
      opacity: 0.8;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--sj-text-primary);
      letter-spacing: -0.3px;
    }

    .empty-description {
      margin: 0;
      font-size: 15px;
      color: var(--sj-text-secondary);
      line-height: 1.5;
    }

    .empty-suggestions {
      margin-top: 20px;
      padding: 16px;
      background: var(--sj-primary-soft);
      border-radius: 12px;
      text-align: left;
    }

    .suggestions-label {
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--sj-primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .suggestions-list {
      margin: 0;
      padding-left: 20px;
      list-style: none;

      li {
        margin: 4px 0;
        font-size: 14px;
        color: var(--sj-text-secondary);
        line-height: 1.4;

        &:before {
          content: '✓ ';
          color: var(--sj-primary);
          font-weight: 700;
          margin-right: 6px;
        }
      }
    }
  `,
})
export class EmptyStateComponent {
  @Input() title: string = 'No hay ofertas';
  @Input() description: string = 'Ajusta tus filtros o prueba con otras búsquedas';
  @Input() iconName: string = 'document-text-outline';
  @Input() suggestions: string[] | null = null;

  constructor() {
    addIcons({
      documentTextOutline,
      searchOutline,
      filterOutline,
    });
  }
}
