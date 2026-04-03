import { Component, input, output } from '@angular/core';
import { TimeFilter } from '../../../../core/models/job.model';

@Component({
  selector: 'app-time-filter',
  standalone: true,
  template: `
    <div class="tw-flex tw-gap-2 tw-px-4 tw-py-2 tw-overflow-x-auto tw-scrollbar-none">
      @for (option of options; track option.value) {
        <button
          (click)="selected.emit(option.value)"
          class="tw-px-3 tw-py-1.5 tw-rounded-full tw-text-xs tw-font-medium tw-whitespace-nowrap tw-transition-colors tw-border"
          [class]="
            current() === option.value
              ? 'tw-bg-emerald-600 tw-text-white tw-border-emerald-600'
              : 'tw-bg-white tw-text-slate-600 tw-border-slate-200 hover:tw-bg-slate-50'
          "
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class TimeFilterComponent {
  readonly current = input.required<TimeFilter>();
  readonly selected = output<TimeFilter>();

  readonly options: { value: TimeFilter; label: string }[] = [
    { value: '24h', label: 'Últimas 24h' },
    { value: '48h', label: 'Últimas 48h' },
    { value: '7d', label: '7 días' },
    { value: '30d', label: '30 días' },
    { value: 'all', label: 'Todas' },
  ];
}
