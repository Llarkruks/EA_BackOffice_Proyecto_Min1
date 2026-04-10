import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemActionConfig, ItemModelBase, ItemPreviewColumn } from '../../../../core/models/items';
import { ItemActionButtons } from '../item-action-buttons/item-action-buttons';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule, ItemActionButtons],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTable {
  readonly items = input<ItemModelBase[]>([]);
  readonly previewColumns = input<ItemPreviewColumn[]>([]);
  readonly actionConfig = input<ItemActionConfig>({
    edit: true,
    delete: true,
    toggleEnabled: false
  });
  readonly previewTextMaxLength = input(30);
  readonly selectedIds = input<string[]>([]);

  readonly deleteItem = output<string>();
  readonly deleteMany = output<string[]>();
  readonly toggleEnabled = output<string>();
  readonly editItem = output<string>();
  readonly selectedIdsChange = output<string[]>();

  expandedRowKey: string | null = null;
  private readonly maxPreviewColumns = 4;

  readonly activePreviewColumns = computed(() => {
    return this.previewColumns().slice(0, this.maxPreviewColumns);
  });

  readonly tableGridTemplateColumns = computed(() => {
    const previewCount = Math.max(1, this.activePreviewColumns().length);
    return `52px repeat(${previewCount}, minmax(0, 1fr)) 112px`;
  });

  get selectionMode(): boolean {
    return this.selectedIds().length > 0;
  }

  get selectedCount(): number {
    return this.selectedIds().length;
  }

  getRowKey(itemId: string, index: number): string {
    return `${itemId}::${index}`;
  }

  toggleExpand(itemId: string, index: number): void {
    const rowKey = this.getRowKey(itemId, index);
    this.expandedRowKey = this.expandedRowKey === rowKey ? null : rowKey;
  }

  isSelected(itemId: string): boolean {
    return this.getSelectedIdSet().has(itemId);
  }

  onCheckboxChange(itemId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const next = new Set(this.getSelectedIdSet());

    if (checked) {
      next.add(itemId);
    } else {
      next.delete(itemId);
    }

    this.selectedIdsChange.emit(Array.from(next));
  }

  onItemDelete(itemId: string): void {
    this.deleteItem.emit(itemId);
  }

  onItemToggleEnabled(itemId: string): void {
    this.toggleEnabled.emit(itemId);
  }

  onItemEdit(itemId: string): void {
    this.editItem.emit(itemId);
  }

  getPreviewCellText(item: ItemModelBase, column: ItemPreviewColumn): string {
    const value = this.getPreviewValue(item, column.key);
    return this.truncatePreviewText(value);
  }

  getPreviewValue(item: ItemModelBase, key: string): unknown {
    if (key === '_id') {
      return item['_id'];
    }

    const value = item[key];

    if (key === 'enabled') {
      return value === true ? 'Active' : 'Inactive';
    }

    return this.normalizeDetailValue(value);
  }

  isRowDisabled(item: ItemModelBase): boolean {
    return item['enabled'] === false;
  }

  onBulkDelete(): void {
    this.deleteMany.emit(this.selectedIds());
    this.clearSelection();
  }

  clearSelection(): void {
    this.selectedIdsChange.emit([]);
  }

  getObjectEntries(item: ItemModelBase): Array<{ key: string; value: unknown }> {
    return Object.entries(item)
      .filter(([key]) => !(key === 'id' && Object.prototype.hasOwnProperty.call(item, '_id')))
      .map(([key, value]) => ({
        key,
        value: this.normalizeDetailValue(value)
      }));
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

  private getSelectedIdSet(): Set<string> {
    return new Set(this.selectedIds());
  }

  private findNestedObjectId(value: unknown): string | null {
    if (value === null || value === undefined || typeof value !== 'object') {
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedId = this.findNestedObjectId(item);
        if (nestedId) return nestedId;
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
      if (nestedId) return nestedId;
    }

    return null;
  }
}