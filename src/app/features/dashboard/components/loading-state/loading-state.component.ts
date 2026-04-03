import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, IonSpinner],
  template: `
    <div class="loading-container">
      <div class="loading-content">
        <div class="spinner-wrapper">
          <ion-spinner name="crescent" class="spinner"></ion-spinner>
          <div class="animated-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>

        <div class="loading-text">
          <p class="loading-title">Buscando empleos...</p>
          <p class="loading-subtitle">Analizando miles de ofertas para ti</p>
        </div>

        <div class="loading-progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: 40px 20px;
      background: linear-gradient(180deg, var(--sj-background) 0%, var(--sj-surface) 100%);
    }

    .loading-content {
      text-align: center;
      max-width: 300px;
    }

    .spinner-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner {
      font-size: 48px;
      color: var(--sj-primary);
    }

    .animated-dots {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
    }

    .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--sj-primary);
      animation: dotBounce 1.4s infinite;
    }

    .dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    .dot:nth-child(3) {
      animation-delay: 0s;
    }

    @keyframes dotBounce {
      0%, 80%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      40% {
        transform: translateY(-8px);
        opacity: 1;
      }
    }

    .loading-text {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }

    .loading-title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--sj-text-primary);
    }

    .loading-subtitle {
      margin: 0;
      font-size: 13px;
      color: var(--sj-text-secondary);
      line-height: 1.4;
    }

    .loading-progress {
      width: 100%;
      height: 3px;
      background: var(--sj-surface-elevated);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--sj-primary) 0%, var(--sj-primary-light) 100%);
      border-radius: 2px;
      animation: progress 2s ease-in-out infinite;
    }

    @keyframes progress {
      0% {
        width: 0%;
      }
      50% {
        width: 100%;
      }
      100% {
        width: 100%;
      }
    }
  `,
})
export class LoadingStateComponent {}
