import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseItem } from '../../../../core/models/base-item';
import { DeleteItemActionButton } from './delete-item-action-button';
import { ToggleEnabledActionButton } from './toggle-enabled-action-button';

@Component({
  selector: 'app-item-action-buttons',
  imports: [CommonModule, ToggleEnabledActionButton, DeleteItemActionButton],
  template: `
    <div class="action-buttons">
      <app-toggle-enabled-action-button
        [item]="item()"
        [inSelectionMode]="inSelectionMode()"
        (toggleEnabledClick)="toggleEnabledClick.emit($event)"
      />

      <app-delete-item-action-button
        [itemId]="item().id"
        [inSelectionMode]="inSelectionMode()"
        (deleteClick)="deleteClick.emit($event)"
      />
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemActionButtons {
  readonly item = input.required<BaseItem>();
  readonly inSelectionMode = input<boolean>(false);

  readonly deleteClick = output<string>();
  readonly toggleEnabledClick = output<string>();
}
