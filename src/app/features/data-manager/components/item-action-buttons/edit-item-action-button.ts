import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-edit-item-action-button',
  template: `
    <button
      type="button"
      class="action-btn action-btn--edit"
      (click)="onEdit($event)"
      aria-label="Edit item"
      title="Edit item"
    >
      <span class="action-btn__icon">✏️</span>
    </button>
  `,
  styles: [`
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

    .action-btn--edit {
      background: #f3f4f6;
      color: #111827;
    }

    .action-btn--edit:hover {
      background: #e5e7eb;
    }

    .action-btn--edit:active {
      transform: scale(0.95);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditItemActionButton {
  itemId = input.required<string>();
  inSelectionMode = input(false);
  editClick = output<string>();

  onEdit(event: Event): void {
    event.stopPropagation();

    if (!this.inSelectionMode()) {
      this.editClick.emit(this.itemId());
    }
  }
}