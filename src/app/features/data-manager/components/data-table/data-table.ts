import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseItem } from '../../../../core/models/base-item';
import { ItemPreviewColumn } from '../../../../core/models/item-table-config';
import { ItemActionButtons } from '../item-action-buttons/item-action-buttons';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule, ItemActionButtons],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTable {
  readonly items = input<BaseItem[]>([]);
  readonly previewColumns = input<ItemPreviewColumn[]>([]);
  readonly previewTextMaxLength = input<number>(30);

  readonly deleteItem = output<string>();
  readonly deleteMany = output<string[]>();
  readonly toggleEnabled = output<string>();

  expandedRowKey: string | null = null;
  selectedIds = new Set<string>();
  readonly previewSlots = [0, 1, 2, 3];
  private readonly maxPreviewColumns = 4;

  get selectionMode(): boolean {
    return this.selectedIds.size > 0;
  }

  getPreviewHeader(slotIndex: number): string {
    return this.getActivePreviewColumns()[slotIndex]?.label ?? '';
  }

  getRowKey(itemId: string, index: number): string {
    return `${itemId}::${index}`;
  }

  toggleExpand(itemId: string, index: number): void {
    const rowKey = this.getRowKey(itemId, index);
    this.expandedRowKey = this.expandedRowKey === rowKey ? null : rowKey;
  }

  isSelected(itemId: string): boolean {
    return this.selectedIds.has(itemId);
  }

  onCheckboxChange(itemId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedIds.add(itemId);
    } else {
      this.selectedIds.delete(itemId);
    }
  }

  onItemDelete(itemId: string): void {
    this.deleteItem.emit(itemId);
  }

  onItemToggleEnabled(itemId: string): void {
    this.toggleEnabled.emit(itemId);
  }

  getPreviewCellText(item: BaseItem, slotIndex: number): string {
    const column = this.getActivePreviewColumns()[slotIndex];

    if (!column) {
      return '';
    }

    const value = this.getPreviewValue(item, column.key);
    return this.truncatePreviewText(value);
  }

  getPreviewValue(item: BaseItem, key: string): unknown {
    if (key === '_id') {
      return item['_id'];
    }

    const value = item[key];

    if (key === 'enabled') {
      return value === true ? 'Active' : 'Inactive';
    }

    return this.normalizeDetailValue(value);
  }

  isRowDisabled(item: BaseItem): boolean {
    return item['enabled'] === false;
  }

  onBulkDelete(): void {
    this.deleteMany.emit(Array.from(this.selectedIds));
    this.clearSelection();
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  getObjectEntries(item: BaseItem): Array<{ key: string; value: unknown }> {
    return Object.entries(item)
      .filter(([key]) => !(key === 'id' && Object.prototype.hasOwnProperty.call(item, '_id')))
      .map(([key, value]) => ({ key, value: this.normalizeDetailValue(value) }));
  }

  private normalizeDetailValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      const ids = value
        .map((item) => this.findNestedObjectId(item))
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      return ids.length > 0 ? ids.join(', ') : '-';
    }

    if (typeof value === 'object') {
      return this.findNestedObjectId(value) ?? '-';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    return value;
  }

  private truncatePreviewText(value: unknown): string {
    const text = this.valueToText(value);
    const maxLength = Math.max(1, this.previewTextMaxLength());

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}...`;
  }

  private valueToText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return String(this.normalizeDetailValue(value));
  }

  private getActivePreviewColumns(): ItemPreviewColumn[] {
    return this.previewColumns().slice(0, this.maxPreviewColumns);
  }

  private findNestedObjectId(value: unknown): string | null {
    if (value === null || value === undefined || typeof value !== 'object') {
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedId = this.findNestedObjectId(item);
        if (nestedId) {
          return nestedId;
        }
      }

      return null;
    }

    const objectValue = value as Record<string, unknown>;
    const ownId = objectValue['_id'];

    if (typeof ownId === 'string' && ownId.trim().length > 0) {
      return ownId;
    }

    if (typeof ownId === 'number' && Number.isFinite(ownId)) {
      return String(ownId);
    }

    for (const nestedValue of Object.values(objectValue)) {
      const nestedId = this.findNestedObjectId(nestedValue);
      if (nestedId) {
        return nestedId;
      }
    }

    return null;
  }
}
