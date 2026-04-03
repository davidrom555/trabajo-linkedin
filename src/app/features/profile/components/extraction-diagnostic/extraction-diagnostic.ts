import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonIcon,
  IonButton,
  IonToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronDown, chevronUp, copy, checkmark } from 'ionicons/icons';
import { ProfileService } from '../../../../core/services/profile.service';

@Component({
  selector: 'app-extraction-diagnostic',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonBadge,
    IonIcon,
    IonButton,
    IonToggle,
  ],
  template: `
    @let profile = profileService.profile();
    @if (profile && profile.extractionReport) {
      @let report = profile.extractionReport;

      <div class="diagnostic-container">
        <div class="diagnostic-header">
          <h3>📊 Análisis de Extracción</h3>
          <span class="completeness-badge" [ngClass]="completenessClass(report.overallCompleteness)">
            {{ report.overallCompleteness }}%
          </span>
        </div>

        <!-- Completeness Meter -->
        <div class="completeness-meter">
          <div class="meter-bar">
            <div class="meter-fill" [style.width.%]="report.overallCompleteness"></div>
          </div>
          <p class="meter-label">{{ completenessText(report.overallCompleteness) }}</p>
        </div>

        <!-- Sections Grid -->
        <div class="sections-grid">
          <div class="section-stat">
            <span class="stat-icon">🎯</span>
            <span class="stat-label">Skills</span>
            <span class="stat-value">{{ report.sections.skills.found }}</span>
            <span class="stat-confidence">{{ (report.sections.skills.confidence * 100 | number: '0.0') }}%</span>
          </div>

          <div class="section-stat">
            <span class="stat-icon">💼</span>
            <span class="stat-label">Experiencia</span>
            <span class="stat-value">{{ report.sections.experience.found }}</span>
            <span class="stat-confidence">{{ (report.sections.experience.completeness * 100 | number: '0.0') }}%</span>
          </div>

          <div class="section-stat">
            <span class="stat-icon">🎓</span>
            <span class="stat-label">Educación</span>
            <span class="stat-value">{{ report.sections.education.found }}</span>
            <span class="stat-confidence">{{ (report.sections.education.completeness * 100 | number: '0.0') }}%</span>
          </div>

          <div class="section-stat">
            <span class="stat-icon">🗣️</span>
            <span class="stat-label">Idiomas</span>
            <span class="stat-value">{{ report.sections.languages.found }}</span>
            <span class="stat-confidence">{{ report.sections.contact.email ? '✓' : '✗' }}</span>
          </div>
        </div>

        <!-- Warnings -->
        @if (report.warnings.length > 0) {
          <div class="warnings-section">
            <div class="section-title">⚠️ Alertas</div>
            <ul class="warnings-list">
              @for (warning of report.warnings; track warning) {
                <li class="warning-item">{{ warning }}</li>
              }
            </ul>
          </div>
        }

        <!-- Suggestions -->
        @if (report.suggestions.length > 0) {
          <div class="suggestions-section">
            <div class="section-title">💡 Sugerencias</div>
            <ul class="suggestions-list">
              @for (suggestion of report.suggestions; track suggestion) {
                <li class="suggestion-item">{{ suggestion }}</li>
              }
            </ul>
          </div>
        }

        <!-- Contact Info Summary -->
        <div class="contact-summary">
          <div class="summary-title">📋 Información de Contacto</div>
          <div class="contact-items">
            <div class="contact-badge" [class.found]="report.sections.contact.email">
              <span class="icon">✉️</span> Email {{ report.sections.contact.email ? '✓' : '✗' }}
            </div>
            <div class="contact-badge" [class.found]="report.sections.contact.phone">
              <span class="icon">📱</span> Teléfono {{ report.sections.contact.phone ? '✓' : '✗' }}
            </div>
            <div class="contact-badge" [class.found]="report.sections.contact.location">
              <span class="icon">📍</span> Ubicación {{ report.sections.contact.location ? '✓' : '✗' }}
            </div>
          </div>
        </div>

        <!-- Data Debug -->
        @if (showDebug) {
          <div class="debug-section">
            <div class="section-title">🔧 Debug (Datos extraídos)</div>
            <div class="debug-content">
              <pre>{{ profile | json }}</pre>
            </div>
          </div>
        }

        <button (click)="toggleDebug()" class="debug-toggle">
          {{ showDebug ? 'Ocultar' : 'Mostrar' }} datos raw
        </button>
      </div>
    }
  `,
  styles: `
    .diagnostic-container {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 16px;
      padding: 20px;
      margin: 16px;
    }

    .diagnostic-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .diagnostic-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }

    .completeness-badge {
      font-size: 20px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      color: white;
    }

    .completeness-badge.high {
      background: #10b981;
    }

    .completeness-badge.medium {
      background: #f59e0b;
    }

    .completeness-badge.low {
      background: #ef4444;
    }

    .completeness-meter {
      margin-bottom: 20px;
    }

    .meter-bar {
      height: 8px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .meter-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width 0.3s ease;
    }

    .meter-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }

    .sections-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .section-stat {
      background: white;
      padding: 12px;
      border-radius: 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-icon {
      font-size: 20px;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #059669;
    }

    .stat-confidence {
      font-size: 11px;
      color: #9ca3af;
    }

    .warnings-section,
    .suggestions-section,
    .contact-summary {
      background: white;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .warnings-list,
    .suggestions-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .warning-item,
    .suggestion-item {
      font-size: 13px;
      color: #4b5563;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .warning-item:last-child,
    .suggestion-item:last-child {
      border-bottom: none;
    }

    .contact-items {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .contact-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 6px 10px;
      border-radius: 8px;
      background: #f0f0f0;
      color: #888;
    }

    .contact-badge.found {
      background: #d1fae5;
      color: #059669;
      font-weight: 500;
    }

    .debug-section {
      background: #1f2937;
      border-radius: 12px;
      padding: 12px;
      overflow-x: auto;
    }

    .debug-content pre {
      color: #10b981;
      font-size: 11px;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 300px;
      overflow-y: auto;
    }

    .debug-toggle {
      width: 100%;
      padding: 10px;
      border: none;
      background: white;
      color: #059669;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 12px;
    }

    .debug-toggle:active {
      background: #f0f0f0;
    }
  `,
})
export class ExtractionDiagnosticComponent {
  readonly profileService = inject(ProfileService);
  showDebug = false;

  constructor() {
    addIcons({ chevronDown, chevronUp, copy, checkmark });
  }

  toggleDebug(): void {
    this.showDebug = !this.showDebug;
  }

  completenessClass(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  completenessText(score: number): string {
    if (score >= 95) return '¡Excelente! Extracción casi perfecta';
    if (score >= 80) return 'Muy bien. Tu CV tiene buena información';
    if (score >= 60) return 'Aceptable. Considera agregar más datos';
    if (score >= 40) return 'Hay información faltante';
    return 'Muy pocos datos extraídos';
  }
}
