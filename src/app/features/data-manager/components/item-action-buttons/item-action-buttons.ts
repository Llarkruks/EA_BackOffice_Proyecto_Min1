import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemActionConfig, ItemModelBase } from '../../../../core/models/items';
import { DeleteItemActionButton } from './delete-item-action-button';
import { ToggleEnabledActionButton } from './toggle-enabled-action-button';
import { EditItemActionButton } from './edit-item-action-button';

@Component({
  selector: 'app-item-action-buttons',
  imports: [
    CommonModule,
    EditItemActionButton,
    ToggleEnabledActionButton,
    DeleteItemActionButton
  ],
  template: `
    <div class="action-buttons">
      @if (showEdit()) {
        <app-edit-item-action-button
          [itemId]="item()._id"
          [inSelectionMode]="inSelectionMode()"
          (editClick)="onEditClick($event)"
        />
      }

      @if (showToggleEnabled()) {
        <app-toggle-enabled-action-button
          [item]="item()"
          [inSelectionMode]="inSelectionMode()"
          (toggleEnabledClick)="toggleEnabledClick.emit($event)"
        />
      }

      @if (showDelete()) {
        <app-delete-item-action-button
          [itemId]="item()._id"
          [inSelectionMode]="inSelectionMode()"
          (deleteClick)="deleteClick.emit($event)"
        />
      }
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
  item = input.required<ItemModelBase>();
  actionConfig = input<ItemActionConfig>({
    edit: true,
    delete: true,
    toggleEnabled: false
  });
  inSelectionMode = input(false);

  deleteClick = output<string>();
  toggleEnabledClick = output<string>();
  editClick = output<string>();

  onEditClick(itemId: string): void {
    this.editClick.emit(itemId);
  }

  showEdit(): boolean {
    return this.actionConfig().edit;
  }

  showDelete(): boolean {
    return this.actionConfig().delete;
  }

  showToggleEnabled(): boolean {
    return this.actionConfig().toggleEnabled && typeof this.item().enabled === 'boolean';
  }
}