import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseItem } from '../../../../core/models/base-item';

@Component({
  selector: 'app-data-table',
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css'
})
export class DataTable {
  readonly items = input<BaseItem[]>([]);
  readonly displayField = input<string>('name');

  readonly deleteItem = output<string>();
  readonly deleteMany = output<string[]>();

  expandedRowKey: string | null = null;
  selectedIds = new Set<string>();

  get selectionMode(): boolean {
    return this.selectedIds.size > 0;
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

  onDeleteSingle(itemId: string, event: Event): void {
    event.stopPropagation();
    this.deleteItem.emit(itemId);
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

    return value;
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
