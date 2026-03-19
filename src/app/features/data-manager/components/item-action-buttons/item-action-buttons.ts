import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseItem } from '../../../../core/models/base-item';

@Component({
  selector: 'app-item-action-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="action-buttons">
      <button
        type="button"
        class="action-btn action-btn--enabled"
        (click)="onToggleEnabled($event)"
        [attr.aria-label]="isEnabled() ? 'Disable item' : 'Enable item'"
        [title]="isEnabled() ? 'Disable' : 'Enable'"
      >
        <span class="action-btn__icon">☑</span>
      </button>

      <button
        type="button"
        class="action-btn action-btn--delete"
        (click)="onDelete($event)"
        aria-label="Delete item"
        title="Delete"
      >
        <span class="action-btn__icon">🗑</span>
      </button>
    </div>
  `,
  styles: [`
    .action-buttons {
      display: flex;
      width: 100%;
      justify-content: flex-end;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      transition: all 0.2s ease;
    }

    .action-btn__icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn--enabled {
      background: #dbeafe;
      color: #0c4a6e;
    }

    .action-btn--enabled:hover {
      background: #bfdbfe;
    }

    .action-btn--enabled:active {
      transform: scale(0.95);
    }

    .action-btn--delete {
      background: #fee2e2;
      color: #b91c1c;
    }

    .action-btn--delete:hover {
      background: #fecaca;
    }

    .action-btn--delete:active {
      transform: scale(0.95);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemActionButtons {
  readonly item = input.required<BaseItem>();
  readonly inSelectionMode = input<boolean>(false);

  readonly deleteClick = output<string>();
  readonly toggleEnabledClick = output<string>();

  isEnabled(): boolean {
    return this.item()['enabled'] !== false;
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    if (!this.inSelectionMode()) {
      this.deleteClick.emit(this.item().id);
    }
  }

  onToggleEnabled(event: Event): void {
    event.stopPropagation();
    if (!this.inSelectionMode()) {
      this.toggleEnabledClick.emit(this.item().id);
    }
  }
}
