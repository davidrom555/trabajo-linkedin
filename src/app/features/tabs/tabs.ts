import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  bookmarkOutline,
  compassOutline,
} from 'ionicons/icons';
import { JobService } from '../../core/services/job.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [RouterModule, IonIcon],
  template: `
    <div class="tabs-container">
      <!-- Content Area -->
      <div class="tabs-content">
        <router-outlet></router-outlet>
      </div>
      
      <!-- Custom Tab Bar -->
      <nav class="custom-tab-bar">
        <button 
          class="tab-button" 
          [class.active]="isActive('dashboard')"
          (click)="navigateTo('dashboard')"
        >
          <div class="tab-icon-wrapper">
            <ion-icon name="compass-outline" class="tab-icon"></ion-icon>
            <div class="tab-indicator"></div>
          </div>
          <span class="tab-label">Explorar</span>
        </button>

        <button 
          class="tab-button" 
          [class.active]="isActive('profile')"
          (click)="navigateTo('profile')"
        >
          <div class="tab-icon-wrapper">
            <ion-icon name="person-outline" class="tab-icon"></ion-icon>
            <div class="tab-indicator"></div>
          </div>
          <span class="tab-label">Perfil</span>
        </button>

        <button 
          class="tab-button" 
          [class.active]="isActive('saved')"
          (click)="navigateTo('saved')"
        >
          <div class="tab-icon-wrapper">
            <ion-icon name="bookmark-outline" class="tab-icon"></ion-icon>
            @if (savedCount() > 0) {
              <span class="tab-badge">{{ savedCount() }}</span>
            }
            <div class="tab-indicator"></div>
          </div>
          <span class="tab-label">Guardados</span>
        </button>
      </nav>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    
    .tabs-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
    }
    
    .tabs-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    }
    
    /* Tab Bar */
    .custom-tab-bar {
      display: flex;
      justify-content: space-around;
      align-items: center;
      
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      
      border-top: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
      
      padding-bottom: max(env(safe-area-inset-bottom), 12px);
      padding-top: 8px;
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
      
      flex-shrink: 0;
      z-index: 1000;
    }
    
    /* Tab Button */
    .tab-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      
      padding: 8px 24px;
      background: transparent;
      border: none;
      cursor: pointer;
      
      color: var(--sj-text-tertiary);
      transition: all 0.2s ease;
      
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    
    .tab-button:active {
      transform: scale(0.95);
    }
    
    .tab-button.active {
      color: var(--sj-primary);
    }
    
    /* Icon Wrapper */
    .tab-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 16px;
      transition: all 0.2s ease;
    }
    
    .tab-button.active .tab-icon-wrapper {
      background: var(--sj-primary-soft);
    }
    
    /* Tab Icon */
    .tab-icon {
      font-size: 24px;
      color: var(--sj-text-tertiary);
      transition: all 0.2s ease;
    }
    
    .tab-button.active .tab-icon {
      color: var(--sj-primary);
    }
    
    /* Tab Label */
    .tab-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--sj-text-tertiary);
      transition: all 0.2s ease;
    }
    
    .tab-button.active .tab-label {
      color: var(--sj-primary);
      font-weight: 600;
    }
    
    /* Tab Indicator */
    .tab-indicator {
      position: absolute;
      top: -4px;
      left: 50%;
      transform: translateX(-50%) scaleX(0);
      width: 20px;
      height: 3px;
      background: var(--sj-primary);
      border-radius: 2px;
      opacity: 0;
      transition: all 0.2s ease;
    }
    
    .tab-button.active .tab-indicator {
      transform: translateX(-50%) scaleX(1);
      opacity: 1;
    }
    
    /* Tab Badge */
    .tab-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 10px;
      font-weight: 700;
      border-radius: 9px;
      background: var(--sj-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.2s ease;
      z-index: 10;
    }
    
    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
  `,
})
export class TabsPage {
  private readonly router = inject(Router);
  private readonly jobService = inject(JobService);
  
  readonly savedCount = () => this.jobService.savedJobs().length;

  constructor() {
    addIcons({
      'compass-outline': compassOutline,
      'person-outline': personOutline,
      'bookmark-outline': bookmarkOutline,
    });
  }

  isActive(tab: string): boolean {
    return this.router.url.includes(`/tabs/${tab}`);
  }

  navigateTo(tab: string): void {
    this.router.navigate(['/tabs', tab]);
  }
}
