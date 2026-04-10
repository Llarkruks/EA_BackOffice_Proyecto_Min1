import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ItemModelBase } from '../../../../core/models/items';

@Component({
  selector: 'app-toggle-enabled-action-button',
  template: `
    <button
      type="button"
      class="action-btn action-btn--enabled"
      (click)="onToggleEnabled($event)"
      [attr.aria-label]="isEnabled() ? 'Disable item' : 'Enable item'"
      [title]="isEnabled() ? 'Disable' : 'Enable'"
    >
      <span class="action-btn__icon">{{ enabledIcon() }}</span>
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleEnabledActionButton {
  readonly item = input.required<ItemModelBase>();
  readonly inSelectionMode = input<boolean>(false);

  readonly toggleEnabledClick = output<string>();

  isEnabled(): boolean {
    return this.item()['enabled'] !== false;
  }

  enabledIcon(): string {
    return this.isEnabled() ? '☑' : '☐';
  }

  onToggleEnabled(event: Event): void {
    event.stopPropagation();

    if (!this.inSelectionMode()) {
      this.toggleEnabledClick.emit(this.item().id);
    }
  }
}
