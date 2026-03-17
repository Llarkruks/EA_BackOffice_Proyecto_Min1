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

  expandedRowId: string | null = null;
  selectedIds = new Set<string>();

  get selectionMode(): boolean {
    return this.selectedIds.size > 0;
  }

  toggleExpand(itemId: string): void {
    this.expandedRowId = this.expandedRowId === itemId ? null : itemId;
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
    return Object.entries(item).map(([key, value]) => ({ key, value }));
  }
}