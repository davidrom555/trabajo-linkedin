import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonSkeletonText,
  IonCard,
  IonCardContent,
  IonIcon,
  IonBadge,
  IonButton,
  IonModal,
  IonButtons,
  IonRange,
  IonSelect,
  IonSelectOption,
  ToastController,
  IonFab,
  IonFabButton,
  IonChip,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  trendingUpOutline, 
  flashOutline, 
  layersOutline,
  optionsOutline,
  closeOutline,
  filterOutline,
  wifiOutline,
  refreshOutline,
  timeOutline,
  globeOutline,
  logoLinkedin,
  searchOutline,
  laptopOutline,
  businessOutline,
  warningOutline,
  locationOutline,
  flagOutline,
  addOutline,
  arrowUpOutline,
  ellipsisVerticalOutline,
  compassOutline,
  chevronDownOutline,
  createOutline,
  documentTextOutline,
  chevronForwardOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import { JobService } from '../../core/services/job.service';
import { ProfileService } from '../../core/services/profile.service';
import { LinkedInApiService } from '../../core/services/linkedin-api.service';
import { TimeFilter } from '../../core/models/job.model';
import { JobCardComponent } from './components/job-card/job-card';
import { TimeFilterComponent } from './components/time-filter/time-filter';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonSkeletonText,
    IonCard,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonButton,
    IonModal,
    IonButtons,
    IonRange,
    IonFab,
    IonFabButton,
    IonChip,
    JobCardComponent,
    TimeFilterComponent,
  ],
  template: `
    <!-- Header Moderno -->
    <ion-header class="ion-no-border dashboard-header">
      <div class="header-gradient">
        <ion-toolbar class="toolbar-transparent">
          <ion-title class="app-title">
            <ion-icon name="compass-outline" class="title-icon"></ion-icon>
            <span>SmartJob</span>
          </ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="openFilters()" class="filter-btn">
              <ion-icon name="options-outline" slot="icon-only"></ion-icon>
              @if (activeFiltersCount() > 0) {
                <span class="filter-badge">{{ activeFiltersCount() }}</span>
              }
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        
        <!-- Search Section -->
        <div class="search-section">
          <!-- Search Bar with Suggestions -->
          <div class="search-wrapper">
            <div class="search-bar-container">
              <ion-icon name="search-outline" class="search-icon"></ion-icon>
              <input
                #searchInput
                type="text"
                [value]="jobService.searchQuery()"
                placeholder="¿Qué trabajo buscas? Ej: developer, chef..."
                class="modern-search"
                (input)="onSearch($event)"
                (keyup.enter)="onSearchSubmit()"
                (focus)="showSuggestions = true"
                (blur)="onSearchBlur()"
              />
              @if (jobService.searchQuery()) {
                <button class="clear-btn" (click)="clearSearch()">
                  <ion-icon name="close-outline"></ion-icon>
                </button>
              }
            </div>
            
            <!-- Search Suggestions Dropdown -->
            @if (showSuggestions) {
              <div class="suggestions-dropdown">
                <div class="suggestions-header">
                  <span>{{ jobService.searchQuery() ? 'Sugerencias' : 'Búsquedas populares' }}</span>
                </div>
                @for (suggestion of getSuggestions(); track suggestion) {
                  <button 
                    type="button"
                    class="suggestion-item"
                    (click)="selectSuggestion(suggestion)"
                  >
                    <ion-icon name="search-outline" class="suggestion-icon"></ion-icon>
                    <span class="suggestion-text">{{ suggestion }}</span>
                    <ion-icon name="arrow-forward-outline" class="suggestion-arrow"></ion-icon>
                  </button>
                }
              </div>
            }
          </div>
          
          <!-- Location Selector -->
          <div class="location-bar" (click)="showLocationModal()">
            <ion-icon name="location-outline" class="location-icon"></ion-icon>
            <span class="location-text">
              {{ getSelectedLocationName() }}
            </span>
            <ion-icon name="chevron-down-outline" class="location-chevron"></ion-icon>
          </div>
        </div>
      </div>
    </ion-header>

    <ion-content class="dashboard-content">
      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)" class="custom-refresher">
        <ion-refresher-content 
          pullingText="Desliza para actualizar"
          refreshingText="Actualizando..."
        ></ion-refresher-content>
      </ion-refresher>

      <!-- Stats Cards Modernos -->
      <div class="stats-scroll-container">
        <div class="stats-row">
          <div class="stat-card primary" [class.pulse]="jobService.isLoading()">
            <div class="stat-icon">
              <ion-icon name="layers-outline"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ jobService.stats().total }}</span>
              <span class="stat-label">Ofertas</span>
            </div>
          </div>
          
          <div class="stat-card success">
            <div class="stat-icon">
              <ion-icon name="flash-outline"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ jobService.stats().highMatch }}</span>
              <span class="stat-label">Top Match</span>
            </div>
          </div>
          
          <div class="stat-card info">
            <div class="stat-icon">
              <ion-icon name="trending-up-outline"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ jobService.stats().avgScore }}%</span>
              <span class="stat-label">Match</span>
            </div>
          </div>
          
          <div class="stat-card remote">
            <div class="stat-icon">
              <ion-icon name="wifi-outline"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ jobService.stats().remoteCount }}</span>
              <span class="stat-label">Remoto</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="quick-filters-section">
        <div class="quick-filters-scroll">
          @for (filter of quickFilters; track filter.id) {
            <button
              (click)="applyQuickFilter(filter)"
              class="quick-filter-btn"
              [class.active]="filter.active"
              [style.--filter-color]="filter.color"
            >
              <ion-icon [name]="filter.icon"></ion-icon>
              <span>{{ filter.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Profile-Based Recommendations -->
      @if (profileService.hasProfile()) {
        <div class="profile-recommendations">
          <div class="rec-header">
            <div class="rec-avatar">
              {{ profileService.profile()!.fullName.charAt(0).toUpperCase() }}
            </div>
            <div class="rec-info">
              <span class="rec-title">Recomendaciones para {{ profileService.profile()!.fullName.split(' ')[0] }}</span>
              <span class="rec-subtitle">
                Basado en {{ profileService.profile()!.skills.length }} skills · {{ profileService.profile()!.experience.length }} experiencias
              </span>
            </div>
            <button class="rec-edit-btn" (click)="goToProfile()">
              <ion-icon name="create-outline"></ion-icon>
            </button>
          </div>
          <div class="rec-skills">
            @for (skill of profileService.profile()!.skills.slice(0, 5); track skill) {
              <span class="rec-skill-tag">{{ skill }}</span>
            }
            @if (profileService.profile()!.skills.length > 5) {
              <span class="rec-skill-more">+{{ profileService.profile()!.skills.length - 5 }}</span>
            }
          </div>
        </div>
      } @else {
        <!-- Prompt to create profile -->
        <div class="create-profile-banner" (click)="goToProfile()">
          <div class="banner-icon">
            <ion-icon name="document-text-outline"></ion-icon>
          </div>
          <div class="banner-content">
            <span class="banner-title">Sube tu CV para recomendaciones personalizadas</span>
            <span class="banner-subtitle">Extraemos tus skills y experiencia automáticamente</span>
          </div>
          <ion-icon name="chevron-forward-outline" class="banner-arrow"></ion-icon>
        </div>
      }

      <!-- Time Filter -->
      <app-time-filter
        [current]="jobService.timeFilter()"
        (selected)="onTimeFilterChange($event)"
      />

      <!-- Error Message -->
      @if (jobService.error()) {
        <div class="error-card">
          <ion-icon name="warning-outline" class="error-icon"></ion-icon>
          <div class="error-content">
            <p class="error-title">{{ jobService.error() }}</p>
            <p class="error-subtitle">Intenta recargar o verifica tu conexión</p>
          </div>
          <button (click)="retryLoad()" class="retry-btn">
            <ion-icon name="refresh-outline"></ion-icon>
            Reintentar
          </button>
        </div>
      }

      <!-- Loading Skeletons -->
      @if (jobService.isLoading()) {
        <div class="skeleton-container">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card">
              <div class="skeleton-header">
                <div class="skeleton-logo"></div>
                <div class="skeleton-text">
                  <div class="skeleton-line title"></div>
                  <div class="skeleton-line subtitle"></div>
                </div>
              </div>
              <div class="skeleton-body">
                <div class="skeleton-line"></div>
                <div class="skeleton-tags">
                  <div class="skeleton-tag"></div>
                  <div class="skeleton-tag"></div>
                  <div class="skeleton-tag"></div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Job List -->
      @if (!jobService.isLoading()) {
        @if (jobService.filteredJobs().length === 0) {
          <!-- Empty State -->
          <div class="empty-state">
            <div class="empty-illustration">
              <ion-icon name="search-outline"></ion-icon>
            </div>
            <h3 class="empty-title">Sin resultados</h3>
            <p class="empty-subtitle">
              {{ jobService.searchQuery() 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Selecciona una ubicación o busca por oficio' }}
            </p>
            @if (hasActiveFilters()) {
              <button (click)="clearAllFilters()" class="clear-filters-btn">
                Limpiar filtros
              </button>
            }
          </div>
        } @else {
          <!-- Results Info -->
          <div class="results-header">
            <span class="results-count">
              {{ jobService.filteredJobs().length }} resultados
            </span>
            @if (jobService.lastFetchTime()) {
              <span class="last-updated">
                Actualizado {{ formatTimeAgo(jobService.lastFetchTime()!) }}
              </span>
            }
          </div>
          
          <!-- Jobs List -->
          <ion-list lines="none" class="jobs-list">
            @for (job of jobService.filteredJobs(); track job.id; let i = $index) {
              <app-job-card
                [job]="job"
                [userSkills]="profileService.profile()?.skills ?? []"
                (save)="onToggleSave($event)"
                (dismiss)="onDismiss($event)"
                (apply)="onApply($event)"
                [style.animation-delay]="i * 50 + 'ms'"
                class="job-card-animated"
              />
            }
          </ion-list>
          
          <!-- Load More -->
          <div class="load-more-container">
            <button class="load-more-btn" (click)="loadMore()">
              <ion-icon name="arrow-up-outline"></ion-icon>
              Cargar más ofertas
            </button>
          </div>
        }
      }
    </ion-content>

    <!-- FAB para subir -->
    <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="scroll-fab">
      <ion-fab-button (click)="scrollToTop()" size="small">
        <ion-icon name="arrow-up-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Filters Modal -->
    <ion-modal [isOpen]="isFilterModalOpen" (didDismiss)="closeFilters()" class="filters-modal">
      <ng-template>
        <div class="modal-header">
          <h2>Filtros avanzados</h2>
          <button (click)="closeFilters()" class="close-modal-btn">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>
        
        <div class="modal-content">
          <!-- Sources -->
          <div class="filter-section">
            <h3>
              <ion-icon name="business-outline"></ion-icon>
              Fuentes de empleo
            </h3>
            <div class="sources-grid">
              @for (source of jobService.availableSources(); track source.id) {
                <button
                  (click)="toggleSource(source.id)"
                  class="source-chip"
                  [class.selected]="isSourceSelected(source.id)"
                  [class.disabled]="!source.active"
                >
                  <ion-icon [name]="source.icon"></ion-icon>
                  {{ source.name }}
                </button>
              }
            </div>
          </div>

          <!-- Remote -->
          <div class="filter-section">
            <h3>
              <ion-icon name="laptop-outline"></ion-icon>
              Modalidad
            </h3>
            <div class="toggle-group">
              <button
                (click)="jobService.setRemoteOnly(false)"
                class="toggle-btn"
                [class.active]="!jobService.remoteOnly()"
              >
                Todos
              </button>
              <button
                (click)="jobService.setRemoteOnly(true)"
                class="toggle-btn"
                [class.active]="jobService.remoteOnly()"
              >
                <ion-icon name="wifi-outline"></ion-icon>
                Solo remoto
              </button>
            </div>
          </div>

          <!-- Salary -->
          <div class="filter-section">
            <h3>
              <ion-icon name="cash-outline"></ion-icon>
              Salario mínimo: {{ tempMinSalaryDisplay() }}
            </h3>
            <ion-range
              [min]="0"
              [max]="200"
              [step]="10"
              [value]="tempMinSalary || 0"
              (ionChange)="onSalaryChange($event)"
              class="salary-range"
            ></ion-range>
            <div class="range-labels">
              <span>Sin límite</span>
              <span>$200k+</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button (click)="clearAllFilters()" class="btn-secondary">
              Limpiar todo
            </button>
            <button (click)="applyFilters()" class="btn-primary">
              Aplicar filtros
            </button>
          </div>
        </div>
      </ng-template>
    </ion-modal>

    <!-- Location Modal -->
    <ion-modal [isOpen]="isLocationModalOpen" (didDismiss)="isLocationModalOpen = false" class="location-modal">
      <ng-template>
        <div class="location-modal-header">
          <h2>Selecciona ubicación</h2>
          <button (click)="isLocationModalOpen = false" class="close-btn">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>
        <div class="location-grid">
          <button 
            (click)="selectLocation('')" 
            class="location-item"
            [class.selected]="jobService.location() === ''"
          >
            <div class="flag-image flag-global">
              <img src="https://flagcdn.com/w80/un.png" alt="Global" loading="lazy">
            </div>
            <span class="location-code">ALL</span>
            <span class="location-name">Todo el mundo</span>
          </button>
          @for (country of jobService.supportedCountries; track country.code) {
            @if (country.code !== '') {
              <button 
                (click)="selectLocation(country.code)" 
                class="location-item"
                [class.selected]="jobService.location() === country.code"
              >
                <div class="flag-image">
                  <img 
                    [src]="'https://flagcdn.com/w80/' + getCountryCode(country.code).toLowerCase() + '.png'" 
                    [alt]="country.name"
                    loading="lazy"
                    (error)="onFlagError($event, country.code)"
                  >
                </div>
                <span class="location-code">{{ getCountryCode(country.code) }}</span>
                <span class="location-name">{{ country.name }}</span>
              </button>
            }
          }
        </div>
      </ng-template>
    </ion-modal>
  `,
  styles: `
    /* Header Styles */
    .dashboard-header {
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .header-gradient {
      background: linear-gradient(135deg, var(--sj-primary) 0%, var(--sj-primary-dark) 100%);
      padding-bottom: 20px;
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3);
    }
    
    .toolbar-transparent {
      --background: transparent;
      --color: white;
    }
    
    .app-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 22px;
      
      .title-icon {
        font-size: 26px;
      }
    }
    
    .filter-btn {
      --color: white;
      position: relative;
      
      .filter-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 18px;
        height: 18px;
        background: white;
        color: var(--sj-primary);
        border-radius: 50%;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    /* Search Section */
    .search-section {
      padding: 0 16px;
      margin-top: 8px;
    }
    
    .search-wrapper {
      position: relative;
      z-index: 200;
    }
    
    .search-bar-container {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      padding: 4px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    /* Search Suggestions Dropdown */
    .suggestions-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      z-index: 300;
      will-change: transform, opacity;
    }
    
    .suggestions-header {
      padding: 10px 16px;
      font-size: 11px;
      font-weight: 600;
      color: var(--sj-text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--sj-surface-elevated);
    }
    
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      background: white;
      border: none;
      border-bottom: 1px solid var(--sj-border-light);
      cursor: pointer;
      text-align: left;
    }
    
    .suggestion-item:last-child {
      border-bottom: none;
    }
    
    .suggestion-item:active {
      background: var(--sj-surface-elevated);
    }
    
    .suggestion-icon {
      font-size: 16px;
      color: var(--sj-text-tertiary);
      flex-shrink: 0;
    }
    
    .suggestion-text {
      flex: 1;
      font-size: 14px;
      color: var(--sj-text-primary);
    }
    
    .suggestion-arrow {
      font-size: 14px;
      color: var(--sj-text-tertiary);
    }
    
    .search-icon {
      font-size: 20px;
      color: var(--sj-text-tertiary);
      margin-left: 12px;
    }
    
    .modern-search {
      flex: 1;
      border: none;
      background: transparent;
      padding: 14px 12px;
      font-size: 15px;
      color: #0f172a !important;
      outline: none;
      
      &::placeholder {
        color: #64748b !important;
      }
    }
    
    .clear-btn {
      background: transparent;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--sj-text-tertiary);
      
      ion-icon {
        font-size: 20px;
      }
    }
    
    /* Location Bar */
    .location-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 0 4px;
    }
    
    .location-icon {
      color: rgba(255, 255, 255, 0.8);
      font-size: 18px;
    }
    
    .location-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:active {
        background: rgba(255, 255, 255, 0.25);
      }
    }
    
    .location-icon {
      color: rgba(255, 255, 255, 0.9);
      font-size: 18px;
    }
    
    .location-text {
      flex: 1;
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    
    .location-chevron {
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
    }
    
    /* Content */
    .dashboard-content {
      --background: var(--sj-background);
    }
    
    /* Stats Section */
    .stats-scroll-container {
      padding: 16px 0;
      overflow-x: auto;
      scrollbar-width: none;
      
      &::-webkit-scrollbar {
        display: none;
      }
    }
    
    .stats-row {
      display: flex;
      gap: 12px;
      padding: 0 16px;
      width: max-content;
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      min-width: 140px;
      
      &.primary {
        .stat-icon {
          background: var(--sj-primary-soft);
          color: var(--sj-primary);
        }
      }
      
      &.success {
        .stat-icon {
          background: #d1fae5;
          color: #059669;
        }
      }
      
      &.info {
        .stat-icon {
          background: #dbeafe;
          color: #2563eb;
        }
      }
      
      &.remote {
        .stat-icon {
          background: #e0e7ff;
          color: #4f46e5;
        }
      }
      
      &.pulse {
        animation: pulse-stat 2s infinite;
      }
    }
    
    @keyframes pulse-stat {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--sj-text-primary);
      line-height: 1;
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--sj-text-secondary);
      margin-top: 4px;
    }
    
    /* Profile Recommendations */
    .profile-recommendations {
      margin: 12px 16px;
      padding: 16px;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 16px;
      border: 1px solid #a7f3d0;
    }
    
    .rec-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .rec-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--sj-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .rec-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .rec-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--sj-text-primary);
    }
    
    .rec-subtitle {
      font-size: 12px;
      color: var(--sj-text-secondary);
    }
    
    .rec-edit-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sj-primary);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .rec-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .rec-skill-tag {
      padding: 4px 10px;
      background: white;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      color: var(--sj-primary-dark);
      border: 1px solid #a7f3d0;
    }
    
    .rec-skill-more {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      color: var(--sj-text-tertiary);
    }
    
    /* Create Profile Banner */
    .create-profile-banner {
      margin: 12px 16px;
      padding: 16px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 16px;
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .create-profile-banner:active {
      transform: scale(0.98);
    }
    
    .banner-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    
    .banner-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .banner-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
    }
    
    .banner-subtitle {
      font-size: 12px;
      color: #3b82f6;
    }
    
    .banner-arrow {
      font-size: 20px;
      color: #3b82f6;
    }
    
    /* Quick Filters */
    .quick-filters-section {
      padding: 8px 0;
    }
    
    .quick-filters-scroll {
      display: flex;
      gap: 10px;
      padding: 0 16px;
      overflow-x: auto;
      scrollbar-width: none;
      
      &::-webkit-scrollbar {
        display: none;
      }
    }
    
    .quick-filter-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 24px;
      border: 1px solid var(--sj-border);
      background: white;
      font-size: 13px;
      font-weight: 500;
      color: var(--sj-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      
      ion-icon {
        font-size: 16px;
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      &.active {
        background: var(--filter-color, var(--sj-primary));
        border-color: var(--filter-color, var(--sj-primary));
        color: white;
      }
    }
    
    /* Error Card */
    .error-card {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 16px;
      padding: 16px;
      background: #fee2e2;
      border-radius: 16px;
      border-left: 4px solid #ef4444;
    }
    
    .error-icon {
      font-size: 28px;
      color: #ef4444;
    }
    
    .error-content {
      flex: 1;
    }
    
    .error-title {
      font-size: 14px;
      font-weight: 600;
      color: #991b1b;
      margin: 0;
    }
    
    .error-subtitle {
      font-size: 12px;
      color: #b91c1c;
      margin: 4px 0 0;
    }
    
    .retry-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: white;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #dc2626;
      cursor: pointer;
    }
    
    /* Skeleton */
    .skeleton-container {
      padding: 16px;
    }
    
    .skeleton-card {
      background: white;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .skeleton-header {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .skeleton-logo {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    
    .skeleton-text {
      flex: 1;
    }
    
    .skeleton-line {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      margin-bottom: 8px;
      
      &.title {
        width: 70%;
        height: 16px;
      }
      
      &.subtitle {
        width: 50%;
      }
    }
    
    .skeleton-tags {
      display: flex;
      gap: 8px;
    }
    
    .skeleton-tag {
      width: 60px;
      height: 28px;
      border-radius: 14px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 32px;
      text-align: center;
    }
    
    .empty-illustration {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: var(--sj-surface-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      
      ion-icon {
        font-size: 48px;
        color: var(--sj-text-tertiary);
      }
    }
    
    .empty-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--sj-text-primary);
      margin: 0 0 8px;
    }
    
    .empty-subtitle {
      font-size: 14px;
      color: var(--sj-text-secondary);
      margin: 0 0 24px;
      line-height: 1.5;
    }
    
    .clear-filters-btn {
      padding: 12px 24px;
      background: var(--sj-primary);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    
    /* Results Header */
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      
      .results-count {
        font-size: 14px;
        font-weight: 600;
        color: var(--sj-text-primary);
      }
      
      .last-updated {
        font-size: 12px;
        color: var(--sj-text-tertiary);
      }
    }
    
    /* Jobs List */
    .jobs-list {
      background: transparent;
      padding: 0 16px;
    }
    
    .job-card-animated {
      opacity: 0;
      animation: fade-in-up 0.5s ease forwards;
    }
    
    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Load More */
    .load-more-container {
      padding: 24px 16px;
      text-align: center;
    }
    
    .load-more-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: white;
      border: 1px solid var(--sj-border);
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      color: var(--sj-text-secondary);
      cursor: pointer;
    }
    
    /* FAB */
    .scroll-fab {
      margin-bottom: 80px;
      margin-right: 8px;
    }
    
    /* Modal */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--sj-border);
      
      h2 {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
      }
    }
    
    .close-modal-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--sj-surface-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      
      ion-icon {
        font-size: 20px;
        color: var(--sj-text-secondary);
      }
    }
    
    .modal-content {
      padding: 20px;
    }
    
    .filter-section {
      margin-bottom: 24px;
      
      h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: var(--sj-text-primary);
        margin: 0 0 12px;
        
        ion-icon {
          color: var(--sj-text-tertiary);
        }
      }
    }
    
    .sources-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .source-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 8px;
      border-radius: 12px;
      border: 1px solid var(--sj-border);
      background: white;
      font-size: 12px;
      font-weight: 500;
      color: var(--sj-text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      
      ion-icon {
        font-size: 20px;
        color: var(--sj-text-secondary);
      }
      
      &.selected {
        background: var(--sj-primary);
        border-color: var(--sj-primary);
        color: white;
        
        ion-icon {
          color: white;
        }
      }
      
      &.disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: var(--sj-surface-elevated);
      }
    }
    
    .toggle-group {
      display: flex;
      gap: 8px;
    }
    
    .toggle-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid var(--sj-border);
      background: white;
      font-size: 14px;
      font-weight: 500;
      color: var(--sj-text-primary);
      cursor: pointer;
      
      ion-icon {
        color: var(--sj-text-secondary);
      }
      
      &.active {
        background: var(--sj-primary);
        border-color: var(--sj-primary);
        color: white;
        
        ion-icon {
          color: white;
        }
      }
    }
    
    .salary-range {
      --bar-background: var(--sj-surface-elevated);
      --bar-background-active: var(--sj-primary);
      --knob-background: var(--sj-primary);
      --knob-size: 24px;
      --height: 8px;
      
      margin: 16px 0;
    }
    
    .range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--sj-text-tertiary);
    }
    
    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 32px;
    }
    
    .btn-secondary {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid var(--sj-border);
      background: white;
      font-size: 14px;
      font-weight: 600;
      color: var(--sj-text-secondary);
      cursor: pointer;
    }
    
    .btn-primary {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: none;
      background: var(--sj-primary);
      font-size: 14px;
      font-weight: 600;
      color: white;
      cursor: pointer;
    }
    
    /* Location Modal */
    .location-modal {
      --border-radius: 20px 20px 0 0;
    }
    
    .location-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid var(--sj-border);
    }
    
    .location-modal-header h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }
    
    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--sj-surface-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    .close-btn ion-icon {
      font-size: 20px;
      color: var(--sj-text-secondary);
    }
    
    .location-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 20px;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .location-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 12px;
      border-radius: 16px;
      border: 2px solid var(--sj-border);
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .location-item:active {
      transform: scale(0.96);
    }
    
    .location-item.selected {
      border-color: var(--sj-primary);
      background: var(--sj-primary-soft);
    }
    
    /* Flag Images from FlagCDN */
    .flag-image {
      width: 44px;
      height: 32px;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.08);
      flex-shrink: 0;
      background: #f1f5f9;
    }
    
    .flag-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    
    /* Global fallback */
    .flag-global {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .flag-global img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }
    
    /* Fallback when image fails to load */
    .flag-image.flag-fallback::after {
      content: attr(data-code);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    
    .location-code {
      font-size: 12px;
      font-weight: 700;
      color: var(--sj-primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .location-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--sj-text-secondary);
      text-align: center;
      line-height: 1.3;
    }
  `,
})
export class DashboardPage implements OnInit {
  readonly jobService = inject(JobService);
  readonly profileService = inject(ProfileService);
  readonly linkedInApi = inject(LinkedInApiService);
  readonly toastController = inject(ToastController);
  readonly router = inject(Router);
  readonly cdr = inject(ChangeDetectorRef);

  // Quick filters with colors
  quickFilters = [
    { id: 'remote', label: 'Remoto', icon: 'wifi-outline', active: false, color: '#0ea5e9' },
    { id: 'high-salary', label: '+$80k', icon: 'cash-outline', active: false, color: '#f59e0b' },
    { id: 'today', label: 'Hoy', icon: 'time-outline', active: false, color: '#10b981' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', active: false, color: '#0077b5' },
  ];

  // Search Suggestions
  showSuggestions = false;
  readonly popularSearches = [
    'Desarrollador Frontend',
    'Desarrollador Backend',
    'Full Stack Developer',
    'React Developer',
    'Angular Developer',
    'Node.js Developer',
    'Python Developer',
    'DevOps Engineer',
    'Data Engineer',
    'Product Manager',
    'UX Designer',
    'QA Engineer',
    'Machine Learning',
    'Cloud Architect',
    'Mobile Developer',
  ];

  private searchTimeout: any;
  
  getSuggestions(): string[] {
    const query = this.jobService.searchQuery().toLowerCase().trim();
    const profileSkills = this.profileService.profile()?.skills ?? [];
    
    // Combine popular searches with profile skills
    const allSuggestions = [...new Set([...profileSkills, ...this.popularSearches])];
    
    if (!query) {
      return profileSkills.length > 0 
        ? [...profileSkills.slice(0, 4), ...this.popularSearches.slice(0, 4)]
        : this.popularSearches.slice(0, 6);
    }
    
    return allSuggestions
      .filter(s => s.toLowerCase().includes(query))
      .slice(0, 6);
  }

  // Modals
  isFilterModalOpen = false;
  isLocationModalOpen = false;
  tempMinSalary: number | null = null;

  constructor() {
    addIcons({
      'trending-up-outline': trendingUpOutline,
      'flash-outline': flashOutline,
      'layers-outline': layersOutline,
      'options-outline': optionsOutline,
      'close-outline': closeOutline,
      'filter-outline': filterOutline,
      'wifi-outline': wifiOutline,
      'refresh-outline': refreshOutline,
      'time-outline': timeOutline,
      'globe-outline': globeOutline,
      'logo-linkedin': logoLinkedin,
      'search-outline': searchOutline,
      'laptop-outline': laptopOutline,
      'business-outline': businessOutline,
      'warning-outline': warningOutline,
      'location-outline': locationOutline,
      'flag-outline': flagOutline,
      'add-outline': addOutline,
      'arrow-up-outline': arrowUpOutline,
      'ellipsis-vertical-outline': ellipsisVerticalOutline,
      'compass-outline': compassOutline,
      'chevron-down-outline': chevronDownOutline,
      'create-outline': createOutline,
      'document-text-outline': documentTextOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'arrow-forward-outline': arrowForwardOutline,
    });
  }

  ngOnInit(): void {
    this.loadJobs();
  }

  async loadJobs(): Promise<void> {
    await this.jobService.loadJobs();
    // Force change detection to update UI
    this.cdr.detectChanges();
    if (this.jobService.error()) {
      this.showToast(this.jobService.error()!, 'danger');
    }
  }

  // Search with debounce
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Show suggestions immediately
    this.showSuggestions = true;
    
    // Debounce the search update
    this.searchTimeout = setTimeout(() => {
      this.jobService.setSearchQuery(value);
    }, 100);
  }

  onSearchBlur(): void {
    // Quick delay to allow click on suggestion
    setTimeout(() => {
      this.showSuggestions = false;
    }, 150);
  }

  onSearchSubmit(): void {
    this.showSuggestions = false;
    this.jobService.loadJobs(true);
  }

  selectSuggestion(suggestion: string): void {
    this.jobService.setSearchQuery(suggestion);
    this.showSuggestions = false;
    this.jobService.loadJobs(true);
  }

  clearSearch(): void {
    this.jobService.setSearchQuery('');
    this.showSuggestions = false;
    this.jobService.loadJobs(true);
  }

  // Location selector
  getSelectedLocationName(): string {
    const location = this.jobService.location();
    if (!location) return '🌍 Todo el mundo';
    const country = this.jobService.supportedCountries.find(c => c.code === location);
    if (country) {
      const code = this.getCountryCode(country.code);
      return `${country.flag} ${code} · ${country.name}`;
    }
    return location;
  }

  getCountryCode(countryName: string): string {
    const codeMap: Record<string, string> = {
      'Spain': 'ES',
      'United States': 'US',
      'United Kingdom': 'UK',
      'Germany': 'DE',
      'France': 'FR',
      'Italy': 'IT',
      'Portugal': 'PT',
      'Mexico': 'MX',
      'Argentina': 'AR',
      'Brazil': 'BR',
      'Chile': 'CL',
      'Colombia': 'CO',
      'Peru': 'PE',
      'Canada': 'CA',
      'Australia': 'AU',
      'Netherlands': 'NL',
      'India': 'IN',
      'Japan': 'JP',
      'Singapore': 'SG',
      'Remote': '🌐',
    };
    return codeMap[countryName] || countryName.substring(0, 2).toUpperCase();
  }

  getCountryColor(countryName: string): string {
    const colorMap: Record<string, string> = {
      'Spain': '#c41e3a',
      'United States': '#3c3b6e',
      'United Kingdom': '#012169',
      'Germany': '#dd0000',
      'France': '#0055a4',
      'Italy': '#009246',
      'Portugal': '#006600',
      'Mexico': '#006847',
      'Argentina': '#74acdf',
      'Brazil': '#009c3b',
      'Chile': '#d52b1e',
      'Colombia': '#fce300',
      'Peru': '#d91023',
      'Canada': '#ff0000',
      'Australia': '#00008b',
      'Netherlands': '#21468b',
      'India': '#ff9932',
      'Japan': '#bc002d',
      'Singapore': '#ed2939',
      'Remote': '#10b981',
    };
    return colorMap[countryName] || '#64748b';
  }

  async showLocationModal(): Promise<void> {
    this.isLocationModalOpen = true;
  }

  async selectLocation(code: string): Promise<void> {
    this.jobService.setLocation(code);
    this.isLocationModalOpen = false;
    await this.jobService.loadJobs(true);
    
    const countryName = code 
      ? this.jobService.supportedCountries.find(c => c.code === code)?.name || code
      : 'Todo el mundo';
    this.showToast(`Buscando en: ${countryName}`, 'success');
  }

  // Time filter
  onTimeFilterChange(filter: TimeFilter): void {
    this.jobService.setTimeFilter(filter);
    this.quickFilters = this.quickFilters.map(f => ({
      ...f,
      active: f.id === 'today' ? filter === '24h' : f.active
    }));
  }

  // Job actions
  onToggleSave(jobId: string): void {
    this.jobService.toggleSaved(jobId);
    const isSaved = this.jobService.savedJobs().some(j => j.id === jobId);
    this.showToast(isSaved ? '💾 Oferta guardada' : '🗑️ Oferta eliminada', 'success');
  }

  onDismiss(jobId: string): void {
    this.jobService.dismissJob(jobId);
    this.showToast('Oferta descartada', 'success');
  }

  onApply(jobId: string): void {
    this.jobService.markApplied(jobId);
    this.showToast('🎉 ¡Buena suerte con tu aplicación!', 'success');
  }

  // Quick filters
  applyQuickFilter(filter: typeof this.quickFilters[0]): void {
    filter.active = !filter.active;

    switch (filter.id) {
      case 'remote':
        this.jobService.setRemoteOnly(filter.active);
        break;
      case 'high-salary':
        this.jobService.setMinSalary(filter.active ? 80000 : null);
        break;
      case 'today':
        this.jobService.setTimeFilter(filter.active ? '24h' : '7d');
        break;
      case 'linkedin':
        this.jobService.setSelectedSources(filter.active ? ['linkedin'] : ['all']);
        break;
    }
  }

  // Refresh
  async onRefresh(event: CustomEvent): Promise<void> {
    await this.jobService.loadJobs(true);
    this.cdr.detectChanges();
    (event.target as HTMLIonRefresherElement).complete();
    if (!this.jobService.error()) {
      this.showToast('✨ Ofertas actualizadas', 'success');
    }
  }

  // Retry
  async retryLoad(): Promise<void> {
    this.jobService.clearError();
    await this.loadJobs();
  }

  // Scroll to top
  scrollToTop(): void {
    document.querySelector('ion-content')?.scrollToTop(500);
  }

  // Load more
  loadMore(): void {
    this.showToast('Cargando más ofertas...', 'primary');
  }

  // Filters modal
  openFilters(): void {
    this.tempMinSalary = this.jobService.minSalary();
    this.isFilterModalOpen = true;
  }

  closeFilters(): void {
    this.isFilterModalOpen = false;
  }

  applyFilters(): void {
    this.jobService.setMinSalary(this.tempMinSalary);
    this.closeFilters();
    this.showToast('Filtros aplicados', 'success');
  }

  clearAllFilters(): void {
    this.jobService.clearFilters();
    this.tempMinSalary = null;
    this.quickFilters = this.quickFilters.map(f => ({ ...f, active: false }));
    this.showToast('Filtros limpiados', 'success');
  }

  hasActiveFilters(): boolean {
    return this.jobService.remoteOnly() || 
           !!this.jobService.minSalary() ||
           !this.jobService.selectedSources().includes('all');
  }

  activeFiltersCount(): number {
    let count = 0;
    if (this.jobService.remoteOnly()) count++;
    if (this.jobService.minSalary()) count++;
    if (!this.jobService.selectedSources().includes('all')) count++;
    return count;
  }

  isSourceSelected(sourceId: string): boolean {
    const selected = this.jobService.selectedSources();
    return sourceId === 'all' 
      ? selected.includes('all')
      : selected.includes(sourceId);
  }

  toggleSource(sourceId: string): void {
    const current = this.jobService.selectedSources();
    let newSources: string[];

    if (sourceId === 'all') {
      newSources = ['all'];
    } else {
      const withoutAll = current.filter(s => s !== 'all');
      if (current.includes(sourceId)) {
        newSources = withoutAll.filter(s => s !== sourceId);
        if (newSources.length === 0) newSources = ['all'];
      } else {
        newSources = [...withoutAll, sourceId];
      }
    }

    this.jobService.setSelectedSources(newSources);
  }

  onSalaryChange(event: CustomEvent): void {
    const value = Number(event.detail.value);
    this.tempMinSalary = value > 0 ? value : null;
  }

  tempMinSalaryDisplay(): string {
    const value = Number(this.tempMinSalary || 0);
    return `$${value}k`;
  }

  // Navigation
  goToProfile(): void {
    this.router.navigate(['/tabs/profile']);
  }

  onFlagError(event: Event, countryCode: string): void {
    // Fallback when flag image fails to load
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent) {
      parent.classList.add('flag-fallback');
      parent.setAttribute('data-code', this.getCountryCode(countryCode));
    }
  }

  // Utils
  formatTimeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'primary' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
