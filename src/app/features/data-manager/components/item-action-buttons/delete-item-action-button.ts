import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-item-action-button',
  template: `
    <button
      type="button"
      class="action-btn action-btn--delete"
      (click)="onDelete($event)"
      aria-label="Delete item"
      title="Delete"
    >
      <span class="action-btn__icon">🗑</span>
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
export class DeleteItemActionButton {
  itemId = input.required<string>();
  inSelectionMode = input<boolean>(false);

  deleteClick = output<string>();

  onDelete(event: Event): void {
    event.stopPropagation();

    if (!this.inSelectionMode()) {
      this.deleteClick.emit(this.itemId());
    }
  }
}
