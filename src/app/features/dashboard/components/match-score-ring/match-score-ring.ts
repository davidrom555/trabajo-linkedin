import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-match-score-ring',
  standalone: true,
  template: `
    <div class="match-ring-container" [style.width.px]="size()" [style.height.px]="size()">
      <!-- Background glow for high scores -->
      @if (score() >= 75) {
        <div class="score-glow" [style.background]="glowColor()"></div>
      }
      
      <svg 
        [attr.width]="size()" 
        [attr.height]="size()" 
        class="match-ring-svg"
        [style.animation]="isAnimated() ? 'rotate-in 0.6s ease-out' : ''"
      >
        <!-- Definition for gradient -->
        <defs>
          <linearGradient [id]="gradientId()" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" [attr.stop-color]="gradientStart()" />
            <stop offset="100%" [attr.stop-color]="gradientEnd()" />
          </linearGradient>
        </defs>
        
        <!-- Background track -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="trackColor()"
          [attr.stroke-width]="strokeWidth()"
          class="track-circle"
        />
        
        <!-- Progress arc with gradient -->
        <circle
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.r]="radius()"
          fill="none"
          [attr.stroke]="'url(#' + gradientId() + ')'"
          [attr.stroke-width]="strokeWidth()"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="dashOffset()"
          stroke-linecap="round"
          class="progress-circle"
          [style.animation]="isAnimated() ? 'progress-fill 1s ease-out 0.3s forwards' : ''"
        />
      </svg>
      
      <!-- Score label -->
      <div class="score-content" [class]="labelClass()">
        <span class="score-value" [style.color]="scoreColor()">{{ score() }}</span>
        <span class="score-percent" [style.color]="scoreColor()">%</span>
      </div>
      
      <!-- Match text -->
      @if (showLabel()) {
        <span class="match-text" [style.color]="scoreColor()">{{ matchText() }}</span>
      }
    </div>
  `,
  styles: `
    .match-ring-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .score-glow {
      position: absolute;
      width: 120%;
      height: 120%;
      border-radius: 50%;
      opacity: 0.3;
      filter: blur(12px);
      animation: pulse-glow 2s ease-in-out infinite;
    }
    
    @keyframes pulse-glow {
      0%, 100% { transform: scale(0.9); opacity: 0.3; }
      50% { transform: scale(1.1); opacity: 0.5; }
    }
    
    .match-ring-svg {
      transform: rotate(-90deg);
    }
    
    .track-circle {
      opacity: 0.3;
    }
    
    .progress-circle {
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes rotate-in {
      from {
        transform: rotate(-180deg) scale(0.8);
        opacity: 0;
      }
      to {
        transform: rotate(-90deg) scale(1);
        opacity: 1;
      }
    }
    
    @keyframes progress-fill {
      from {
        stroke-dashoffset: var(--circumference);
      }
    }
    
    .score-content {
      position: absolute;
      display: flex;
      align-items: baseline;
      justify-content: center;
      font-weight: 700;
    }
    
    .score-value {
      font-size: inherit;
      line-height: 1;
    }
    
    .score-percent {
      font-size: 0.6em;
      font-weight: 600;
      margin-left: 1px;
    }
    
    .size-xl {
      font-size: 28px;
    }
    
    .size-lg {
      font-size: 22px;
    }
    
    .size-md {
      font-size: 16px;
    }
    
    .size-sm {
      font-size: 12px;
    }
    
    .match-text {
      position: absolute;
      bottom: -18px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
  `,
})
export class MatchScoreRingComponent {
  readonly score = input.required<number>();
  readonly size = input(48);
  readonly strokeWidth = input(4);
  readonly showLabel = input(false);
  readonly isAnimated = input(true);

  readonly center = computed(() => this.size() / 2);
  readonly radius = computed(() => (this.size() - this.strokeWidth() * 2) / 2);
  readonly circumference = computed(() => 2 * Math.PI * this.radius());

  readonly dashOffset = computed(() => {
    const progress = Math.min(Math.max(this.score(), 0), 100) / 100;
    return this.circumference() * (1 - progress);
  });

  readonly gradientId = computed(() => `gradient-${Math.random().toString(36).substr(2, 9)}`);

  readonly scoreColor = computed(() => {
    const s = this.score();
    if (s >= 80) return '#059669'; // Emerald 600
    if (s >= 60) return '#0ea5e9'; // Sky 500
    if (s >= 40) return '#f59e0b'; // Amber 500
    return '#ef4444'; // Red 500
  });

  readonly gradientStart = computed(() => {
    const s = this.score();
    if (s >= 80) return '#34d399'; // Emerald 400
    if (s >= 60) return '#38bdf8'; // Sky 400
    if (s >= 40) return '#fbbf24'; // Amber 400
    return '#f87171'; // Red 400
  });

  readonly gradientEnd = computed(() => {
    const s = this.score();
    if (s >= 80) return '#059669'; // Emerald 600
    if (s >= 60) return '#0284c7'; // Sky 600
    if (s >= 40) return '#d97706'; // Amber 600
    return '#dc2626'; // Red 600
  });

  readonly trackColor = computed(() => {
    const s = this.score();
    if (s >= 80) return '#d1fae5';
    if (s >= 60) return '#e0f2fe';
    if (s >= 40) return '#fef3c7';
    return '#fee2e2';
  });

  readonly glowColor = computed(() => {
    const s = this.score();
    if (s >= 80) return '#34d399';
    if (s >= 60) return '#38bdf8';
    if (s >= 40) return '#fbbf24';
    return '#f87171';
  });

  readonly labelClass = computed(() => {
    const s = this.size();
    if (s >= 80) return 'size-xl';
    if (s >= 64) return 'size-lg';
    if (s >= 48) return 'size-md';
    return 'size-sm';
  });

  readonly matchText = computed(() => {
    const s = this.score();
    if (s >= 90) return 'Perfecto';
    if (s >= 75) return 'Excelente';
    if (s >= 60) return 'Bueno';
    if (s >= 40) return 'Regular';
    return 'Bajo';
  });
}
